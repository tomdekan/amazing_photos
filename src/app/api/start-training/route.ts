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

    const userId = session.user.id
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
    
    const training = await replicate.trainings.create(
      'replicate',
      'fast-flux-trainer',
      '8b10794665aed907bb98a1a5324cd1d3a8bea0e9b31e65210967fb9c9e2e08ed',
      {
        destination: `${process.env.REPLICATE_USERNAME}/${userId}-flux-model`,
        input: {
          input_images: zipBlobResult.url,
          trigger_word: 'TOK',
          lora_type: 'subject',
          steps: 1000,
          autocaption: true,
        },
        webhook: `${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_URL}/api/training-webhook`,
      }
    )
    
    console.log('✅ Replicate training created:', training.id)

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
      message: 'Training started successfully'
    })

  } catch (error) {
    console.error('❌ Error starting training:', error)
    return NextResponse.json({
      error: 'Failed to start training',
      details: (error as Error).message
    }, { status: 500 })
  }
} 