# Billing Flow Documentation

## Overview

Streampai uses Stripe for subscription management and billing. This document outlines the complete billing flow, data storage, webhook handling, and subscription lifecycle management.

## Architecture

### Core Components

1. **Streampai.Billing** - Main billing module for Stripe integration
2. **UserPremiumGrant** - Database model for tracking premium subscriptions
3. **User.tier** - Calculated field determining user subscription level
4. **Stripe Webhooks** - Event-driven subscription management

### Data Flow

```
User clicks "Upgrade to Pro" 
    ↓
Stripe Checkout Session created
    ↓
User completes payment on Stripe
    ↓
Stripe sends webhook events
    ↓
UserPremiumGrant created/updated
    ↓
User.tier automatically calculated as :pro
```

## Subscription Management

### Creating Subscriptions

**Entry Point**: Dashboard Settings → "Upgrade to Pro" button

**Process**:
1. `DashboardSettingsLive.handle_event("upgrade_to_pro")` triggered
2. `Billing.create_checkout_session(user)` called
3. Stripe Checkout Session created with:
   - Subscription mode
   - Pro plan price ID
   - User email and metadata
   - Success/cancel URLs
4. User redirected to Stripe-hosted checkout
5. User completes payment
6. Stripe processes subscription and sends webhooks

### Webhook Events

**Critical Events**:
- `customer.subscription.created` - New subscription activated
- `customer.subscription.updated` - Subscription renewed/modified  
- `customer.subscription.deleted` - Subscription cancelled/expired
- `invoice.payment_succeeded` - Successful payment
- `invoice.payment_failed` - Failed payment

**Webhook Handlers** (in `Streampai.Billing`):
```elixir
def handle_subscription_created(subscription)
def handle_subscription_deleted(subscription) 
def handle_subscription_updated(subscription)
```

## Data Storage

### UserPremiumGrant Schema

Primary table for tracking premium subscriptions:

```elixir
# Core fields
id                    # UUID primary key
user_id              # Foreign key to users table
type                 # :purchase or :grant
initiated_at         # When grant was initiated
granted_at           # When premium access was granted
granted_until        # Expiration date (null for active subscriptions)
revoked_at          # When access was revoked

# Stripe-specific fields  
stripe_subscription_id  # Links to Stripe subscription
granted_by_user_id     # Who granted access (self for payments)
expires_at             # Alternative expiration tracking
grant_reason           # "stripe_subscription" for payments
metadata               # JSON data for additional context
```

### User.tier Calculation

Automatically calculated based on premium grants:

```elixir
calculate :tier, :atom, expr(
  if count(user_premium_grants) > 0, 
  do: :pro, 
  else: :free
)
```

**Benefits**:
- Real-time tier determination
- No manual tier updates needed
- Consistent across the application
- Works with any grant type (payment, admin grant, etc.)

## Subscription States

### Active Subscription
- `UserPremiumGrant` exists with `stripe_subscription_id`
- `expires_at` contains subscription period end date
- `revoked_at` is null
- User.tier returns `:pro`

### Cancelled Subscription
- `UserPremiumGrant` still exists but `revoked_at` is set to cancellation time
- `expires_at` still contains original subscription period end date
- User retains `:pro` access until `expires_at` is reached
- User.tier returns `:free` only after `expires_at` passes

### Failed Payment
- Stripe automatically retries based on settings
- Subscription enters `past_due` status
- Webhook `invoice.payment_failed` received
- Subscription may be cancelled after retry period

### Paused/On Hold
- Subscription status becomes `paused`
- `handle_subscription_updated` processes status change
- Premium grant removed if not active/trialing
- User loses access during pause

## Payment Handling

### Successful Payments

1. **Invoice Payment Succeeded**:
   - Webhook: `invoice.payment_succeeded`
   - Ensures subscription remains active
   - Updates subscription metadata if needed

2. **Subscription Created**:
   - Webhook: `customer.subscription.created`  
   - Creates `UserPremiumGrant` record
   - Links to Stripe subscription ID
   - User immediately gains pro access

### Failed Payments

1. **Initial Failure**:
   - Webhook: `invoice.payment_failed`
   - Subscription enters `past_due` status
   - User retains access during retry period

2. **Retry Logic**:
   - Stripe automatically retries per configuration
   - Additional webhooks sent for each attempt
   - Subscription may recover or be cancelled

