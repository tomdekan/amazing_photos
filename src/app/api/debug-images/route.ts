import { NextResponse } from 'next/server'
import { getUploadedImagesByUser } from '../../../lib/db'
import { auth } from '../../../../auth'

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const images = await getUploadedImagesByUser(session.user.id)
    
    return NextResponse.json({
      success: true,
      userId: session.user.id,
      imageCount: images.length,
      images: images.map(img => ({
        id: img.id,
        filename: img.filename,
        blobUrl: img.blobUrl,
        uploadBatchId: img.uploadBatchId,
        processingStatus: img.processingStatus,
        createdAt: img.createdAt,
      }))
    })
  } catch (error) {
    console.error('Debug images error:', error)
    return NextResponse.json({
      error: 'Failed to fetch images',
      details: (error as Error).message
    }, { status: 500 })
  }
} 