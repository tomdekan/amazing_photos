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

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const userId = user.id
    console.log('🚀 Starting training for user:', userId)

    // Get all pending uploads for this user
    const pendingUploads = await getPendingUploadsByUser(userId)
    
    if (pendingUploads.length === 0) {
      return NextResponse.json({ error: 'No pending uploads found' }, { status: 400 })
    }

    console.log(`📦 Found ${pendingUploads.length} pending uploads`)

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
    console.log(`📦 Processing batch ${latestBatchId} with ${batchUploads.length} files`)

    // Mark batch as processing
    await updateBatchProcessingStatus(latestBatchId, 'processing')

    // Create ZIP from uploaded blobs
    console.log('🗜️ Creating ZIP file...')
    const zip = new JSZip()
    
    for (const upload of batchUploads) {
      // Download the blob content to add to ZIP
      const response = await fetch(upload.blobUrl)
      const arrayBuffer = await response.arrayBuffer()
      zip.file(upload.filename, arrayBuffer)
    }
    
    const zipBlob = await zip.generateAsync({ type: 'arraybuffer' })
    console.log(`✅ ZIP created: ${zipBlob.byteLength} bytes`)

    // Upload ZIP to blob storage
    const zipBlobResult = await put('training-images.zip', zipBlob, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/zip',
    })
    console.log(`✅ ZIP uploaded: ${zipBlobResult.url}`)

    // Start Replicate training using fast-flux-trainer with hardcoded values
    console.log('🚀 Starting Replicate fast-flux training...')
    
    // For localhost development, we can't use webhooks since Replicate can't reach localhost
    // In production, use the proper webhook URL
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? `${process.env.VERCEL_URL}/api/training-webhook`
      : undefined
    
    // Create a unique model name using user's name in snake case + timestamp
    const userName = user.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'user'
    const timestamp = Date.now()
    const modelName = `${userName}_${timestamp}`
    const destination = `${process.env.REPLICATE_USERNAME}/${modelName}`
    
    console.log('📝 Training destination:', destination)
    
    try {
      // First, create the destination model
      console.log('🏗️ Creating destination model...')
      await replicate.models.create(
        process.env.REPLICATE_USERNAME,
        modelName,
        {
          description: `Personalized FLUX model for ${user.name || 'user'}`,
          visibility: 'private',
          hardware: 'gpu-t4',
        }
      )
      console.log('✅ Destination model created:', destination)
    } catch (modelError: any) {
      // If model already exists, that's fine
      if (!modelError.message?.includes('already exists')) {
        console.error('❌ Error creating model:', modelError)
        throw new Error(`Failed to create destination model: ${modelError.message}`)
      }
      console.log('ℹ️ Model already exists, continuing...')
    }
    
    const trainingConfig: any = {
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
      
      console.log('✅ Replicate training created:', training.id)
      console.log('📍 Model will be saved to:', destination)

      // Create training record in database
      const trainingRecord = await createTrainingRecord({
        id: training.id,
        userId,
        status: training.status,
        replicateId: training.id,
      })
      console.log('✅ Training record created:', trainingRecord.id)

      // Link all images in this batch to training
      await linkUploadedImagesToTraining(userId, trainingRecord.id)
      console.log('✅ Images linked to training')

      // Mark batch as completed
      await updateBatchProcessingStatus(latestBatchId, 'completed')
      console.log('✅ Batch processing completed')

      return NextResponse.json({
        success: true,
        trainingId: training.id,
        status: training.status,
        destination,
        message: 'Training started successfully'
      })
      
    } catch (replicateError: any) {
      console.error('❌ Replicate training error:', replicateError)
      
      // If the error is about destination not existing, provide a helpful message
      if (replicateError.message?.includes('destination does not exist')) {
        return NextResponse.json({
          error: 'Model destination error',
          details: `Please ensure the Replicate username "${process.env.REPLICATE_USERNAME}" is correct and you have permission to create models.`,
          suggestion: 'Check your REPLICATE_USERNAME environment variable'
        }, { status: 400 })
      }
      
      throw replicateError
    }

  } catch (error) {
    console.error('❌ Error starting training:', error)
    return NextResponse.json({
      error: 'Failed to start training',
      details: (error as Error).message
    }, { status: 500 })
  }
} 