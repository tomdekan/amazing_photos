import { CongratulationsMessage } from '@/components/CongratulationsMessage'
import { SignOutButton } from '@/components/SignOutButton'
import { SubscriptionManageButton } from '@/components/SubscriptionManageButton'
import { SubscriptionStatusCard } from '@/components/SubscriptionStatusCard'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '../../../auth'
import { GenerateFlow } from '../../components/GenerateFlow'
import { getTrainingRecordByUser } from '../../lib/db'
import { getSubscriptionStatus } from '../../lib/subscription'
import Image from 'next/image'
import PricingCard from '@/components/PricingCard'
import { PrismaClient, type Plan } from '@/generated/prisma'
import { BackButton } from '@/components/BackButton'

const prisma = new PrismaClient()

interface TransformedPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  generations: number;
  stripePriceId: string;
}

function transformPlan(plan: Plan): TransformedPlan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    currency: plan.currency,
    features: Array.isArray(plan.features) ? plan.features as string[] : [],
    generations: plan.generations,
    stripePriceId: plan.stripePriceId,
  }
}

export default async function GeneratePage() {
  const response = await auth.api.getSession({ headers: await headers() })
  if (!response) {
    redirect('/sign-in')
  }
  const { user } = response

  const trainingRecord = await getTrainingRecordByUser(user.id)

  let subscriptionData = null
  let hasSubscription = false
  let plans: TransformedPlan[] = []

  try {
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    if (subscriptionStatus.hasSubscription && subscriptionStatus.subscription) {
      hasSubscription = true
      subscriptionData = {
        planName: subscriptionStatus.subscription.planName,
        status: subscriptionStatus.subscription.status,
        generationsUsed: subscriptionStatus.subscription.generationsUsed,
        generationsLimit: subscriptionStatus.subscription.generationsLimit,
        generationsRemaining: subscriptionStatus.generationsRemaining,
        cancelAtPeriodEnd: subscriptionStatus.subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscriptionStatus.subscription.currentPeriodEnd,
      }
    } else {
      const dbPlans = await prisma.plan.findMany({
        orderBy: {
          price: 'asc',
        },
      })
      plans = dbPlans.map(transformPlan)
    }
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    // Attempt to fetch plans even if subscription check fails
    try {
      const dbPlans = await prisma.plan.findMany({
        orderBy: {
          price: 'asc',
        },
      })
      plans = dbPlans.map(transformPlan)
    } catch (planError) {
      console.error('Error fetching plans:', planError)
    }
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-4 bg-gray-100 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="relative flex items-center justify-between w-full mb-8">
          <BackButton
            href="/"
            className="absolute -left-16 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors"
          />
          <div className="flex items-center gap-3">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name || 'User profile picture'}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <span className="font-medium text-gray-800">{user.name}</span>
          </div>
          <SignOutButton />
        </header>

        <div className="overflow-hidden bg-white rounded-lg shadow-lg">
          <div className="px-6 py-8 sm:p-10">
            <h1 className="text-3xl font-bold tracking-tight text-center text-gray-900">
              Generate Your Photos
            </h1>
            <p className="mt-2 text-lg text-center text-gray-600">
              Follow the steps below to create your own AI-generated images.
            </p>
          </div>
          <div className="px-6 pb-8 space-y-8 bg-white sm:p-10 sm:pt-6">
            <div className="space-y-6">
              {hasSubscription ? (
                <>
                  <CongratulationsMessage />
                  <SubscriptionStatusCard subscription={subscriptionData} />
                  <div className="pt-6 text-center border-t border-gray-200">
                    <SubscriptionManageButton userId={user.id} />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    Choose a plan to get started
                  </h2>
                  <p className="mt-3 text-lg text-gray-600">
                    You&apos;re just one step away from creating amazing AI
                    photos.
                  </p>
                  <div className="grid grid-cols-1 gap-8 mt-8 md:grid-cols-2 max-w-4xl mx-auto">
                    {plans.map((plan, index) => (
                      <PricingCard
                        key={plan.id}
                        plan={plan}
                        isPopular={index === 1}
                        userId={user.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {hasSubscription && (
              <div className="p-8 border border-gray-200 rounded-lg bg-gray-50">
                <GenerateFlow user={user} trainingRecord={trainingRecord} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}