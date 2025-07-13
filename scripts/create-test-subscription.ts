import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function createTestSubscription() {
  console.log('🚀 Creating test plan and subscription...')

  try {
    // First, create a test plan if it doesn't exist
    let plan = await prisma.plan.findFirst({
      where: { name: 'Test Pro Plan' }
    })

    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: 'Test Pro Plan',
          description: 'Test plan for development with unlimited generations',
          price: 2999, // $29.99 in cents
          currency: 'usd',
          interval: 'month',
          stripePriceId: 'price_test_development_only',
          features: [
            'Unlimited AI generations',
            'High-resolution images',
            'Priority processing',
            'Advanced model access'
          ],
          generations: 1000, // High limit for testing
          isActive: true,
          sortOrder: 1
        }
      })
      console.log('✅ Created test plan:', plan.name)
    } else {
      console.log('ℹ️  Test plan already exists:', plan.name)
    }

    // Get the current user (assuming there's at least one user)
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!user) {
      console.error('❌ No users found. Please create a user first by signing in to the app.')
      return
    }

    console.log('👤 Found user:', user.email)

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id }
    })

    if (existingSubscription) {
      // Update existing subscription
      const subscription = await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          planId: plan.id,
          status: 'active',
          stripeSubscriptionId: 'sub_test_development_only',
          stripeCustomerId: 'cus_test_development_only',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          cancelAtPeriodEnd: false,
          generationsUsed: 0,
          lastResetDate: new Date()
        }
      })
      console.log('✅ Updated existing subscription for user:', user.email)
    } else {
      // Create new subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: 'active',
          stripeSubscriptionId: 'sub_test_development_only',
          stripeCustomerId: 'cus_test_development_only',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          cancelAtPeriodEnd: false,
          generationsUsed: 0,
          lastResetDate: new Date()
        }
      })
      console.log('✅ Created new subscription for user:', user.email)
    }

    // Reset user's generation count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        generationsUsed: 0,
        lastResetDate: new Date()
      }
    })

    console.log('🎉 Test subscription setup complete!')
    console.log('📊 User now has access to:', plan.generations, 'generations per month')
    
  } catch (error) {
    console.error('❌ Error creating test subscription:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestSubscription() 