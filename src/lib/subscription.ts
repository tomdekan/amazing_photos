import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export interface SubscriptionCheck {
  hasAccess: boolean;
  generationsRemaining: number;
  planName?: string;
  reason?: string;
}

export async function checkSubscriptionAccess(userId: string): Promise<SubscriptionCheck> {
  try {
    // Get user's subscription with plan details
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return {
        hasAccess: false,
        generationsRemaining: 0,
        reason: 'No subscription found',
      };
    }

    // Check if subscription is active
    if (subscription.status !== 'active') {
      return {
        hasAccess: false,
        generationsRemaining: 0,
        planName: subscription.plan.name,
        reason: `Subscription is ${subscription.status}`,
      };
    }

    // Check if subscription has expired
    const now = new Date();
    if (now > subscription.currentPeriodEnd) {
      return {
        hasAccess: false,
        generationsRemaining: 0,
        planName: subscription.plan.name,
        reason: 'Subscription period has ended',
      };
    }

    // Reset usage if we're in a new billing period
    const periodStart = new Date(subscription.currentPeriodStart);
    const lastReset = new Date(subscription.lastResetDate);
    
    if (now >= periodStart && lastReset < periodStart) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          generationsUsed: 0,
          lastResetDate: now,
        },
      });
      subscription.generationsUsed = 0;
    }

    // Check if user has remaining generations
    const generationsRemaining = subscription.plan.generations - subscription.generationsUsed;
    
    if (generationsRemaining <= 0) {
      return {
        hasAccess: false,
        generationsRemaining: 0,
        planName: subscription.plan.name,
        reason: 'Monthly generation limit reached',
      };
    }

    return {
      hasAccess: true,
      generationsRemaining,
      planName: subscription.plan.name,
    };
  } catch (error) {
    console.error('Error checking subscription access:', error);
    return {
      hasAccess: false,
      generationsRemaining: 0,
      reason: 'Error checking subscription',
    };
  }
}

export async function incrementGenerationUsage(userId: string): Promise<boolean> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return false;
    }

    // Check if user still has generations available
    if (subscription.generationsUsed >= subscription.plan.generations) {
      return false;
    }

    // Increment usage
    await prisma.subscription.update({
      where: { userId },
      data: {
        generationsUsed: subscription.generationsUsed + 1,
      },
    });

    return true;
  } catch (error) {
    console.error('Error incrementing generation usage:', error);
    return false;
  }
}

export async function getSubscriptionStatus(userId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return {
        hasSubscription: false,
        generationsUsed: 0,
        generationsLimit: 0,
        message: 'No active subscription',
      };
    }

    // Reset usage if needed
    const now = new Date();
    const periodStart = new Date(subscription.currentPeriodStart);
    const lastReset = new Date(subscription.lastResetDate);
    
    if (now >= periodStart && lastReset < periodStart) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          generationsUsed: 0,
          lastResetDate: now,
        },
      });
      subscription.generationsUsed = 0;
    }

    return {
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
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
}