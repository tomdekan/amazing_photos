'use client'

import { useState, useEffect } from 'react'

export function CongratulationsMessage() {
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    const hasSeenCongrats = localStorage.getItem('hasSeenCongratulations')
    if (!hasSeenCongrats) {
      setShowMessage(true)
    }
  }, [])

  const dismissMessage = () => {
    localStorage.setItem('hasSeenCongratulations', 'true')
    setShowMessage(false)
  }

  if (!showMessage) return null

  return (
    <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 relative">
      <button
        onClick={dismissMessage}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">🎉 Congratulations!</h3>
      </div>
      
      <p className="text-gray-700 mb-3">
        Welcome to Amazing Photos! Your subscription is now active and you're ready to start generating incredible AI images.
      </p>
      
      <p className="text-sm text-gray-600">
        Get started by uploading photos to train your personal AI model, then generate unlimited variations!
      </p>
    </div>
  )
} 