import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { getTrainingRecordByUser } from '../../../lib/db'
import { checkSubscriptionAccess, incrementGenerationUsage } from '../../../lib/subscription'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt } = await request.json()
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const userId = session.user.id
    console.log('🎨 Generating image for user:', userId)

    // Check subscription access before generating
    const subscriptionCheck = await checkSubscriptionAccess(userId)
    if (!subscriptionCheck.hasAccess) {
      return NextResponse.json({ 
        error: 'Subscription access required',
        reason: subscriptionCheck.reason,
        generationsRemaining: subscriptionCheck.generationsRemaining
      }, { status: 403 })
    }

    console.log(`✅ Subscription check passed. Generations remaining: ${subscriptionCheck.generationsRemaining}`)

    // Get the user's latest training record
    const trainingRecord = await getTrainingRecordByUser(userId)
    
    if (!trainingRecord) {
      return NextResponse.json({ error: 'No training record found' }, { status: 400 })
    }

    if (trainingRecord.status !== 'succeeded') {
      return NextResponse.json({ 
        error: `Training not ready. Status: ${trainingRecord.status}` 
      }, { status: 400 })
    }

    if (!trainingRecord.version) {
      return NextResponse.json({ error: 'No trained model version available' }, { status: 400 })
    }

    console.log('🚀 Generating with model:', trainingRecord.version)

    // Generate image using the trained model
    const output = await replicate.run(trainingRecord.version as `${string}/${string}:${string}`, {
      input: {
        prompt: prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 80,
      }
    })

    // Extract the image URL from the output
    const imageUrl = Array.isArray(output) ? output[0] : output

    console.log('✅ Image generated:', imageUrl)

    // Increment generation usage
    const usageIncremented = await incrementGenerationUsage(userId)
    if (!usageIncremented) {
      console.warn('⚠️ Failed to increment generation usage for user:', userId)
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      trainingId: trainingRecord.id,
      generationsRemaining: subscriptionCheck.generationsRemaining - 1
    })

  } catch (error) {
    console.error('❌ Generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate image',
      details: (error as Error).message
    }, { status: 500 })
  }
} 