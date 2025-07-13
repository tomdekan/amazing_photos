import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    console.log('📤 Server uploading to blob:', filename)

    const blob = await put(filename, request.body, {
      access: 'public',
      addRandomSuffix: true,
    })

    console.log('✅ Server blob upload complete:', blob.url)

    return NextResponse.json(blob)
  } catch (error) {
    console.error('❌ Server blob upload error:', error)
    return NextResponse.json({
      error: 'Failed to upload file',
      details: (error as Error).message
    }, { status: 500 })
  }
} 