import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get user subscription with plan details
    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      return NextResponse.json({ 
        hasSubscription: false,
        generationsUsed: 0,
        generationsLimit: 0,
        message: 'No active subscription' 
      });
    }

    // Check if subscription period needs to be reset
    const now = new Date();
    const periodStart = new Date(subscription.currentPeriodStart);
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const lastReset = new Date(subscription.lastResetDate);

    // Reset usage if we're in a new billing period
    if (now >= periodStart && lastReset < periodStart) {
      await prisma.subscription.update({
        where: { userId: userId },
        data: {
          generationsUsed: 0,
          lastResetDate: now,
        },
      });
      subscription.generationsUsed = 0;
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        generationsUsed: subscription.generationsUsed,
        generationsLimit: subscription.plan.generations,
        planName: subscription.plan.name,
        planPrice: subscription.plan.price,
      },
      generationsUsed: subscription.generationsUsed,
      generationsLimit: subscription.plan.generations,
      generationsRemaining: subscription.plan.generations - subscription.generationsUsed,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 });
  }
}