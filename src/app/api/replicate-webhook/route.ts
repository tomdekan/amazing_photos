import { updateTrainingRecord } from '../../../lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, status, output } = body
    console.info(`Received webhook for training ${id} with status ${status}`)

    const updateData: { status: string; version?: string | null } = { status }
    if (status === 'succeeded' && output?.version) {
        updateData.version = output.version
    }

    await updateTraiAningRecord(id, updateData)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
} 


// COMMENTED OUT: Training run disabled to avoid costs during testing
      // If training just completed successfully, generate starter images
      // if (replicateTraining.status === 'succeeded' && 
      //     trainingRecord.status !== 'succeeded' && 
      //     modelVersion) {
      //   console.info('🎨 Training completed successfully! Starting generation of starter images...')
      //   
      //   // Generate starter images and send email after completion
      //   generateStarterImages(userId, trainingRecord.id, modelVersion)
      //     .then(async (generatedImages) => {
      //       console.info('✅ Starter images generation completed for user:', userId)
      //       console.info(`📧 Preparing to send completion email with ${generatedImages.length} images`)
      //       
      //       // Get user information for the email
      //       const trainingWithUser = await prisma.trainingRecord.findFirst({
      //         where: { userId: userId },
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