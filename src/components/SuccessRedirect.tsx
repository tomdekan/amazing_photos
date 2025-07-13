'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SuccessRedirectProps {
  customerName: string
  customerEmail: string
}

export function SuccessRedirect({ customerName, customerEmail }: SuccessRedirectProps) {
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Don't navigate here, just return 0
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Set up navigation after 5 seconds
    const navigationTimer = setTimeout(() => {
      router.push('/generate')
    }, 5000)

    return () => {
      clearInterval(timer)
      clearTimeout(navigationTimer)
    }
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Complete!</h1>
          <p className="text-gray-600">
            Thanks, {customerName}! A receipt has been emailed to {customerEmail}.
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-blue-800 font-medium">
            Redirecting to your dashboard in {countdown} seconds...
          </p>
        </div>

        <button
          onClick={() => router.push('/generate')}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard Now
        </button>
      </div>
    </main>
  )
} 