# PayPal Commerce Platform Integration

## Overview

This integration allows streamers to receive donations directly to their PayPal accounts through your platform. You act as a PayPal Partner/Marketplace, handling all payment processing while funds flow directly to streamers.

## Architecture

```
Viewer → Streampai → PayPal Orders API → Streamer's PayPal Account
                ↑
         Webhooks (real-time notifications)
```

### Key Features

- ✅ **Direct Payment**: Money goes straight to streamer's account (you never touch it)
- ✅ **Works with Personal & Business Accounts**: No need for streamers to upgrade
- ✅ **Real-time Webhooks**: Instant donation notifications
- ✅ **Programmatic**: No manual button creation needed
- ✅ **Sandbox Testing**: Full test environment before going live
- ✅ **OAuth Flow**: Streamers connect via secure PayPal OAuth

## Prerequisites

### 1. Apply for PayPal Partner/Marketplace Access

**IMPORTANT**: You must be approved as a PayPal Partner before this integration will work in production.

1. Go to https://developer.paypal.com/dashboard
2. Create an app
3. Request **production access**
4. Apply for **Partner API access**
5. Fill out the partner application form with:
   - Your business information
   - Platform description (streaming donation platform)
   - Expected transaction volume
   - Integration details

**Note**: Approval can take 1-2 weeks. Use sandbox for development in the meantime.

### 2. Get PayPal Credentials

#### Sandbox (Development)
1. Go to https://developer.paypal.com/dashboard/applications/sandbox
2. Create a REST API app
3. Note your **Client ID** and **Secret**
4. Create test accounts at https://developer.paypal.com/dashboard/accounts

#### Production (After Approval)
1. Go to https://developer.paypal.com/dashboard/applications/live
2. Use your approved Partner app credentials

### 3. Setup Webhooks

1. Go to https://developer.paypal.com/dashboard/webhooks
2. Create a webhook pointing to: `https://yourdomain.com/api/webhooks/paypal`
3. Subscribe to these events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
4. Copy the **Webhook ID**

## Installation & Configuration

### 1. Set Environment Variables

```bash
# Sandbox (Development)
export PAYPAL_SANDBOX_CLIENT_ID="your_sandbox_client_id"
export PAYPAL_SANDBOX_SECRET="your_sandbox_secret"
export PAYPAL_SANDBOX_WEBHOOK_ID="your_sandbox_webhook_id"

# Production
export PAYPAL_CLIENT_ID="your_production_client_id"
export PAYPAL_SECRET="your_production_secret"
export PAYPAL_WEBHOOK_ID="your_production_webhook_id"
```

### 2. Run Migrations

```bash
mix ecto.migrate
```

### 3. Update HTTP Client (TODO)

The integration currently uses `HTTPoison` but needs to be updated to use `Req` (which is already in your deps):

**Files to update:**
- `lib/streampai/integrations/paypal/client.ex`
- `lib/streampai/integrations/paypal/partner_referrals.ex`

**Example conversion:**
```elixir
# Before (HTTPoison)
HTTPoison.post(url, body, headers)

# After (Req)
Req.post(url, json: body, headers: headers)
```

## Usage

### For Streamers: Connect PayPal

1. Go to Dashboard → Settings
2. Click "Connect PayPal"
3. Get redirected to PayPal OAuth
4. Log in and approve permissions
5. Redirected back - connection complete!

### For Viewers: Make Donation

1. Visit streamer's donation page: `/u/:username`
2. Enter amount and optional message
3. Click "Donate"
4. Redirected to PayPal to complete payment
5. Return to confirmation page
6. Donation appears on stream in real-time!

## API Flow

### 1. Streamer Onboarding

```elixir
# Generate onboarding link
{:ok, %{signup_url: url}} =
  Streampai.Integrations.PayPal.PartnerReferrals.create_referral_link(user)

# Redirect streamer to signup_url
# After completion, PayPal redirects to: /settings/paypal/callback

# Handle callback
{:ok, connection} =
  Streampai.Integrations.PayPal.PartnerReferrals.handle_onboarding_callback(
    auth_code,
    shared_id,
    user
  )
```

### 2. Create Donation

```elixir
# Create PayPal order
{:ok, %{donation: donation, approval_url: url}} =
  Streampai.Integrations.PayPal.Orders.create_donation(
    streamer,
    Decimal.new("5.00"),  # amount
    "USD",                 # currency
    %{                     # donor info
      name: "John Doe",
      email: "john@example.com",
      message: "Great stream!"
    }
  )

# Redirect donor to approval_url
# After payment, PayPal redirects to: /donations/success
```

### 3. Capture Payment

```elixir
# Called after donor approves payment
{:ok, completed_donation} =
  Streampai.Integrations.PayPal.Orders.capture_donation(order_id)

# Donation status is now :completed
# Webhook will also fire with same information
```

### 4. Webhook Events

```elixir
# Webhooks are automatically processed
# Donations are updated in real-time
# PubSub broadcasts to LiveView for display
```

## Database Schema

### PayPalConnection
Stores streamer's connected PayPal account.

