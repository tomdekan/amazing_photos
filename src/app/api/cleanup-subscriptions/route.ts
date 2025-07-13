import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    console.log(`🧹 Cleaning up subscriptions for user: ${userId}`)

    // 1. Delete existing subscription data
    const deletedSub = await prisma.subscription.deleteMany({
      where: { userId: userId }
    })

    console.log(`🗑️ Deleted ${deletedSub.count} existing subscriptions`)

    // 2. Get recent checkout sessions
    const recentSessions = await stripe.checkout.sessions.list({
      limit: 10,
      expand: ['data.subscription'],
    })

    const userSessions = recentSessions.data.filter(session => 
      session.client_reference_id === userId && 
      session.status === 'complete' &&
      session.payment_status === 'paid' &&
      session.subscription
    )

    if (userSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Cleanup completed - no valid sessions to process',
        deleted: deletedSub.count
      })
    }

    // 3. Process the most recent successful session
    const latestSession = userSessions[0]
    const subscription = latestSession.subscription as Stripe.Subscription
    const planId = latestSession.metadata?.planId

    if (!planId) {
      return NextResponse.json({
        error: 'No planId found in session metadata',
        sessionId: latestSession.id
      }, { status: 400 })
    }

    console.log(`💾 Processing subscription: ${subscription.id} for plan: ${planId}`)

    // 4. Create the subscription record
    const newSubscription = await prisma.subscription.create({
      data: {
        userId: userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        status: subscription.status,
        planId: planId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        generationsUsed: 0,
        lastResetDate: new Date(),
      },
    })

    console.log('✅ Subscription created:', newSubscription)

    return NextResponse.json({
      success: true,
      message: 'Cleanup and setup completed successfully',
      deleted: deletedSub.count,
      subscription: {
        id: newSubscription.id,
        stripeSubscriptionId: newSubscription.stripeSubscriptionId,
        stripeCustomerId: newSubscription.stripeCustomerId,
        status: newSubscription.status,
        planId: newSubscription.planId
      },
      processedSession: {
        id: latestSession.id,
        created: new Date(latestSession.created * 1000)
      }
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ 
      error: 'Cleanup failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
} 