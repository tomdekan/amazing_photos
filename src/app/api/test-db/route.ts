import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../generated/prisma'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('🧪 Testing database connection...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Count existing records
    const userCount = await prisma.user.count()
    const trainingCount = await prisma.trainingRecord.count()
    const imageCount = await prisma.uploadedImage.count()
    
    console.log('📊 Record counts:', { userCount, trainingCount, imageCount })
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      counts: {
        users: userCount,
        trainings: trainingCount,
        images: imageCount
      }
    })
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json(
      { error: 'Database connection failed', details: (error as Error).message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 