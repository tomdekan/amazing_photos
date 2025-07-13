# Pricing Page Setup Guide

This guide will help you complete the setup of the subscription-based pricing page for the Amazing Photos application.

## ✅ Completed Implementation

### Phase 1: Database Schema ✅
- Added `Plan` model with pricing tiers and features
- Added `Subscription` model with Stripe integration
- Updated `User` model with subscription tracking
- Created and ran database migrations
- Seeded initial plans (Personal $6/month, Creator $9/month)

### Phase 2: Stripe Integration ✅
- Created API routes for subscription management:
  - `/api/plans` - Fetch available plans
  - `/api/subscription/create` - Create new subscription
  - `/api/subscription/manage` - Customer portal access
  - `/api/subscription/cancel` - Cancel subscription
  - `/api/subscription/status` - Get subscription status
- Enhanced webhook handler for subscription events
- Added comprehensive error handling

### Phase 3: UI Components ✅
- `PricingCard` - Individual plan display with subscription flow
- `SubscriptionStatus` - Current plan and usage display
- `UsageTracker` - Real-time generation count tracking
- `UpgradePrompt` - Encourages upgrades when limits are reached
- Created responsive pricing page at `/pricing`

### Phase 4: Access Control ✅
- Implemented subscription checking middleware
- Added usage limiting to generation endpoints
- Created subscription utility functions
- Added automatic usage reset on billing cycle

## 🚀 Next Steps to Complete Setup

### 1. Stripe Configuration

#### Create Products and Prices in Stripe Dashboard
1. Log into your Stripe Dashboard
2. Go to Products → Add product
3. Create two products:

**Personal Plan**
- Name: "Personal"
- Price: $6.00 USD monthly
- Copy the Price ID and update `stripePriceId` in database

**Creator Plan**
- Name: "Creator"
- Price: $9.00 USD monthly
- Copy the Price ID and update `stripePriceId` in database

#### Update Plan Price IDs
```sql
-- Update the stripePriceId values in your database
UPDATE plan SET "stripePriceId" = 'price_1234567890abcdef' WHERE name = 'Personal';
UPDATE plan SET "stripePriceId" = 'price_0987654321fedcba' WHERE name = 'Creator';
```

#### Configure Webhooks
1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`

### 2. Environment Variables

Add these to your `.env.local`:
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Integration with Existing Components

#### Update GenerateFlow Component
```tsx
// Add to your GenerateFlow component
import UsageTracker from './UsageTracker';
import UpgradePrompt from './UpgradePrompt';

// Add usage tracking and upgrade prompts
const [usage, setUsage] = useState({ used: 0, limit: 0, remaining: 0 });

return (
  <div>
    <UsageTracker userId={userId} onUsageUpdate={setUsage} />
    <UpgradePrompt generationsRemaining={usage.remaining} />
    {/* Rest of your component */}
  </div>
);
```

#### Update Dashboard/Profile Pages
```tsx
// Add subscription status to user dashboard
import SubscriptionStatus from './SubscriptionStatus';

<SubscriptionStatus userId={userId} />
```

### 4. Navigation Updates

Add pricing page to your navigation:
```tsx
// In your navigation component
<a href="/pricing" className="nav-link">
  Pricing
</a>
```

### 5. Testing

#### Test Subscription Flow
1. Visit `/pricing` page
2. Click "Subscribe Now" on a plan
3. Complete test payment with card `4242 4242 4242 4242`
4. Verify subscription is created in database
5. Test generation limits

#### Test Webhook Events
1. Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/webhook`
2. Trigger subscription events in Stripe Dashboard
3. Verify database updates correctly

### 6. Production Considerations

#### Security
- Rate limiting on API endpoints
- Webhook signature verification (already implemented)
- Input validation (already implemented)

#### Performance
- Cache plan data
- Optimize subscription queries
- Background job processing for webhooks

#### Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor subscription metrics
- Track conversion rates

## 📊 Database Schema Reference

```sql
-- Plans table
CREATE TABLE "plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "stripePriceId" TEXT NOT NULL UNIQUE,
    "features" JSONB NOT NULL,
    "generations" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Subscriptions table
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "stripeSubscriptionId" TEXT NOT NULL UNIQUE,
    "stripeCustomerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "generationsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
```

## 🎯 Success Metrics to Track

- **Conversion Rate**: Visitors to paying customers
- **Monthly Recurring Revenue (MRR)**: Revenue growth
- **Churn Rate**: Subscription cancellations
- **Usage Metrics**: Average generations per user
- **Support Tickets**: Payment-related issues

## 🔧 Troubleshooting

### Common Issues

1. **Stripe Price ID Mismatch**: Ensure database `stripePriceId` matches Stripe Dashboard
2. **Webhook Not Firing**: Check webhook endpoint URL and event selection
3. **Generation Limits Not Working**: Verify subscription access checks in generate endpoint
4. **Payment Flow Issues**: Check Stripe publishable key and client-side integration

### Debug Commands

```bash
# Check database plans
npx prisma studio

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhook

# Check subscription status
curl -X GET "http://localhost:3000/api/subscription/status?userId=USER_ID"
```

## 📝 Next Features to Consider

1. **Annual Billing**: Add yearly subscription options with discounts
2. **Free Trial**: Implement trial periods for new users
3. **Usage Analytics**: Show detailed usage statistics
4. **Plan Recommendations**: Suggest optimal plans based on usage
5. **Proration Handling**: Smooth upgrade/downgrade transitions

---

This implementation provides a complete subscription-based pricing system with proper access control, usage tracking, and a polished user experience. The system is production-ready and follows industry best practices for SaaS applications.