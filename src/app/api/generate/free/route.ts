import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { put } from '@vercel/blob'
import { auth } from '../../../../../auth'
import { PrismaClient } from '../../../../generated/prisma'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

const prisma = new PrismaClient()




const PRE_TRAINED_MODEL_VERSIONS = {
  'tom': 'tomdekan/tom_dekan_1752422189331:3ebd0700046224792d7fd4f01069c7e54408d8d95d697f052607ddd000ec392e',
}

const FREE_GENERATION_LIMIT = 30;

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has exceeded the free generation limit
    if (user.freeGenerationsUsed >= FREE_GENERATION_LIMIT) {
      return NextResponse.json({ error: 'You have used all your free generations.' }, { status: 403 })
    }

    const { prompt, model } = await request.json()
    
    if (!prompt || !model) {
      return NextResponse.json({ error: 'Prompt and model are required' }, { status: 400 })
    }

    const modelVersion = PRE_TRAINED_MODEL_VERSIONS[model as keyof typeof PRE_TRAINED_MODEL_VERSIONS]
    if (!modelVersion) {
      return NextResponse.json({ error: 'Invalid model selected' }, { status: 400 })
    }

    console.log(`🎨 Generating free image for user: ${userId} with model: ${model}`)

    // Generate image using the selected pre-trained model
    const output = await replicate.run(modelVersion as `${string}/${string}:${string}`, {
      input: {
        prompt: prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 90,
        disable_safety_checker: true,
      }
    })

    const firstOutput = Array.isArray(output) ? output[0] : output;
    let imageUrl: string;

    if (firstOutput && typeof firstOutput === 'object' && 'url' in firstOutput) {
        const urlObject = firstOutput.url();
        imageUrl = urlObject.toString();
    } else if (typeof firstOutput === 'string') {
        imageUrl = firstOutput;
    } else {
        console.error('❌ Unexpected output format:', firstOutput);
        throw new Error('Unexpected output format from model');
    }

    console.log('✅ Free image generated:', imageUrl)

    // Download and save the image to our blob storage
    console.log('💾 Saving free image to blob storage...')
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image')
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const filename = `free-generated-${Date.now()}-${userId}.webp`
    
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: 'image/webp',
    })
    
    console.log('✅ Free image saved to blob storage:', blob.url)

    // Save to database and increment free usage counter
    console.log('💾 Saving free image record to database...')
    const [generatedImage] = await prisma.$transaction([
      prisma.generatedImage.create({
        data: {
          userId,
          prompt,
          imageUrl: blob.url,
          originalUrl: imageUrl,
          modelVersion: modelVersion,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { freeGenerationsUsed: { increment: 1 } },
      }),
    ]);
    
    console.log('✅ Free generated image record created:', generatedImage.id)

    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
    })

  } catch (error) {
    console.error('❌ Free generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate image',
      details: (error as Error).message
    }, { status: 500 })
  }
} 