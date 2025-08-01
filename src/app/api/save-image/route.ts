import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createUploadedImageRecord } from '../../../lib/db'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filename, blobUrl, contentType, size, uploadBatchId, trainingSessionId } = await request.json()

    console.info('💾 Saving image to database:', { filename, blobUrl, uploadBatchId, trainingSessionId })

    if (!trainingSessionId) {
      return NextResponse.json({ error: 'Training session ID is required' }, { status: 400 })
    }

    const imageRecord = await createUploadedImageRecord({
      userId: session.user.id,
      uploadBatchId,
      trainingSessionId,
      filename,
      blobUrl,
      contentType: contentType || 'image/*',
      size: size || 0,
      processingStatus: 'uploaded',
    })

    console.info('✅ Image saved to database:', imageRecord.id)

    return NextResponse.json({
      success: true,
      imageId: imageRecord.id,
      message: 'Image saved to database'
    })
  } catch (error) {
    console.error('❌ Error saving image to database:', error)
    return NextResponse.json({
      error: 'Failed to save image',
      details: (error as Error).message
    }, { status: 500 })
  }
} 