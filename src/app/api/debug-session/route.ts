import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log('🐛 Debug - Received request body:', JSON.stringify(body, null, 2))
    
    return NextResponse.json({
      success: true,
      received: body,
      message: 'Debug endpoint - check server console for details'
    })
  } catch (error) {
    console.error('🐛 Debug endpoint error:', error)
    return NextResponse.json({
      error: 'Debug endpoint error',
      details: (error as Error).message
    }, { status: 500 })
  }
} 