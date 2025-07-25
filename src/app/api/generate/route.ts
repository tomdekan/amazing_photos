import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { put } from '@vercel/blob'
import { auth } from '../../../../auth'
import { getTrainingRecordByUser, createGeneratedImageRecord } from '../../../lib/db'
import { enhancePrompt } from '../../../lib/promptHelper'
import { checkSubscriptionAccess, incrementGenerationUsage } from '../../../lib/subscription'

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
    console.info('🎨 Generating image for user:', userId)

    // Check subscription access before generating
    const subscriptionCheck = await checkSubscriptionAccess(userId)
    if (!subscriptionCheck.hasAccess) {
      return NextResponse.json({ 
        error: 'Subscription access required',
        reason: subscriptionCheck.reason,
        generationsRemaining: subscriptionCheck.generationsRemaining
      }, { status: 403 })
    }

    console.info(`✅ Subscription check passed. Generations remaining: ${subscriptionCheck.generationsRemaining}`)

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

    console.info('🚀 Generating with model:', trainingRecord.version)

    // Generate image using the trained model
    const enhancedPrompt = enhancePrompt(prompt, trainingRecord.sex)
    const output = await replicate.run(trainingRecord.version as `${string}/${string}:${string}`, {
      input: {
        prompt: enhancedPrompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 90,
        disable_safety_checker: true,
      }
    })

    // Extract the image URL from the output
    let imageUrl: string
    const firstOutput = Array.isArray(output) ? output[0] : output
    

    
    // Handle FileOutput objects (newer Replicate client returns streams)
    if (firstOutput && typeof firstOutput === 'object' && 'url' in firstOutput) {
      const urlObject = firstOutput.url()
      imageUrl = urlObject.toString() // Convert URL object to string
    } else if (typeof firstOutput === 'string') {
      imageUrl = firstOutput
    } else {
      console.error('❌ Unexpected output format:', firstOutput)
      throw new Error('Unexpected output format from model')
    }

    console.info('✅ Image generated:', imageUrl)

    // Download and save the image to our blob storage
    console.info('💾 Saving image to blob storage...')
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image')
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const filename = `generated-${Date.now()}-${userId}.webp`
    
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: 'image/webp',
    })
    
    console.info('✅ Image saved to blob storage:', blob.url)

    // Save to database
    console.info('💾 Saving to database...')
    const generatedImage = await createGeneratedImageRecord({
      userId,
      prompt,
      imageUrl: blob.url, // Our blob storage URL
      originalUrl: imageUrl, // Original Replicate URL
      trainingId: trainingRecord.id,
      modelVersion: trainingRecord.version,
    })
    
    console.info('✅ Generated image record created:', generatedImage.id)

    // Increment generation usage
    const usageIncremented = await incrementGenerationUsage(userId)
    if (!usageIncremented) {
      console.warn('⚠️ Failed to increment generation usage for user:', userId)
    }

    return NextResponse.json({
      success: true,
      imageUrl: blob.url, // Return our blob storage URL
      originalUrl: imageUrl, // Also include original URL
      generatedImageId: generatedImage.id,
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


