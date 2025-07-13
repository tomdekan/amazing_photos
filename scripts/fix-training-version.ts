import { PrismaClient } from '../src/generated/prisma'
import Replicate from 'replicate'

const prisma = new PrismaClient()
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

async function fixTrainingVersion() {
  console.log('🔧 Fixing training version...')

  try {
    // Get the latest training record
    const trainingRecord = await prisma.trainingRecord.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })

    if (!trainingRecord) {
      console.log('❌ No training records found')
      return
    }

    console.log('📋 Current training record:')
    console.log('- Status:', trainingRecord.status)
    console.log('- Version:', trainingRecord.version)
    console.log('- User:', trainingRecord.user.email)

    if (trainingRecord.status !== 'succeeded') {
      console.log('⚠️ Training not completed yet, cannot fix version')
      return
    }

    // Get the actual training from Replicate to see the output
    console.log('🔍 Fetching training details from Replicate...')
    const replicateTraining = await replicate.trainings.get(trainingRecord.replicateId)
    
    console.log('📊 Replicate training status:', replicateTraining.status)
    console.log('📊 Replicate training output:', JSON.stringify(replicateTraining.output, null, 2))

    let correctVersion = null

    // Check if the output contains a version
    if (replicateTraining.output?.version) {
      correctVersion = replicateTraining.output.version
      console.log('✅ Found version in output:', correctVersion)
    } else {
      // Fallback: reconstruct the destination model name from creation pattern
      const userName = trainingRecord.user.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'user'
      const timestamp = new Date(trainingRecord.createdAt).getTime()
      const modelName = `${userName}_${timestamp}`
      const destination = `${process.env.REPLICATE_USERNAME}/${modelName}`
      
      console.log('🔍 Looking for destination model:', destination)
      
      try {
        const [owner, name] = destination.split('/')
        const destinationModel = await replicate.models.get(owner, name)
        
        if (destinationModel.latest_version?.id) {
          correctVersion = `${destination}:${destinationModel.latest_version.id}`
          console.log('✅ Found destination model version:', correctVersion)
        } else {
          console.log('❌ No latest version found for destination model')
        }
      } catch (modelError) {
        console.error('❌ Could not fetch destination model:', modelError)
      }
    }

    if (correctVersion && correctVersion !== trainingRecord.version) {
      console.log('🔧 Updating training record with correct version...')
      
      const updatedRecord = await prisma.trainingRecord.update({
        where: { id: trainingRecord.id },
        data: { 
          version: correctVersion,
          updatedAt: new Date()
        }
      })

      console.log('✅ Training record updated!')
      console.log('- Old version:', trainingRecord.version)
      console.log('- New version:', correctVersion)
    } else if (correctVersion === trainingRecord.version) {
      console.log('✅ Version is already correct')
    } else {
      console.log('❌ Could not determine correct version')
    }

  } catch (error) {
    console.error('❌ Error fixing training version:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTrainingVersion() 