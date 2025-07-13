'use client'

import React from 'react'

interface SubscriptionManageButtonProps {
  userId: string
}

export function SubscriptionManageButton({ userId }: SubscriptionManageButtonProps) {
  const [loading, setLoading] = React.useState(false)

  const handleManage = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Failed to fetch management URL', data.error)
      }
    } catch (err) {
      console.error('Error redirecting to subscription management', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleManage}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Redirecting...' : 'Manage Subscription'}
    </button>
  )
} 