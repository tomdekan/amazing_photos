import { put } from '@vercel/blob'
import JSZip from 'jszip'
import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { auth } from '../../../../auth'
import {
    createTrainingRecord,
    getPendingUploadsByUser,
    linkUploadedImagesToTraining,
    updateBatchProcessingStatus
} from '../../../lib/db'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

// Define a type for the training configuration
type TrainingConfig = {
  destination: `${string}/${string}`
  input: {
    input_images: string
    trigger_word: string
    lora_type: string
    steps: number
    autocaption: boolean
  }
  webhook?: string
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sex } = (await request.json()) as { sex: 'male' | 'female' | '' };

    if (!sex) {
      return NextResponse.json({ error: 'Sex is a required field' }, { status: 400 });
    }

    const user = session.user
    const userId = user.id
    console.info('🚀 Starting training for user:', userId)

    // Get all pending uploads for this user
    const pendingUploads = await getPendingUploadsByUser(userId)
    
    if (pendingUploads.length === 0) {
      return NextResponse.json({ error: 'No pending uploads found' }, { status: 400 })
    }

    console.info(`📦 Found ${pendingUploads.length} pending uploads`)

    // Group by uploadBatchId to process the most recent batch
    const batchGroups = pendingUploads.reduce((groups, upload) => {
      const batchId = upload.uploadBatchId || 'no-batch'
      if (!groups[batchId]) groups[batchId] = []
      groups[batchId].push(upload)
      return groups
    }, {} as Record<string, typeof pendingUploads>)

    // Process the most recent batch
    const latestBatchId = Object.keys(batchGroups).sort().pop()
    if (!latestBatchId || latestBatchId === 'no-batch') {
      return NextResponse.json({ error: 'No valid batch found' }, { status: 400 })
    }

    const batchUploads = batchGroups[latestBatchId]
    console.info(`📦 Processing batch ${latestBatchId} with ${batchUploads.length} files`)

    // Mark batch as processing
    await updateBatchProcessingStatus(latestBatchId, 'processing')

    // Create ZIP from uploaded blobs
    console.info('🗜️ Creating ZIP file...')
    const zip = new JSZip()
    
    for (const upload of batchUploads) {
      // Download the blob content to add to ZIP
      const response = await fetch(upload.blobUrl)
      const arrayBuffer = await response.arrayBuffer()
      zip.file(upload.filename, arrayBuffer)
    }
    
    const zipBlob = await zip.generateAsync({ type: 'arraybuffer' })
    console.info(`✅ ZIP created: ${zipBlob.byteLength} bytes`)

    // Upload ZIP to blob storage
    const zipBlobResult = await put('training-images.zip', zipBlob, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/zip',
    })
    console.info(`✅ ZIP uploaded: ${zipBlobResult.url}`)

    // Start Replicate training using fast-flux-trainer with hardcoded values
    
    // For localhost development, we can't use webhooks since Replicate can't reach localhost
    // In production, use the proper webhook URL
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? `${process.env.VERCEL_URL}/api/training-webhook`
      : undefined
    
    // Create a unique model name using user's name in snake case + timestamp
    const userName = user.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'user'
    const timestamp = Date.now()
    const modelName = `${userName}_${timestamp}`
    
    if (!process.env.REPLICATE_USERNAME) {
      return NextResponse.json({ error: 'REPLICATE_USERNAME environment variable is not set.' }, { status: 500 })
    }
    
    const destination = `${process.env.REPLICATE_USERNAME}/${modelName}` as const
    
    console.info('📝 Training destination:', destination)
    
    try {
      console.info('🏗️ Creating destination model...')
      await replicate.models.create(
        process.env.REPLICATE_USERNAME,
        modelName,
        {
          description: `Personalized model for ${user.name || 'user'}`,
          visibility: 'private',
          hardware: 'gpu-t4',
        }
      )
      console.info('✅ Destination model created:', destination)
    } catch (modelError: unknown) {
      // If model already exists, that's fine, otherwise re-throw
      if (!(modelError instanceof Error && modelError.message.includes('already exists'))) {
        console.error('❌ Error creating model:', modelError)
        const message = modelError instanceof Error ? modelError.message : 'An unknown error occurred'
        throw new Error(`Failed to create destination model: ${message}`)
      }
      console.info('ℹ️ Model already exists, continuing...')
    }
    
    const trainingConfig: TrainingConfig = {
      destination,
      input: {
        input_images: zipBlobResult.url,
        trigger_word: 'TOK',
        lora_type: 'subject',
        steps: 1000,
        autocaption: true,
      },
    }
    
    // Only add webhook in production
    if (webhookUrl) {
      trainingConfig.webhook = webhookUrl
    }
    
    try {
      const training = await replicate.trainings.create(
        'replicate',
        'fast-flux-trainer',
        '8b10794665aed907bb98a1a5324cd1d3a8bea0e9b31e65210967fb9c9e2e08ed',
        trainingConfig
      )
      
      console.info('✅ Replicate training created:', training.id)
      console.info('📍 Model will be saved to:', destination)

      // Create training record in database
      const trainingRecord = await createTrainingRecord({
        id: training.id,
        userId,
        status: training.status,
        replicateId: training.id,
        sex,
      })
      console.info('✅ Training record created:', trainingRecord.id)

      // Link all images in this batch to training
      await linkUploadedImagesToTraining(userId, trainingRecord.id)
      console.info('✅ Images linked to training')

      // Mark batch as completed
      await updateBatchProcessingStatus(latestBatchId, 'completed')
      console.info('✅ Batch processing completed')

      return NextResponse.json({
        success: true,
        trainingId: training.id,
        status: training.status,
        destination,
        message: 'Training started successfully'
      })
      
    } catch (replicateError: unknown) {
      console.error('❌ Replicate training error:', replicateError)
      
      // If the error is about destination not existing, provide a helpful message
      if (replicateError instanceof Error && replicateError.message.includes('destination does not exist')) {
        return NextResponse.json({
          error: 'Model destination error',
          details: `Please ensure the Replicate username "${process.env.REPLICATE_USERNAME}" is correct and you have permission to create models.`,
          suggestion: 'Check your REPLICATE_USERNAME environment variable'
        }, { status: 400 })
      }
      
      return NextResponse.json({ error: 'Failed to start training', details: replicateError instanceof Error ? replicateError.message : 'An unknown error occurred' }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error starting training:', error)
    return NextResponse.json({
      error: 'Failed to start training',
      details: (error as Error).message
    }, { status: 500 })
  }
} 