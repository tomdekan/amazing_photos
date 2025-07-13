import { NextResponse } from 'next/server'
import { updateTrainingRecord } from '../../../lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('🔔 Training webhook received:', body)

    // Verify webhook signature if needed (recommended for production)
    // const signature = request.headers.get('webhook-signature')
    
    const { id, status, model, error } = body

    if (!id) {
      console.error('❌ No training ID in webhook')
      return NextResponse.json({ error: 'No training ID provided' }, { status: 400 })
    }

    console.log(`📝 Updating training ${id} with status: ${status}`)

    // Update training record in database
    const updatedRecord = await updateTrainingRecord(id, {
      status,
      version: model || null,
      error: error || null,
      updatedAt: new Date(),
    })

    if (!updatedRecord) {
      console.error(`❌ Training record not found: ${id}`)
      return NextResponse.json({ error: 'Training record not found' }, { status: 404 })
    }

    console.log(`✅ Training ${id} updated successfully`)

    // Log completion for successful trainings
    if (status === 'succeeded') {
      console.log(`🎉 Training completed successfully! Model: ${model}`)
    } else if (status === 'failed') {
      console.log(`💥 Training failed: ${error}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json({
      error: 'Failed to process webhook',
      details: (error as Error).message
    }, { status: 500 })
  }
} 