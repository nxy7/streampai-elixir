defmodule StreampaiWeb.Router do
  use StreampaiWeb, :router
  use AshAuthentication.Phoenix.Router

  import AshAdmin.Router
  import Oban.Web.Router

  alias StreampaiWeb.Plugs.CsrfProtection
  alias StreampaiWeb.Plugs.ErrorTracker
  alias StreampaiWeb.Plugs.RateLimiter
  alias StreampaiWeb.Plugs.RedirectAfterAuth
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
    plug(:require_admin_access)
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
    plug(:require_admin_user)
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

      forward "/mailbox", Plug.Swoosh.MailboxPreview
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

    sign_out_route(AuthController, "/auth/sign-out")

    auth_routes(AuthController, Streampai.Accounts.User, path: "/auth")
  end

  # Protected monitoring endpoints (require admin access)
  pipeline :api_monitoring do
    plug(:accepts, ["json"])
    plug(:require_admin_access)
    plug(ErrorTracker)
  end

  # Public health check only (for load balancers, no sensitive data)
  scope "/api", StreampaiWeb do
    pipe_through(:api)

    get("/health", MonitoringController, :health_check)
    post("/webhooks/cloudflare/stream", CloudflareWebhookController, :handle_webhook)
    post("/webhooks/paypal", PayPalWebhookController, :handle_webhook)
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

    get "/stream_events", SyncController, :stream_events
    get "/chat_messages", SyncController, :chat_messages
    get "/livestreams", SyncController, :livestreams
    get "/viewers", SyncController, :viewers
    get "/user_preferences/:user_id", SyncController, :user_preferences
    get "/widget_configs/:user_id", SyncController, :widget_configs
    get "/notifications/:user_id", SyncController, :notifications
    get "/notification_reads/:user_id", SyncController, :notification_reads
    get "/global_notifications", SyncController, :global_notifications
    get "/user_roles/:user_id", SyncController, :user_roles

    # User-scoped data endpoints
    get "/stream_events/:user_id", SyncController, :user_stream_events
    get "/chat_messages/:user_id", SyncController, :user_chat_messages
    get "/livestreams/:user_id", SyncController, :user_livestreams
    get "/viewers/:user_id", SyncController, :user_viewers
    get "/streaming_accounts/:user_id", SyncController, :streaming_accounts
  end

  scope "/api/shapes", StreampaiWeb do
    pipe_through(:admin_electric_sync)

    get "/admin_users", SyncController, :admin_users
  end

  scope "/api/rpc", StreampaiWeb do
    pipe_through(:rpc)

    post("/run", AshTypescriptRpcController, :run)
    post("/validate", AshTypescriptRpcController, :validate)
    get("/socket-token", AshTypescriptRpcController, :socket_token)
    get("/impersonation-status", AshTypescriptRpcController, :impersonation_status)

    # Impersonation API endpoints (JSON responses for SPA)
    post("/impersonation/start/:user_id", ImpersonationController, :start_impersonation)
    post("/impersonation/stop", ImpersonationController, :stop_impersonation)
  end

  @monitoring_allowed_ips ["127.0.0.1", "::1", "194.9.78.14"]

  def require_admin_access(conn, _opts) do
    require Logger

    client_ip = get_client_ip(conn)
    admin_token = conn |> Plug.Conn.get_req_header("x-admin-token") |> List.first()
    allowed_token = System.get_env("ADMIN_TOKEN")

    cond do
      # Allow access from trusted IPs (localhost only)
      client_ip in @monitoring_allowed_ips ->
        conn

      # Allow access with valid admin token (token must be configured, no default)
      allowed_token && admin_token && Plug.Crypto.secure_compare(admin_token, allowed_token) ->
        conn

      # Block access if ADMIN_TOKEN is not configured (security: no default token)
      is_nil(allowed_token) ->
        Logger.warning("Admin access denied: ADMIN_TOKEN not configured, from IP: #{client_ip}")

        conn
        |> put_status(:forbidden)
        |> Phoenix.Controller.text("Access denied")
        |> halt()

      # Block access for invalid token
      true ->
        Logger.warning("Denied access to admin interface from IP: #{client_ip}")

        conn
        |> put_status(:forbidden)
        |> Phoenix.Controller.text("Access denied")
        |> halt()
    end
  end

  defp get_client_ip(conn) do
    case Plug.Conn.get_req_header(conn, "x-forwarded-for") do
      [forwarded_ip | _] ->
        forwarded_ip |> String.split(",") |> List.first() |> String.trim()

      [] ->
        conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end

  def require_admin_user(conn, _opts) do
    alias Streampai.Accounts.UserPolicy

    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: "Authentication required"})
        |> halt()

      user ->
        if UserPolicy.admin?(user) do
          conn
        else
          conn
          |> put_status(:forbidden)
          |> Phoenix.Controller.json(%{error: "Admin access required"})
          |> halt()
        end
    end
  end
end
