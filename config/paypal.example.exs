# PayPal Configuration Example
# Copy this to config/dev.secret.exs or add to your environment variables

# Get these credentials from https://developer.paypal.com/dashboard/applications/
# You need to create an app and apply for Partner/Marketplace approval

config :streampai, :paypal,
  # :sandbox for testing, :live for production
  mode: :sandbox,
  # Your PayPal app client ID
  client_id: System.get_env("PAYPAL_CLIENT_ID") || "YOUR_CLIENT_ID",
  # Your PayPal app secret
  secret: System.get_env("PAYPAL_SECRET") || "YOUR_SECRET",
  # Webhook ID from PayPal Developer Dashboard
  webhook_id: System.get_env("PAYPAL_WEBHOOK_ID") || "YOUR_WEBHOOK_ID"

# IMPORTANT: Apply for PayPal Partner/Marketplace approval
# 1. Go to https://developer.paypal.com/dashboard
# 2. Create an app
# 3. Request production access
# 4. Apply for Partner API access
# 5. Fill out the partner application form
#
# For sandbox testing:
# 1. Use sandbox credentials
# 2. Create sandbox test accounts at https://developer.paypal.com/dashboard/accounts
# 3. Test the onboarding flow with sandbox business account
# 4. Test donations with sandbox personal account
#
# Webhook Setup:
# 1. Go to https://developer.paypal.com/dashboard/webhooks
# 2. Create a webhook pointing to: https://yourdomain.com/api/webhooks/paypal
# 3. Subscribe to these events:
#    - PAYMENT.CAPTURE.COMPLETED
#    - PAYMENT.CAPTURE.DENIED
#    - PAYMENT.CAPTURE.REFUNDED
# 4. Copy the Webhook ID to config above
