'use client'

import { useState } from 'react'

interface DebugSubscriptionProps {
  userId: string
}

export function DebugSubscription({ userId }: DebugSubscriptionProps) {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  const checkSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/debug-subscription?userId=${userId}`)
      const data = await response.json()
      setDebugData(data)
      console.log('Debug data:', data)
    } catch (error) {
      console.error('Debug failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const processLatestSession = async () => {
    if (!debugData?.stripe?.recentSessions?.length) {
      alert('No recent sessions found to process')
      return
    }

    setProcessing(true)
    try {
      const latestSession = debugData.stripe.recentSessions[0]
      const response = await fetch('/api/webhook-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: latestSession.id }),
      })
      
      const result = await response.json()
      console.log('Processing result:', result)
      
      if (result.success) {
        alert('Subscription processed successfully! Check subscription status again.')
        // Refresh debug data
        await checkSubscription()
      } else {
        alert(`Failed to process: ${result.error}`)
      }
    } catch (error) {
      console.error('Processing failed:', error)
      alert('Processing failed - check console')
    } finally {
      setProcessing(false)
    }
  }

  const cleanupAndFix = async () => {
    setCleaning(true)
    try {
      const response = await fetch('/api/cleanup-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      
      const result = await response.json()
      console.log('Cleanup result:', result)
      
      if (result.success) {
        alert(`Success! Deleted ${result.deleted} old records and set up latest subscription.`)
        // Refresh debug data
        await checkSubscription()
      } else {
        alert(`Failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Cleanup failed:', error)
      alert('Cleanup failed - check console')
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-semibold mb-2">Debug Subscription</h3>
      <div className="space-x-2 mb-4">
        <button
          onClick={checkSubscription}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Subscription Status'}
        </button>
        
        <button
          onClick={cleanupAndFix}
          disabled={cleaning}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {cleaning ? 'Cleaning...' : 'Clean & Fix Subscription'}
        </button>
        
        {debugData?.stripe?.recentSessions?.length > 0 && (
          <button
            onClick={processLatestSession}
            disabled={processing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Fix Latest Subscription'}
          </button>
        )}
      </div>
      
      {debugData && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Debug Results:</h4>
          <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(debugData, null, 2)}
          </pre>
          
          {debugData.recommendations && debugData.recommendations.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium text-orange-700">Recommendations:</h5>
              <ul className="list-disc list-inside text-sm text-orange-600">
                {debugData.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 