import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    console.log(`🧪 Testing webhook processing for session: ${sessionId}`)

    // Get the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    })

    console.log('📋 Session details:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      mode: session.mode,
      client_reference_id: session.client_reference_id,
      metadata: session.metadata,
      subscription: session.subscription
    })

    if (session.mode === 'subscription' && session.subscription) {
      const subscription = session.subscription as Stripe.Subscription
      const userId = session.client_reference_id
      const planId = session.metadata?.planId

      if (!userId || !planId) {
        return NextResponse.json({ 
          error: 'Missing userId or planId in session metadata',
          userId,
          planId,
          metadata: session.metadata
        }, { status: 400 })
      }

      console.log(`💾 Saving subscription for user ${userId}, plan ${planId}`)

      // Save to database
      const result = await prisma.subscription.upsert({
        where: { userId: userId },
        update: {
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
        create: {
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

      console.log('✅ Subscription saved:', result)

      return NextResponse.json({
        success: true,
        message: 'Subscription processed successfully',
        subscription: result,
        stripeData: {
          sessionId: session.id,
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status
        }
      })
    }

    return NextResponse.json({ 
      error: 'Session is not a subscription or subscription not found',
      session: {
        mode: session.mode,
        subscription: session.subscription
      }
    }, { status: 400 })

  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
} 