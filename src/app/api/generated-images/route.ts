import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { getGeneratedImagesByUser } from '../../../lib/db'

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    console.log('📸 Fetching generated images for user:', userId)

    const generatedImages = await getGeneratedImagesByUser(userId)
    
    console.log(`✅ Found ${generatedImages.length} generated images`)

    return NextResponse.json({
      success: true,
      images: generatedImages
    })

  } catch (error) {
    console.error('❌ Error fetching generated images:', error)
    return NextResponse.json({
      error: 'Failed to fetch generated images',
      details: (error as Error).message
    }, { status: 500 })
  }
} 