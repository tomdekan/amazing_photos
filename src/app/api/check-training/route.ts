import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { auth } from '../../../../auth'
import { getTrainingRecordByUser, updateTrainingRecord } from '../../../lib/db'

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

    console.info('🔍 Checking training status:', trainingRecord.replicateId)

    // Check status with Replicate
    const replicateTraining = await replicate.trainings.get(trainingRecord.replicateId)
    
    console.info('📊 Replicate status:', replicateTraining.status)
    console.info('📊 Replicate training output:', JSON.stringify(replicateTraining.output, null, 2))

    // Update database if status changed
    if (replicateTraining.status !== trainingRecord.status) {
      // For completed training, get the destination model version
      let modelVersion = null
      if (replicateTraining.status === 'succeeded') {
        try {
          // The training creates a model at the destination, we need to get its latest version
          if (replicateTraining.output?.version) {
            modelVersion = replicateTraining.output.version
            console.info('✅ Found model version from output:', modelVersion)
          } else {
            // Fallback: construct the destination model name and get its latest version
            const userName = trainingRecord.userId // This might need adjustment based on your user ID format
            const timestamp = new Date(trainingRecord.createdAt).getTime()
            const modelName = `${userName}_${timestamp}`
            const destination = `${process.env.REPLICATE_USERNAME || 'tomdekan'}/${modelName}`
            
            console.info('🔍 Looking for destination model:', destination)
            
            try {
              const [owner, name] = destination.split('/')
              const destinationModel = await replicate.models.get(owner, name)
              if (destinationModel.latest_version?.id) {
                modelVersion = `${destination}:${destinationModel.latest_version.id}`
                console.info('✅ Found destination model version:', modelVersion)
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
        error: replicateTraining.error ? String(replicateTraining.error) : null,
        updatedAt: new Date(),
      })

      

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