defmodule StreampaiWeb.Router do
  use StreampaiWeb, :router
  use AshAuthentication.Phoenix.Router

  import AshAdmin.Router
  import Oban.Web.Router

  alias StreampaiWeb.Plugs.ErrorTracker
  alias StreampaiWeb.Plugs.RedirectAfterAuth
  alias StreampaiWeb.Plugs.SafeLoadFromSession

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
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
    plug(ErrorTracker)
  end


  pipeline :rate_limited_auth do
    plug(:accepts, ["html", "json"])
    plug(:fetch_session)
    plug(StreampaiWeb.Plugs.RegistrationLogger)
    plug(StreampaiWeb.Plugs.RateLimiter, limit: 7, window: 300_000)
    plug(StreampaiWeb.Plugs.EmailDomainFilter)
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

  scope "/admin" do
    pipe_through(:admin)

    ash_admin("/ash")
    oban_dashboard("/oban")
  end

  scope "/", StreampaiWeb do
    pipe_through(:browser)

    get("/slider_images/*path", SliderImageController, :serve)
    get("/home", PageController, :home)
    get("/streaming/connect/:provider", MultiProviderAuth, :request)
    get("/streaming/connect/:provider/callback", MultiProviderAuth, :callback)
    get("/settings/paypal/callback", PayPalCallbackController, :handle_callback)

    sign_out_route(AuthController, "/auth/sign-out")

    get("/impersonation/start/:user_id", ImpersonationController, :start_impersonation)
    get("/impersonation/stop", ImpersonationController, :stop_impersonation)

    auth_routes(AuthController, Streampai.Accounts.User, path: "/auth")
  end


  scope "/api", StreampaiWeb do
    pipe_through(:api)

    get("/health", MonitoringController, :health_check)
    get("/metrics", MonitoringController, :metrics)
    get("/system", MonitoringController, :system_info)
    get("/errors", MonitoringController, :errors)
    get("/errors/:id", MonitoringController, :error_detail)

    post("/webhooks/cloudflare/stream", CloudflareWebhookController, :handle_webhook)
    post("/webhooks/paypal", PayPalWebhookController, :handle_webhook)
  end

  scope "/shapes", StreampaiWeb do
    pipe_through(:electric_sync)

    get "/stream_events", SyncController, :stream_events
    get "/chat_messages", SyncController, :chat_messages
    get "/livestreams", SyncController, :livestreams
    get "/viewers", SyncController, :viewers
    get "/user_preferences", SyncController, :user_preferences
    get "/widget_configs/:user_id", SyncController, :widget_configs
    get "/notifications/:user_id", SyncController, :notifications
    get "/notification_reads/:user_id", SyncController, :notification_reads
    get "/global_notifications", SyncController, :global_notifications
    get "/user_roles/:user_id", SyncController, :user_roles
  end

  scope "/shapes", StreampaiWeb do
    pipe_through(:admin_electric_sync)

    get "/admin_users", SyncController, :admin_users
  end

  scope "/rpc", StreampaiWeb do
    pipe_through(:rpc)

    post("/run", AshTypescriptRpcController, :run)
    post("/validate", AshTypescriptRpcController, :validate)
  end

  @monitoring_allowed_ips ["127.0.0.1", "::1", "194.9.78.14"]

  def require_admin_access(conn, _opts) do
    client_ip = get_client_ip(conn)
    admin_token = conn |> Plug.Conn.get_req_header("x-admin-token") |> List.first()
    allowed_token = System.get_env("ADMIN_TOKEN") || "changeme"

    if client_ip in @monitoring_allowed_ips or (admin_token && admin_token == allowed_token) do
      conn
    else
      require Logger

      Logger.warning("Denied access to monitoring interface from IP: #{client_ip}")

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
