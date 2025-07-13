import { PrismaClient } from '@/generated/prisma';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId, cancelAtPeriodEnd = true } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get user subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Cancel subscription in Stripe
    let stripeSubscription;
    if (cancelAtPeriodEnd) {
      stripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      stripeSubscription = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Update subscription in database
    await prisma.subscription.update({
      where: { userId: userId },
      data: {
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    return NextResponse.json({
      message: cancelAtPeriodEnd ? 'Subscription will be cancelled at period end' : 'Subscription cancelled immediately',
      subscription: {
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
      },
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}