```elixir
defmodule Streampai.Integrations.PayPalConnection do
  attributes do
    uuid_primary_key :id
    attribute :merchant_id, :string        # PayPal payer_id
    attribute :merchant_email, :string
    attribute :account_status, :atom       # :pending, :active, :suspended, :revoked
    attribute :access_token, :string       # OAuth token (encrypted)
    attribute :refresh_token, :string      # For token renewal
    attribute :token_expires_at, :utc_datetime_usec
    attribute :permissions, {:array, :string}  # ["PAYMENT", "REFUND"]
    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User  # The streamer
  end
end
```

### PayPalDonation
Tracks donations from creation to completion.

```elixir
defmodule Streampai.Integrations.PayPalDonation do
  attributes do
    uuid_primary_key :id
    attribute :order_id, :string           # PayPal order ID
    attribute :capture_id, :string         # PayPal capture ID
    attribute :amount, :decimal
    attribute :currency, :string           # "USD"
    attribute :status, :atom               # :created, :approved, :completed, :refunded, etc.
    attribute :donor_name, :string
    attribute :donor_email, :string
    attribute :message, :string
    attribute :paypal_fee, :decimal        # PayPal processing fee
    attribute :net_amount, :decimal        # After fees
    attribute :webhook_event_id, :string   # For idempotency
    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User              # The streamer
    belongs_to :livestream, Streampai.Stream.Livestream    # Optional
  end
end
```

## Testing

### Sandbox Testing Flow

1. **Create Test Accounts**
   - Go to https://developer.paypal.com/dashboard/accounts
   - Create a Business account (for streamers)
   - Create a Personal account (for donors)

2. **Test Onboarding**
   ```bash
   # Start server
   mix phx.server

   # Login as test streamer
   # Click "Connect PayPal"
   # Login with sandbox business account
   # Approve permissions
   ```

3. **Test Donation**
   ```bash
   # Visit donation page: /u/teststreamer
   # Enter amount
   # Click donate
   # Login with sandbox personal account
   # Complete payment
   ```

4. **Verify Webhook**
   ```bash
   # Check logs for webhook event
   # Verify donation updated to :completed
   # Check database for donation record
   ```

## Security

### Webhook Signature Verification

All incoming webhooks are verified against PayPal's signature:

```elixir
defp verify_webhook_signature(conn) do
  # Extract PayPal headers
  transmission_id = get_req_header(conn, "paypal-transmission-id")
  # ... other headers

  # Verify with PayPal API
  case Client.post("/v1/notifications/verify-webhook-signature", payload) do
    {:ok, %{"verification_status" => "SUCCESS"}} -> :ok
    _ -> {:error, :invalid_signature}
  end
end
```

### Token Security

- Access tokens are stored encrypted (set `sensitive? true` in Ash)
- Tokens are automatically refreshed before expiration
- Never log or expose tokens in responses

## Troubleshooting

### "No changes detected" when generating migrations
**Solution**: Make sure `Streampai.Integrations` is added to `ash_domains` in `config/config.exs`

### HTTPoison warnings
**Solution**: Replace `HTTPoison` calls with `Req` (already in your deps)

### Webhook not firing
**Solution**:
1. Check webhook URL is publicly accessible
2. Verify webhook ID in config matches PayPal dashboard
3. Check PayPal webhook delivery logs in dashboard

### Token expired errors
**Solution**: Implement token refresh logic using `PartnerReferrals.refresh_access_token/1`

### Sandbox vs Production confusion
**Solution**: Set correct mode in config (`mode: :sandbox` or `mode: :live`)

## Production Checklist

- [ ] PayPal Partner approval received
- [ ] Production credentials configured
- [ ] Webhook URL pointing to production domain
- [ ] SSL certificate valid
- [ ] Database migrations run
- [ ] HTTP client updated to Req
- [ ] Test onboarding flow with real PayPal account
- [ ] Test donation flow end-to-end
- [ ] Webhook signature verification tested
- [ ] Error logging configured
- [ ] Monitoring alerts set up

## Next Steps

1. **Update HTTP Client**: Convert HTTPoison to Req
2. **Add Settings UI**: Create LiveView for PayPal connection in settings
3. **Create Donation Widget**: Build OBS overlay for donations
4. **Add Donation Page**: Public page for viewers to donate
5. **Implement Refunds**: Add refund handling if needed
6. **Add Analytics**: Track donation metrics
7. **Test Thoroughly**: Use sandbox extensively before production

## Resources

- [PayPal Partner API Docs](https://developer.paypal.com/docs/multiparty/)
- [PayPal Orders API v2](https://developer.paypal.com/docs/api/orders/v2/)
- [PayPal Webhooks Guide](https://developer.paypal.com/api/rest/webhooks/)
- [PayPal Sandbox](https://developer.paypal.com/dashboard/accounts)

## Support

For questions about:
- **Partner approval**: Contact PayPal Partner Support
- **Technical integration**: Check PayPal Developer Forums
- **This implementation**: Review code and comments in `/lib/streampai/integrations/paypal/`
