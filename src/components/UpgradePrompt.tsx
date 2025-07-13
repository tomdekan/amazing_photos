'use client';

import { useState } from 'react';

interface UpgradePromptProps {
  generationsRemaining: number;
  planName?: string;
  onUpgrade?: () => void;
}

export default function UpgradePrompt({ generationsRemaining, planName, onUpgrade }: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  // Show different prompts based on remaining generations
  if (generationsRemaining <= 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Monthly limit reached
            </h3>
            <p className="mt-1 text-sm text-red-700">
              You&apos;ve used all your generations for this month. {planName && `Your ${planName} plan`} will reset next billing cycle, or upgrade for more generations.
            </p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={onUpgrade || (() => window.location.href = '/pricing')}
                className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Upgrade Plan
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (generationsRemaining <= 10) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Running low on generations
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              You have {generationsRemaining} generation{generationsRemaining === 1 ? '' : 's'} left this month. Consider upgrading to get more generations.
            </p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={onUpgrade || (() => window.location.href = '/pricing')}
                className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Upgrade Plan
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}