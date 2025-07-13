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

    console.log('🔍 Checking training status:', trainingRecord.replicateId)

    // Check status with Replicate
    const replicateTraining = await replicate.trainings.get(trainingRecord.replicateId)
    
    console.log('📊 Replicate status:', replicateTraining.status)

    // Update database if status changed
    if (replicateTraining.status !== trainingRecord.status) {
      const updatedRecord = await updateTrainingRecord(trainingRecord.replicateId, {
        status: replicateTraining.status,
        version: replicateTraining.model || null,
        error: replicateTraining.error || null,
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