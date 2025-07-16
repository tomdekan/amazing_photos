'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsageTrackerProps {
  userId: string;
  onUsageUpdate?: (usage: { used: number; limit: number; remaining: number }) => void;
}

export default function UsageTracker({ userId, onUsageUpdate }: UsageTrackerProps) {
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch(`/api/subscription/status?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }
      const data = await response.json();
      
      const usageData = {
        used: data.generationsUsed || 0,
        limit: data.generationsLimit || 0,
        remaining: data.generationsRemaining || 0,
      };
      
      setUsage(usageData);
      onUsageUpdate?.(usageData);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
      setUsage({ used: 0, limit: 0, remaining: 0 });
    } finally {
      setLoading(false);
    }
  }, [userId, onUsageUpdate]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 rounded w-32"></div>;
  }

  if (!usage) {
    return <div className="text-gray-500 text-sm">Unable to load usage data</div>;
  }

  const percentage = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Generations</span>
        <span className={`font-medium ${
          usage.remaining <= 0 ? 'text-red-600' : 
          usage.remaining <= 10 ? 'text-yellow-600' : 
          'text-gray-900'
        }`}>
          {usage.used} / {usage.limit}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            percentage >= 100 ? 'bg-red-600' : 
            percentage >= 80 ? 'bg-yellow-600' : 
            'bg-green-600'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      
      <div className="text-xs text-gray-500">
        {usage.remaining > 0 
          ? `${usage.remaining} generations remaining` 
          : 'No generations remaining'
        }
      </div>
    </div>
  );
}