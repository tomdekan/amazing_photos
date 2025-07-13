'use client';

import { useState, useEffect } from 'react';

interface SubscriptionStatusProps {
  userId: string;
}

interface SubscriptionData {
  hasSubscription: boolean;
  subscription?: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    generationsUsed: number;
    generationsLimit: number;
    planName: string;
    planPrice: number;
  };
  generationsUsed: number;
  generationsLimit: number;
  generationsRemaining: number;
}

export default function SubscriptionStatus({ userId }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [userId]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/subscription/status?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Failed to open customer portal:', err);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  if (error) {
    return <div className="text-red-600 text-sm">Error: {error}</div>;
  }

  if (!subscription?.hasSubscription) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">No Active Subscription</h3>
        <p className="text-yellow-700 text-sm mb-3">
          Subscribe to a plan to start generating AI photos of yourself.
        </p>
        <a
          href="/pricing"
          className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
        >
          View Plans
        </a>
      </div>
    );
  }

  const { subscription: sub } = subscription;
  const usagePercentage = (subscription.generationsUsed / subscription.generationsLimit) * 100;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {sub?.planName} Plan
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          sub?.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {sub?.status}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Generations Used</span>
            <span>{subscription.generationsUsed} / {subscription.generationsLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                usagePercentage > 80 ? 'bg-red-600' : 
                usagePercentage > 60 ? 'bg-yellow-600' : 
                'bg-green-600'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {subscription.generationsRemaining} generations remaining
          </p>
        </div>

        <div className="text-sm text-gray-600">
          <p>Billing period: {new Date(sub?.currentPeriodStart || '').toLocaleDateString()} - {new Date(sub?.currentPeriodEnd || '').toLocaleDateString()}</p>
          <p>Monthly cost: ${((sub?.planPrice || 0) / 100).toFixed(2)}</p>
        </div>

        {sub?.cancelAtPeriodEnd && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <p className="text-orange-800 text-sm">
              Your subscription will cancel at the end of the current billing period ({new Date(sub.currentPeriodEnd).toLocaleDateString()}).
            </p>
          </div>
        )}

        <button
          onClick={handleManageSubscription}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
        >
          Manage Subscription
        </button>
      </div>
    </div>
  );
}