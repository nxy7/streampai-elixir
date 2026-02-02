# Fix all tests, start deep refactoring session to ensure quality and maintainable code

# Implement 'support chat' system

- backend machinery to make 'support chat' work
- user can create 'new chat' which shows up in '/admin/support' page
- admin can chat with user from that page
- admin can mark chat as 'resolved' which ends the chat (user still can access 'past chats')

Then add other actions on button that opens 'chat with Streampai' like

- request a feature
- report a bug

# Dodo Payments Integration Plan

## Overview

Replace PayPal with Dodo Payments as the donation/payment processor. Dodo acts as a Merchant of Record, handling tax, compliance, and global payments. Use their Checkout Sessions API (recommended approach) with webhook-based confirmation.

**Docs:** https://docs.dodopayments.com
**API:** REST with Bearer token auth, SDKs for TS/Python/Go (no Elixir SDK - use raw HTTP via Req)

## Architecture

### Backend Changes

1. **Config & Secrets**
   - Add `DODO_PAYMENTS_API_KEY` and `DODO_WEBHOOK_SECRET` to runtime.exs
   - Add Dodo product IDs to config (one per donation tier, or use dynamic amounts)

2. **New Module: `Streampai.Payments.Dodo`**
   - `create_checkout_session/3` - Creates a Dodo checkout session via `POST /checkouts`
     - Params: streamer user_id, amount, currency, donor info, return_url
     - Returns checkout_url for redirect
   - `verify_webhook/2` - Verifies webhook signature using Standard Webhooks spec
     - Validates `webhook-id`, `webhook-signature`, `webhook-timestamp` headers

3. **New Controller: `StreampaiWeb.DodoWebhookController`**
   - Route: `POST /api/webhooks/dodo` (public, no CSRF)
   - Handles webhook events:
     - `payment.completed` - Triggers donation pipeline (`Donations.Pipeline.process_donation/1`)
     - `payment.failed` - Log and optionally notify
     - `subscription.*` - Future: handle subscription events
   - Pattern: Same as existing `PayPalWebhookController`

4. **Update Donation Pipeline**
   - Add `:dodo` as a platform in `Donations.Pipeline`
   - Map Dodo webhook payload to existing donation format (donor_name, amount, currency, message)

5. **Router Changes**
   - Add `post "/webhooks/dodo", DodoWebhookController, :handle_webhook` to public API scope

### Frontend Changes

1. **Donation Page** (`/u/:username` or dedicated donation page)
   - Replace PayPal button with Dodo checkout flow
   - On submit: call RPC action that creates checkout session server-side
   - Redirect user to `checkout_url` returned by Dodo
   - After payment: Dodo redirects back to `return_url` with success/cancel status

2. **New RPC Action: `create_donation_checkout`**
   - Ash action in Stream or new Payments domain
   - Accepts: streamer_id, amount, currency, donor_name, message, voice
   - Creates Dodo checkout session with metadata (streamer_id, message, voice)
   - Returns checkout_url

### Webhook Flow

```
User -> Donation Page -> RPC create_checkout -> Dodo API (create session)
                                                    |
User <- Redirect to checkout_url <-----------------+
                                                    |
User completes payment on Dodo hosted checkout      |
                                                    v
Dodo -> POST /api/webhooks/dodo -> DodoWebhookController
                                        |
                                        v
                              Verify signature
                                        |
                                        v
                        Donations.Pipeline.process_donation()
                              (TTS, alerts, events)
```

### Migration Path from PayPal

- Keep PayPal webhook controller active during transition
- Add feature flag or config toggle for active payment provider
- Eventually remove PayPal code once Dodo is stable

## Implementation Order

1. Add Dodo config and HTTP client module
2. Create webhook controller with signature verification
3. Wire webhook to donation pipeline
4. Add RPC action for checkout session creation
5. Update frontend donation page
6. Test end-to-end with Dodo test mode (`test.dodopayments.com`)
7. Remove/deprecate PayPal integration
