import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function debugTraining() {
  console.log('🔍 Debugging training records...')

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

    console.log('📋 Latest training record:')
    console.log('- ID:', trainingRecord.id)
    console.log('- User:', trainingRecord.user.email)
    console.log('- Status:', trainingRecord.status)
    console.log('- Version:', trainingRecord.version)
    console.log('- Replicate ID:', trainingRecord.replicateId)
    console.log('- Error:', trainingRecord.error)
    console.log('- Created:', trainingRecord.createdAt)
    console.log('- Updated:', trainingRecord.updatedAt)

    // If we have a version, let's see what format it's in
    if (trainingRecord.version) {
      console.log('\n🔍 Analyzing version format:')
      console.log('- Raw version:', trainingRecord.version)
      console.log('- Length:', trainingRecord.version.length)
      console.log('- Contains colon:', trainingRecord.version.includes(':'))
      console.log('- Contains slash:', trainingRecord.version.includes('/'))
      
      // Check if it looks like a model identifier
      const parts = trainingRecord.version.split('/')
      if (parts.length === 2) {
        const [owner, nameAndVersion] = parts
        const versionParts = nameAndVersion.split(':')
        console.log('- Owner:', owner)
        if (versionParts.length === 2) {
          console.log('- Model name:', versionParts[0])
          console.log('- Version ID:', versionParts[1])
          console.log('✅ This looks like a proper model version identifier')
        } else {
          console.log('- Model name (no version):', nameAndVersion)
          console.log('⚠️ This looks like just a model name, missing version ID')
        }
      } else {
        console.log('⚠️ This does not look like a proper model identifier')
      }
    }

  } catch (error) {
    console.error('❌ Error debugging training:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTraining() 