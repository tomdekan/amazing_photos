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

export default async function GeneratePage() {
  const response = await auth.api.getSession({ headers: await headers() })
  if (!response) {
    redirect('/sign-in')
  }
  const { user } = response

  const trainingRecord = await getTrainingRecordByUser(user.id)

  let subscriptionData = null
  let hasSubscription = false
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
    }
  } catch (error) {
    console.error('Error fetching subscription status:', error)
  }

  return (
    <main className="flex flex-col items-center justify-between min-h-screen p-24">
      <div className="absolute top-4 right-4">
      <SignOutButton />
      </div>
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center">Generate Your Photos</h1>
        <p className="mt-2 text-lg text-center text-gray-600">
          Welcome, {user.name}! Follow the steps below to create your own AI-generated images.
        </p>

        <div className="mt-8">
          <CongratulationsMessage />
          <SubscriptionStatusCard subscription={subscriptionData} />
        </div>

        {hasSubscription && (
          <div className="mt-6 text-center">
            <SubscriptionManageButton userId={user.id} />
          </div>
        )}
        <div className="p-10 mt-10 bg-white border border-gray-200 rounded-lg shadow-xl">
            <GenerateFlow user={user} trainingRecord={trainingRecord} />
        </div>
      </div>
    </main>
  )
}