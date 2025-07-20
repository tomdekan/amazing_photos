interface SubscriptionStatusCardProps {
  subscription: {
    planName: string
    status: string
    generationsUsed: number
    generationsLimit: number
    generationsRemaining: number
    cancelAtPeriodEnd: boolean
    currentPeriodEnd: Date
  } | null
}

export function SubscriptionStatusCard({ subscription }: SubscriptionStatusCardProps) {
  if (!subscription) {
    return (
      <div className="mb-6 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-yellow-500/10 rounded-full flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Warning</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-yellow-300">No Active Subscription</h3>
            <p className="text-sm text-yellow-400">Subscribe to start generating AI images</p>
          </div>
        </div>
      </div>
    )
  }

  const isActive = subscription.status === 'active'

  return (
    <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div>
            <h3 className="font-semibold text-white">{subscription.planName}</h3>
            <p className="text-sm text-slate-400 capitalize">{subscription.status}</p>
          </div>
        </div>
        
        {subscription.cancelAtPeriodEnd && (
          <div className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded-full">
            Cancels {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  )
} 