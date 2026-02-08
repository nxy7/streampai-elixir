defmodule StreampaiWeb.Router do
  use StreampaiWeb, :router
  use AshAuthentication.Phoenix.Router

  import AshAdmin.Router
  import Oban.Web.Router

  alias StreampaiWeb.Plugs.CsrfProtection
  alias StreampaiWeb.Plugs.ErrorTracker
  alias StreampaiWeb.Plugs.RateLimiter
  alias StreampaiWeb.Plugs.RedirectAfterAuth
  alias StreampaiWeb.Plugs.RequireAdminAccess
  alias StreampaiWeb.Plugs.RequireAdminUser
  alias StreampaiWeb.Plugs.RpcLogger
  alias StreampaiWeb.Plugs.SafeLoadFromSession

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_flash)
    plug(:put_root_layout, html: {StreampaiWeb.Layouts, :root})
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
    plug(SafeLoadFromSession)
    plug(ErrorTracker)
    plug(RedirectAfterAuth)
  end

  pipeline :admin do
    plug(:accepts, ["html"])
    plug(RequireAdminAccess)
    plug(:fetch_session)
    plug(:fetch_flash)
    plug(:put_root_layout, html: {StreampaiWeb.Layouts, :root})
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
    plug(SafeLoadFromSession)
    plug(ErrorTracker)
    plug(RedirectAfterAuth)
  end

  pipeline :api do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(:load_from_bearer)
    plug(ErrorTracker)
  end

  pipeline :rpc do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(SafeLoadFromSession)
    plug(CsrfProtection)
    plug(RpcLogger)
    plug(ErrorTracker)
  end

  pipeline :rate_limited_auth do
    plug(:accepts, ["html", "json"])
    plug(:fetch_session)
    plug(StreampaiWeb.Plugs.RegistrationLogger)
    plug(RateLimiter, limit: 7, window: 300_000)
    plug(StreampaiWeb.Plugs.EmailDomainFilter)
  end

  # API pipeline for SPA auth
  pipeline :api_auth do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(CsrfProtection)
    plug(RateLimiter, limit: 7, window: 300_000)
  end

  pipeline :electric_sync do
    plug(:accepts, ["json"])
  end

  pipeline :admin_electric_sync do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(SafeLoadFromSession)
    plug(RequireAdminUser)
  end

  # Admin routes (not prefixed with /api - internal only)
  scope "/admin" do
    pipe_through(:admin)

    ash_admin("/ash")
    oban_dashboard("/oban")
  end

  # Dev mailbox for previewing sent emails (only in dev)
  if Application.compile_env(:streampai, :dev_routes) do
    scope "/dev" do
      pipe_through(:browser)

      forward("/mailbox", Plug.Swoosh.MailboxPreview)
    end
  end

  # JSON API auth routes for SPA (no CSRF required)
  # Must come BEFORE the browser scope to avoid CSRF protection
  scope "/api/auth", StreampaiWeb do
    pipe_through(:api_auth)

    post("/register", ApiAuthController, :register)
    post("/sign-in", ApiAuthController, :sign_in)
  end

  # All API routes are prefixed with /api for clean proxy configuration
  scope "/api", StreampaiWeb do
    pipe_through(:browser)

    get("/slider_images/*path", SliderImageController, :serve)
    get("/streaming/connect/:provider", MultiProviderAuth, :request)
    get("/streaming/connect/:provider/callback", MultiProviderAuth, :callback)
    get("/settings/paypal/callback", PayPalCallbackController, :handle_callback)
    get("/paddle/callback", PaddleCallbackController, :callback)

    sign_out_route(AuthController, "/auth/sign-out")

    auth_routes(AuthController, Streampai.Accounts.User, path: "/auth")
  end

  # Protected monitoring endpoints (require admin access)
  pipeline :api_monitoring do
    plug(:accepts, ["json"])
    plug(RequireAdminAccess)
    plug(ErrorTracker)
  end

  # Public health check only (for load balancers, no sensitive data)
  scope "/api", StreampaiWeb do
    pipe_through(:api)

    get("/health", MonitoringController, :health_check)
    post("/webhooks/cloudflare/stream", CloudflareWebhookController, :handle_webhook)
    post("/webhooks/paypal", PayPalWebhookController, :handle_webhook)
    post("/webhooks/paddle", PaddleWebhookController, :handle_webhook)
  end

  # Protected monitoring endpoints (admin access required)
  scope "/api", StreampaiWeb do
    pipe_through(:api_monitoring)

    get("/metrics", MonitoringController, :metrics)
    get("/system", MonitoringController, :system_info)
    get("/errors", MonitoringController, :errors)
    get("/errors/:id", MonitoringController, :error_detail)
  end

  scope "/api/shapes", StreampaiWeb do
    pipe_through(:electric_sync)

    get("/stream_events", SyncController, :stream_events)
    get("/livestreams", SyncController, :livestreams)
    get("/viewers", SyncController, :viewers)
    get("/user_preferences/:user_id", SyncController, :user_preferences)
    get("/widget_configs/:user_id", SyncController, :widget_configs)
    get("/notifications/:user_id", SyncController, :notifications)
    get("/notification_reads/:user_id", SyncController, :notification_reads)
    get("/global_notifications", SyncController, :global_notifications)
    get("/user_roles/:user_id", SyncController, :user_roles)

    # User-scoped data endpoints
    get("/stream_events/:user_id", SyncController, :user_stream_events)
    get("/livestreams/:user_id", SyncController, :user_livestreams)
    get("/viewers/:user_id", SyncController, :user_viewers)
    get("/streaming_accounts/:user_id", SyncController, :streaming_accounts)
    get("/highlighted_messages/:user_id", SyncController, :highlighted_messages)
    get("/current_stream_data/:user_id", SyncController, :current_stream_data)
    get("/stream_timers/:user_id", SyncController, :stream_timers)
    get("/chat_bot_configs/:user_id", SyncController, :chat_bot_configs)
    get("/support_tickets/:user_id", SyncController, :support_tickets)
    get("/support_messages/:ticket_id", SyncController, :support_messages)
  end

  scope "/api/shapes", StreampaiWeb do
    pipe_through(:admin_electric_sync)

    get("/admin_users", SyncController, :admin_users)
    get("/admin_support_tickets", SyncController, :admin_support_tickets)
    get("/admin_support_messages", SyncController, :admin_support_messages)
  end

  scope "/api/rpc", StreampaiWeb do
    pipe_through(:rpc)

    post("/run", AshTypescriptRpcController, :run)
    post("/validate", AshTypescriptRpcController, :validate)
    get("/socket-token", AshTypescriptRpcController, :socket_token)
    post("/paddle/checkout", PaddleCheckoutController, :create)
    get("/session-status", AshTypescriptRpcController, :session_status)

    # Impersonation API endpoints (JSON responses for SPA)
    post("/impersonation/start/:user_id", ImpersonationController, :start_impersonation)
    post("/impersonation/stop", ImpersonationController, :stop_impersonation)
  end
end
