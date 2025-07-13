# Pricing Page Implementation Plan

## Overview
Create a comprehensive pricing page with subscription tiers for an AI photo generation product that emphasizes convenience and availability of creating photos of yourself whenever needed.

## Product Positioning
**Core Value Proposition**: "Always have the perfect photo of yourself, instantly generated with AI whenever you need it."

**Key Benefits to Emphasize**:
- Never worry about not having the right photo for social media, dating apps, or professional needs
- Create photos of yourself in any setting, style, or scenario
- No more scheduling photoshoots or asking friends to take pictures
- Instant availability - generate photos 24/7
- Consistent quality and professional appearance

## Pricing Tiers

### Tier 1: Personal ($6/month)
**Target**: Individual users with basic photo needs
**Features**:
- 50 AI photo generations per month
- Basic photo styles (casual, professional, social media)
- Standard processing speed
- Email support
- Access to mobile app

**Messaging**: "Perfect for personal use and social media"

### Tier 2: Creator ($9/month)
**Target**: Content creators, professionals, frequent users
**Features**:
- 150 AI photo generations per month
- Premium photo styles (artistic, themed, custom backgrounds)
- Priority processing (faster generation)
- Advanced editing options
- Priority email support
- Early access to new features
- Bulk generation capabilities

**Messaging**: "For creators who need photos frequently"

## Implementation Plan

### Phase 1: Database Schema Updates
1. **Create Subscription Models**
   - `Subscription` model with Stripe integration
   - `Plan` model for pricing tiers
   - Update `User` model with subscription relation and usage tracking

2. **Migration Strategy**
   - Add new tables without breaking existing functionality
   - Set up proper indexes for performance
   - Add usage tracking fields

### Phase 2: Stripe Integration Enhancement
1. **Stripe Product Setup**
   - Create products and prices in Stripe Dashboard
   - Set up subscription products (not one-time payments)
   - Configure webhooks for subscription events

2. **API Routes Development**
   - `/api/plans` - Fetch available plans
   - `/api/subscription/create` - Create new subscription
   - `/api/subscription/manage` - Customer portal access
   - `/api/subscription/cancel` - Cancel subscription
   - Enhanced `/api/webhook/route.ts` - Handle all subscription events

### Phase 3: UI Components
1. **Pricing Page Components**
   - `PricingCard` - Individual plan display with features
   - `PricingToggle` - Monthly/yearly toggle (future expansion)
   - `PlanFeatures` - Feature comparison
   - `CTAButton` - Subscribe/upgrade buttons
   - `TestimonialSection` - Social proof

2. **Subscription Management Components**
   - `SubscriptionStatus` - Current plan display
   - `UsageTracker` - Show remaining generations
   - `UpgradePrompt` - Encourage upgrades when limits reached
   - `BillingHistory` - Payment history display

### Phase 4: Access Control & Business Logic
1. **Usage Limiting**
   - Middleware to check subscription status
   - Generation count tracking
   - Plan-based feature restrictions
   - Graceful degradation for expired subscriptions

2. **Subscription Management**
   - Upgrade/downgrade flow
   - Proration handling
   - Cancel at period end
   - Reactivation flow

### Phase 5: User Experience
1. **Onboarding Flow**
   - New user trial or freemium approach
   - Guided plan selection
   - Seamless checkout experience

2. **Pricing Page Design**
   - Mobile-responsive design
   - Clear value proposition
   - Feature comparison table
   - Social proof elements
   - FAQ section

## Technical Implementation Details

### Database Schema
```prisma
model Plan {
  id            String @id @default(cuid())
  name          String
  description   String
  price         Int    // in cents
  currency      String @default("usd")
  interval      String @default("month")
  stripePriceId String @unique
  features      Json   // array of features
  generations   Int    // monthly generation limit
  isActive      Boolean @default(true)
  sortOrder     Int    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Subscription {
  id                    String    @id @default(cuid())
  userId                String    @unique
  stripeSubscriptionId  String    @unique
  stripeCustomerId      String
  status                String    // active, canceled, past_due, etc.
  planId                String
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAtPeriodEnd     Boolean   @default(false)
  generationsUsed       Int       @default(0)
  lastResetDate         DateTime  @default(now())
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id])
  plan                  Plan      @relation(fields: [planId], references: [id])
}

// Update User model
model User {
  // ... existing fields
  subscription    Subscription?
  generationsUsed Int @default(0)
  lastResetDate   DateTime @default(now())
}
```

### API Routes Structure
```
/api/
├── plans/
│   └── route.ts (GET - fetch all active plans)
├── subscription/
│   ├── create/route.ts (POST - create subscription)
│   ├── manage/route.ts (GET - customer portal)
│   ├── cancel/route.ts (POST - cancel subscription)
│   └── status/route.ts (GET - current status)
└── webhook/
    └── route.ts (POST - handle Stripe webhooks)
```

### Key Features

#### Pricing Page Features
- **Responsive Design**: Works on all devices
- **Feature Comparison**: Clear differences between tiers
- **Social Proof**: Testimonials and usage stats
- **FAQ Section**: Common questions about plans
- **Money-back Guarantee**: Build trust

#### Subscription Management
- **Upgrade/Downgrade**: Seamless plan changes
- **Usage Tracking**: Real-time generation counts
- **Billing History**: Past payments and invoices
- **Customer Portal**: Direct Stripe portal access

#### Access Control
- **Generation Limits**: Enforce monthly limits
- **Feature Gating**: Premium features for higher tiers
- **Graceful Degradation**: Handle expired subscriptions
- **Trial Management**: Free trial or freemium model

### Security Considerations
- **Webhook Verification**: Verify Stripe webhook signatures
- **Rate Limiting**: Prevent abuse of generation endpoints
- **Data Validation**: Validate all subscription data
- **Error Handling**: Graceful error handling for payment failures

### Performance Considerations
- **Caching**: Cache plan data and subscription status
- **Database Optimization**: Proper indexing for queries
- **API Response Times**: Optimize subscription checks
- **Background Jobs**: Handle webhook processing asynchronously

## Success Metrics
- **Conversion Rate**: Visitors to paying customers
- **Monthly Recurring Revenue (MRR)**: Revenue growth
- **Churn Rate**: Subscription cancellations
- **Usage Metrics**: Generations per user
- **Support Tickets**: Payment-related issues

## Timeline Estimate
- **Phase 1**: 2-3 days (Database schema)
- **Phase 2**: 3-4 days (Stripe integration)
- **Phase 3**: 4-5 days (UI components)
- **Phase 4**: 2-3 days (Access control)
- **Phase 5**: 2-3 days (UX polish)

**Total**: 13-18 days for complete implementation

## Next Steps
1. Get approval for this plan
2. Set up Stripe products and webhooks
3. Create database migrations
4. Implement API routes
5. Build UI components
6. Test subscription flows
7. Deploy and monitor

---

This plan provides a comprehensive foundation for a subscription-based pricing page that emphasizes the convenience and availability of AI-generated photos while providing clear value differentiation between tiers.