import { NextResponse } from 'next/server'
import { updateTrainingRecord, getTrainingRecordByUser } from '../../../lib/db'
import { generateStarterImages } from '../../../lib/batch-generation'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('🔔 Training webhook received:', body)

    // Verify webhook signature if needed (recommended for production)
    // const signature = request.headers.get('webhook-signature')
    
    const { id, status, model, error, output } = body

    if (!id) {
      console.error('❌ No training ID in webhook')
      return NextResponse.json({ error: 'No training ID provided' }, { status: 400 })
    }

    console.log(`📝 Updating training ${id} with status: ${status}`)
    console.log('📊 Webhook output:', JSON.stringify(output, null, 2))

    // For completed training, get the version from output
    let modelVersion = null
    if (status === 'succeeded' && output?.version) {
      modelVersion = output.version
      console.log('✅ Found model version from webhook:', modelVersion)
    }

    // Update training record in database
    const updatedRecord = await updateTrainingRecord(id, {
      status,
      version: modelVersion || model || null,
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
      
      // If training completed successfully and we have a model version, generate starter images
      if (modelVersion && updatedRecord.userId) {
        console.log('🎨 Starting generation of starter images...')
        
        // Generate starter images in the background (don't await to avoid blocking the webhook response)
        generateStarterImages(updatedRecord.userId, updatedRecord.id, modelVersion)
          .then(() => {
            console.log('✅ Starter images generation completed for training:', id)
          })
          .catch((error) => {
            console.error('❌ Failed to generate starter images:', error)
          })
      }
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