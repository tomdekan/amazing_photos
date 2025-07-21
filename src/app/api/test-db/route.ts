import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    console.log('🧪 Testing database operations...')
    
    // Test creating a record with trainingSessionId
    const testRecord = await prisma.uploadedImage.create({
      data: {
        userId: 'test-user-123',
        uploadBatchId: 'test-batch-123',
        trainingSessionId: 'test-session-123',
        filename: 'test-image.jpg',
        blobUrl: 'https://test.com/image.jpg',
        contentType: 'image/jpeg',
        size: 1000,
        processingStatus: 'uploaded',
      },
    })
    
    console.log('✅ Created test record:', testRecord.id)
    
    // Test retrieving by trainingSessionId
    const { getUploadedImagesByTrainingSession } = await import('../../../lib/db')
    const images = await getUploadedImagesByTrainingSession('test-session-123')
    
    console.log('✅ Retrieved images:', images.length)
    
    // Clean up
    await prisma.uploadedImage.delete({
      where: { id: testRecord.id }
    })
    
    console.log('✅ Cleaned up test record')
    
    return NextResponse.json({
      success: true,
      message: 'Database operations work correctly',
      testResults: {
        recordCreated: true,
        trainingSessionId: testRecord.trainingSessionId,
        retrievedCount: images.length
      }
    })
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({
      error: 'Database test failed',
      details: (error as Error).message
    }, { status: 500 })
  }
} 