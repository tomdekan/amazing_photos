import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    console.log(`🔍 Debug: Checking subscription for user ${userId}`)

    // Check database subscription
    const dbSubscription = await prisma.subscription.findUnique({
      where: { userId: userId },
      include: { plan: true },
    })

    console.log('📊 Database subscription:', dbSubscription)

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    console.log('👤 User details:', user)

    // If we have a subscription, check Stripe
    let stripeSubscription = null
    let stripeCustomer = null

    if (dbSubscription?.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(dbSubscription.stripeSubscriptionId)
        console.log('💳 Stripe subscription:', stripeSubscription)
      } catch (error) {
        console.log('❌ Stripe subscription not found:', error)
      }
    }

    if (dbSubscription?.stripeCustomerId) {
      try {
        stripeCustomer = await stripe.customers.retrieve(dbSubscription.stripeCustomerId)
        console.log('👥 Stripe customer:', stripeCustomer)
      } catch (error) {
        console.log('❌ Stripe customer not found:', error)
      }
    }

    // Get recent checkout sessions for this user
    const recentSessions = await stripe.checkout.sessions.list({
      limit: 5,
      expand: ['data.subscription'],
    })

    const userSessions = recentSessions.data.filter(session => 
      session.client_reference_id === userId
    )

    console.log('🛒 Recent checkout sessions for user:', userSessions)

    return NextResponse.json({
      userId,
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      database: {
        hasSubscription: !!dbSubscription,
        subscription: dbSubscription,
      },
      stripe: {
        subscription: stripeSubscription,
        customer: stripeCustomer,
        recentSessions: userSessions.map(session => ({
          id: session.id,
          status: session.status,
          payment_status: session.payment_status,
          mode: session.mode,
          created: new Date(session.created * 1000),
          metadata: session.metadata,
          subscription_id: session.subscription,
        })),
      },
      recommendations: [
        !dbSubscription && '🔄 No subscription in database - webhook may not have fired',
        dbSubscription && !stripeSubscription && '⚠️ Database has subscription but Stripe doesn\'t',
        !user && '❌ User not found in database',
        userSessions.length === 0 && '📭 No recent checkout sessions found',
      ].filter(Boolean),
    })
  } catch (error) {
    console.error('Debug subscription error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
} 