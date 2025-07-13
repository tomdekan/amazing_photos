import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Delete any existing subscription for this user
    await prisma.subscription.deleteMany({
      where: { userId: userId }
    })

    // Insert the latest subscription directly with known values
    const subscription = await prisma.subscription.create({
      data: {
        userId: userId,
        stripeSubscriptionId: 'sub_1RkVZqEkjAitURtIeTT2RvjV', // Latest subscription ID from your debug data
        stripeCustomerId: 'cus_SfrIT2fyfH6obI', // Customer ID from your debug data
        status: 'active',
        planId: 'cmd20vpy700014e8klfh0n57v', // Plan ID from your debug data
        currentPeriodStart: new Date('2025-01-13T19:28:43.000Z'), // From subscription data
        currentPeriodEnd: new Date('2025-02-12T19:28:43.000Z'), // 1 month later
        cancelAtPeriodEnd: false,
        generationsUsed: 0,
        lastResetDate: new Date(),
      },
    })

    console.log('✅ Subscription created directly:', subscription)

    return NextResponse.json({
      success: true,
      message: 'Subscription fixed directly',
      subscription: subscription
    })

  } catch (error) {
    console.error('Direct fix error:', error)
    return NextResponse.json({ 
      error: 'Direct fix failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
} 