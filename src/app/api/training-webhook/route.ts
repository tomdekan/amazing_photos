import { NextResponse } from 'next/server'
import { updateTrainingRecord } from '../../../lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.info('🔔 Training webhook received:', body)

    // Verify webhook signature if needed (recommended for production)
    const signature = request.headers.get('webhook-signature')
    if (!signature) {
      console.error('❌ No webhook signature provided')
      return NextResponse.json({ error: 'No webhook signature provided' }, { status: 400 })
    }

    // Verify signature using Replicate's public key
    
    const { id, status, model, error, output } = body

    if (!id) {
      console.error('❌ No training ID in webhook')
      return NextResponse.json({ error: 'No training ID provided' }, { status: 400 })
    }

    console.info(`📝 Updating training ${id} with status: ${status}`)
    console.info('📊 Webhook output:', JSON.stringify(output, null, 2))

    // For completed training, get the version from output
    let modelVersion = null
    if (status === 'succeeded' && output?.version) {
      modelVersion = output.version
      console.info('✅ Found model version from webhook:', modelVersion)
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

    console.info(`✅ Training ${id} updated successfully`)

    // Log completion for successful trainings
    if (status === 'succeeded') {
      console.info(`🎉 Training completed successfully! Model: ${model}`)
      
      // COMMENTED OUT: Training run disabled to avoid costs during testing
      // If training completed successfully and we have a model version, generate starter images and send email
      // if (modelVersion && updatedRecord.userId) {
      //   console.info('🎨 Starting generation of starter images...')
      //   
      //   // Generate starter images and send email after completion
      //   generateStarterImages(updatedRecord.userId, updatedRecord.id, modelVersion)
      //     .then(async (generatedImages) => {
      //       console.info('✅ Starter images generation completed for training:', id)
      //       console.info(`📧 Preparing to send completion email with ${generatedImages.length} images`)
      //       
      //       // Get user information for the email
      //       const trainingWithUser = await prisma.trainingRecord.findFirst({
      //         where: { userId: updatedRecord.userId },
      //         include: { user: true },
      //         orderBy: { createdAt: 'desc' }
      //       })
      //       if (trainingWithUser?.user?.email) {
      //         try {
      //           await sendTrainingCompletionEmail({
      //             userEmail: trainingWithUser.user.email,
      //             userName: trainingWithUser.user.name || trainingWithUser.user.email.split('@')[0],
      //             generatedImages: generatedImages,
      //             loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/generate`
      //           })
      //           console.info('✅ Training completion email sent successfully')
      //         } catch (emailError) {
      //           console.error('❌ Failed to send training completion email:', emailError)
      //         }
      //       } else {
      //         console.error('❌ Could not find user email for training completion notification')
      //       }
      //     })
      //     .catch((error) => {
      //       console.error('❌ Failed to generate starter images:', error)
      //     })
      // }
    } else if (status === 'failed') {
      console.error(`💥 Training failed: ${error}`)
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