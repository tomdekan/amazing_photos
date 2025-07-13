import { redirect } from 'next/navigation'
import { auth } from '../../../auth'
import { headers } from 'next/headers'
import { getTrainingRecordByUser } from '../../lib/db'
import { GenerateFlow } from '../../components/GenerateFlow'
import { SignOutButton } from '@/components/SignOutButton'

export default async function GeneratePage() {
  const response = await auth.api.getSession({ headers: await headers() })
  if (!response) {
    redirect('/sign-in')
  }
  const { user } = response

  const trainingRecord = await getTrainingRecordByUser(user.id)

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
        <div className="p-10 mt-10 bg-white border border-gray-200 rounded-lg shadow-xl">
            <GenerateFlow user={user} trainingRecord={trainingRecord} />
        </div>
      </div>
    </main>
  )
}