3. **Final Failure**:
   - Subscription cancelled after retries exhausted
   - Webhook: `customer.subscription.deleted`
   - `UserPremiumGrant` removed
   - User loses pro access

## Subscription Lifecycle

### New Subscription
```
User Payment → Stripe Checkout → Payment Success 
    ↓
subscription.created webhook
    ↓  
UserPremiumGrant created
    ↓
User.tier = :pro
```

### Renewal
```
Stripe auto-renewal → invoice.payment_succeeded
    ↓
No action needed (grant already exists)
    ↓
Subscription continues normally
```

### Cancellation by User
```
User cancels in Stripe Portal → subscription.deleted webhook
    ↓
UserPremiumGrant.revoked_at set to current timestamp
    ↓
User retains :pro access until expires_at is reached
    ↓
User.tier = :free only after expires_at passes
```

### Payment Failure
```
Payment fails → invoice.payment_failed webhook
    ↓
Subscription enters past_due
    ↓
Stripe retries payment automatically
    ↓
Either: Payment succeeds → back to normal
    Or: Final failure → subscription.deleted → revoked_at set → access continues until expires_at
```

## Configuration

### Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Plan Configuration  
STRIPE_PRO_PRICE_ID=price_...

# Application URLs
BASE_URL=https://streampai.com
```

### Application Config

```elixir
# config/config.exs or environment-specific configs
config :streampai,
  stripe_pro_price_id: System.get_env("STRIPE_PRO_PRICE_ID"),
  base_url: System.get_env("BASE_URL")
```

## Error Handling

### Webhook Failures
- Stripe automatically retries failed webhooks
- Use idempotency to handle duplicate events
- Log failures for manual review
- Gracefully handle missing users or subscriptions

### API Failures
- Stripe API calls wrapped in try/catch
- Fallback to checking subscription status directly
- User-friendly error messages
- Retry logic for transient failures

### Data Consistency
- Use database transactions for critical operations
- Validate webhook signatures to prevent tampering
- Handle edge cases (user deleted, subscription in unknown state)
- Regular reconciliation with Stripe data

## Security Considerations

### Webhook Security
- Validate webhook signatures using `STRIPE_WEBHOOK_SECRET`
- Use HTTPS endpoints only
- Implement request logging and monitoring
- Rate limiting to prevent abuse

### Data Protection
- Store minimal payment information
- Use Stripe Customer Portal for payment method updates
- Encrypt sensitive configuration values
- Audit access to billing data

### Access Control
- Premium features gated by `User.tier` calculation
- Real-time access checks (no caching of tier status)
- Graceful degradation when billing service unavailable
- Clear upgrade prompts for restricted features

## Monitoring and Observability

### Key Metrics
- Subscription creation rate
- Churn rate (cancellations)
- Failed payment rates
- Webhook processing success rates
- Revenue metrics via Stripe Dashboard

### Logging
- All webhook events
- Billing API calls and responses
- Subscription state changes
- Payment failures and retries

### Alerts
- Webhook failures
- High payment failure rates
- Subscription processing errors
- Revenue anomalies

## Future Enhancements

### Planned Features
- Multiple subscription tiers
- Annual billing discounts
- Trial periods
- Proration handling for mid-cycle changes
- Dunning management for failed payments

### Technical Improvements
- Background job processing for webhooks
- Subscription analytics dashboard
- Revenue recognition tracking
- Integration with accounting systems

## Troubleshooting

### Common Issues

1. **User reports no pro access after payment**:
   - Check webhook delivery in Stripe Dashboard
   - Verify `UserPremiumGrant` created
   - Check for webhook processing errors

2. **Subscription shows active but user has free tier**:
   - Verify `stripe_subscription_id` matches Stripe
   - Check if grant was accidentally deleted
   - Confirm webhook processing completed

3. **User charged but no subscription created**:
   - Check for failed webhook delivery
   - Look for processing errors in logs
   - Manual subscription creation may be needed

### Debug Commands

```bash
# Check user's premium grants
iex> User |> Ash.Query.load(:user_premium_grants) |> Ash.get!("user_id", actor: :system)

# Verify tier calculation
iex> User |> Ash.Query.load(:tier) |> Ash.get!("user_id", actor: :system)

# Check Stripe subscription status
iex> Billing.get_subscription_status(user)
```

---

This billing flow provides robust subscription management with clear data flow, comprehensive error handling, and real-time access control through the calculated `tier` field.