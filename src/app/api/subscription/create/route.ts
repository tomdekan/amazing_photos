import { PrismaClient } from '@/generated/prisma';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

interface ExtendedSubscription extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
  latest_invoice: Stripe.Invoice & {
    payment_intent: Stripe.PaymentIntent;
  };
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId, planId } = await req.json();

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing userId or planId' }, { status: 400 });
    }

    // Get user and plan details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!user || !plan) {
      return NextResponse.json({ error: 'User or plan not found' }, { status: 404 });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json({ error: 'User already has an active subscription' }, { status: 400 });
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = '';
    
    if (existingSubscription?.stripeCustomerId) {
      stripeCustomerId = existingSubscription.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: plan.stripePriceId,
        },
      ],
      metadata: {
        userId: userId,
        planId: planId,
      },
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    }) as unknown as ExtendedSubscription;



    // Create or update subscription in database
    await prisma.subscription.upsert({
      where: { userId: userId },
      update: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: stripeCustomerId,
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
        stripeCustomerId: stripeCustomerId,
        status: subscription.status,
        planId: planId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        generationsUsed: 0,
        lastResetDate: new Date(),
      },
    });

    if (!subscription.latest_invoice) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    const latest_invoice = subscription.latest_invoice;
    if (!latest_invoice) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    const payment_intent = latest_invoice.payment_intent;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: payment_intent.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}