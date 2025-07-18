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
import FreeGenerationForm from '@/components/FreeGenerationForm'

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
    <div className="relative isolate bg-slate-950 text-white min-h-screen">
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
      </div>
      <main className="flex flex-col items-center py-3 px-4 sm:px-6 md:px-8">
        <div className="w-full max-w-4xl mx-auto">
          <header className="relative flex items-center justify-between w-full mb-8">
            <BackButton
              href="/"
              className="absolute -left-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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
              <span className="font-medium text-slate-200">{user.name}</span>
            </div>
            <SignOutButton />
          </header>

          <div className="overflow-hidden bg-slate-900/70 rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-sm">
            <div className="px-6 py-8 sm:p-10">
              <h1 className="text-3xl font-bold tracking-tight text-center text-white">
                Generate Your Photos
              </h1>
              <p className="mt-2 text-lg text-center text-slate-400">
                Follow the steps below to create your own AI-generated images.
              </p>
            </div>
            <div className="px-6 pb-8 space-y-8 sm:p-10 sm:pt-6">
              {/* Free Generation Form */}
              <div className="p-8 border border-slate-800 rounded-lg bg-slate-900">
                <FreeGenerationForm session={response} />
              </div>

              <div className="space-y-6">
                {hasSubscription ? (
                  <>
                    <CongratulationsMessage />
                    <SubscriptionStatusCard subscription={subscriptionData} />
                    <div className="pt-6 text-center border-t border-slate-800">
                      <SubscriptionManageButton userId={user.id} />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      Choose a plan to start generating photos of you
                    </h2>

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
                <div className="p-8 border border-slate-800 rounded-lg bg-slate-900">
                  <GenerateFlow user={user} trainingRecord={trainingRecord} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}