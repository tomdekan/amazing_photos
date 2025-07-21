#!/usr/bin/env tsx

/**
 * Test script for frontend integration of training session ID functionality
 * This script checks if uploaded images properly contain trainingSessionId
 */

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function testFrontendIntegration() {
  console.log('🧪 Testing Frontend Integration')
  console.log('===============================\n')

  try {
    // Get recent uploaded images
    const recentImages = await prisma.uploadedImage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: true
      }
    })

    console.log(`📊 Found ${recentImages.length} recent uploaded images`)

    if (recentImages.length === 0) {
      console.log('ℹ️  No recent images found. Upload some images first to test.')
      return
    }

    console.log('\n📋 Recent Images Analysis:')
    console.log('==========================================')

    let imagesWithSessionId = 0
    let imagesWithoutSessionId = 0

    recentImages.forEach((image, index) => {
      const hasSessionId = !!image.trainingSessionId
      const hasTrainingId = !!image.trainingId
      
      console.log(`${index + 1}. ${image.filename}`)
      console.log(`   User: ${image.user?.name || 'Unknown'} (${image.userId})`)
      console.log(`   Upload Time: ${image.createdAt.toLocaleString()}`)
      console.log(`   Training Session ID: ${image.trainingSessionId || '❌ NOT SET'}`)
      console.log(`   Training ID: ${image.trainingId || 'Not linked yet'}`)
      console.log(`   Status: ${image.processingStatus}`)
      console.log(`   Upload Batch: ${image.uploadBatchId || 'Not set'}`)
      
      if (hasSessionId) {
        imagesWithSessionId++
        console.log('   ✅ Has Training Session ID')
      } else {
        imagesWithoutSessionId++
        console.log('   ❌ Missing Training Session ID')
      }
      
      console.log('')

      if (hasSessionId) imagesWithSessionId++
      else imagesWithoutSessionId++
    })

    console.log('📈 Summary:')
    console.log('===========')
    console.log(`✅ Images with Training Session ID: ${imagesWithSessionId}`)
    console.log(`❌ Images without Training Session ID: ${imagesWithoutSessionId}`)

    if (imagesWithSessionId > 0 && imagesWithoutSessionId === 0) {
      console.log('\n🎉 SUCCESS: All recent images have training session IDs!')
      console.log('Frontend integration is working correctly.')
    } else if (imagesWithSessionId > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS: Some images have training session IDs.')
      console.log('This suggests the frontend update is working for new uploads.')
    } else {
      console.log('\n❌ ISSUE: No images have training session IDs.')
      console.log('The frontend may not be properly updated yet.')
    }

    // Group by training session ID
    const sessionGroups = recentImages.reduce((groups, image) => {
      const sessionId = image.trainingSessionId || 'no-session'
      if (!groups[sessionId]) groups[sessionId] = []
      groups[sessionId].push(image)
      return groups
    }, {} as Record<string, typeof recentImages>)

    console.log('\n🗂️  Grouping by Training Session:')
    console.log('===================================')
    Object.entries(sessionGroups).forEach(([sessionId, images]) => {
      if (sessionId === 'no-session') {
        console.log(`❌ No Session (${images.length} images):`)
      } else {
        console.log(`🆔 Session ${sessionId} (${images.length} images):`)
      }
      images.forEach(image => {
        console.log(`   - ${image.filename} (${image.createdAt.toLocaleString()})`)
      })
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
if (require.main === module) {
  testFrontendIntegration()
    .then(() => {
      console.log('\n✨ Frontend integration test completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Frontend integration test failed:', error)
      process.exit(1)
    })
}

export { testFrontendIntegration } 