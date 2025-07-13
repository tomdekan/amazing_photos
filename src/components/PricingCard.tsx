'use client';

import { useState } from 'react';

interface PricingCardProps {
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    features: string[];
    generations: number;
    stripePriceId: string;
  };
  isPopular?: boolean;
  userId?: string;
}

export default function PricingCard({ plan, isPopular = false, userId }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!userId) {
      window.location.href = '/sign-in';
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          userId,
          planId: plan.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url, error } = await response.json();
      if (error) {
        throw new Error(error);
      }

      window.location.href = url;
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative rounded-lg p-6 ${
      isPopular 
        ? 'bg-blue-50 border-2 border-blue-500 shadow-lg' 
        : 'bg-white border border-gray-200 shadow-sm'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {plan.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {plan.description}
        </p>
        
        <div className="mb-6">
          <span className="text-3xl font-bold text-gray-900">
            ${(plan.price / 100).toFixed(0)}
          </span>
          <span className="text-gray-600 text-sm">/month</span>
        </div>
        
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            isPopular
              ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300'
              : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400'
          }`}
        >
          {isLoading ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-600">
              {plan.generations} AI photo generations per month
            </span>
          </div>
          
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-600">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}