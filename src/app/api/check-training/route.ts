import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { auth } from '../../../../auth'
import { getTrainingRecordByUser, updateTrainingRecord } from '../../../lib/db'
import { generateStarterImages } from '../../../lib/batch-generation'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    
    // Get the user's latest training record
    const trainingRecord = await getTrainingRecordByUser(userId)
    
    if (!trainingRecord) {
      return NextResponse.json({ error: 'No training record found' }, { status: 404 })
    }

    // If training is already completed, return current status
    if (trainingRecord.status === 'succeeded' || trainingRecord.status === 'failed') {
      return NextResponse.json({
        success: true,
        training: trainingRecord
      })
    }

    console.log('🔍 Checking training status:', trainingRecord.replicateId)

    // Check status with Replicate
    const replicateTraining = await replicate.trainings.get(trainingRecord.replicateId)
    
    console.log('📊 Replicate status:', replicateTraining.status)
    console.log('📊 Replicate training output:', JSON.stringify(replicateTraining.output, null, 2))

    // Update database if status changed
    if (replicateTraining.status !== trainingRecord.status) {
      // For completed training, get the destination model version
      let modelVersion = null
      if (replicateTraining.status === 'succeeded') {
        try {
          // The training creates a model at the destination, we need to get its latest version
          if (replicateTraining.output?.version) {
            modelVersion = replicateTraining.output.version
            console.log('✅ Found model version from output:', modelVersion)
          } else {
            // Fallback: construct the destination model name and get its latest version
            const userName = trainingRecord.userId // This might need adjustment based on your user ID format
            const timestamp = new Date(trainingRecord.createdAt).getTime()
            const modelName = `${userName}_${timestamp}`
            const destination = `${process.env.REPLICATE_USERNAME}/${modelName}`
            
            console.log('🔍 Looking for destination model:', destination)
            
            try {
              const [owner, name] = destination.split('/')
              const destinationModel = await replicate.models.get(owner, name)
              if (destinationModel.latest_version?.id) {
                modelVersion = `${destination}:${destinationModel.latest_version.id}`
                console.log('✅ Found destination model version:', modelVersion)
              }
            } catch (modelError) {
              console.error('❌ Could not fetch destination model:', modelError)
            }
          }
        } catch (error) {
          console.error('❌ Error getting model version:', error)
        }
      }
      
      const updatedRecord = await updateTrainingRecord(trainingRecord.replicateId, {
        status: replicateTraining.status,
        version: modelVersion || replicateTraining.model || null,
        error: replicateTraining.error || null,
        updatedAt: new Date(),
      })

      // If training just completed successfully, generate starter images
      if (replicateTraining.status === 'succeeded' && 
          trainingRecord.status !== 'succeeded' && 
          modelVersion) {
        console.log('🎨 Training completed successfully! Starting generation of starter images...')
        
        // Generate starter images in the background (don't await to avoid blocking the response)
        generateStarterImages(userId, trainingRecord.id, modelVersion)
          .then(() => {
            console.log('✅ Starter images generation completed for user:', userId)
          })
          .catch((error) => {
            console.error('❌ Failed to generate starter images:', error)
          })
      }

      return NextResponse.json({
        success: true,
        training: updatedRecord,
        statusChanged: true
      })
    }

    return NextResponse.json({
      success: true,
      training: trainingRecord,
      statusChanged: false
    })

  } catch (error) {
    console.error('❌ Error checking training status:', error)
    return NextResponse.json({
      error: 'Failed to check training status',
      details: (error as Error).message
    }, { status: 500 })
  }
} 