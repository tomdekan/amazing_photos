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
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get user and subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`Managing subscription for user ${userId}, customer ID: ${subscription.stripeCustomerId}`);

    let customerId = subscription.stripeCustomerId;

    // Verify customer exists in Stripe, create new one if not
    try {
      await stripe.customers.retrieve(customerId);
    } catch (customerError: any) {
      if (customerError.code === 'resource_missing') {
        console.log(`Customer ${customerId} not found in Stripe, creating new customer`);
        
        // Create new customer
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: userId,
          },
        });

        // Update subscription with new customer ID
        await prisma.subscription.update({
          where: { userId: userId },
          data: { stripeCustomerId: newCustomer.id },
        });

        customerId = newCustomer.id;
      } else {
        throw customerError;
      }
    }

    // Create Stripe customer portal session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = baseUrl.startsWith('http') ? `${baseUrl}/generate` : `https://${baseUrl}/generate`;
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json({ error: 'Failed to create customer portal session' }, { status: 500 });
  }
}