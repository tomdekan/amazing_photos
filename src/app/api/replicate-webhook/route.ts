import { updateTrainingRecord } from '../../../lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, status, output } = body
    console.log(`Received webhook for training ${id} with status ${status}`)

    const updateData: { status: string; version?: string | null } = { status }
    if (status === 'succeeded' && output?.version) {
        updateData.version = output.version
    }

    await updateTrainingRecord(id, updateData)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
} 