defmodule StreampaiWeb.Router do
  use StreampaiWeb, :router
  use AshAuthentication.Phoenix.Router

  import AshAdmin.Router
  import Oban.Web.Router
  import Phoenix.LiveDashboard.Router

  alias StreampaiWeb.Plugs.ErrorTracker
  alias StreampaiWeb.Plugs.RedirectAfterAuth
  alias StreampaiWeb.Plugs.SafeLoadFromSession

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
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
    plug(:fetch_live_flash)
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

  pipeline :graphql do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(SafeLoadFromSession)
    plug(AshGraphql.Plug)
    plug(ErrorTracker)
  end

  pipeline :rate_limited_auth do
    plug(:accepts, ["html", "json"])
    plug(:fetch_session)
    plug(StreampaiWeb.Plugs.RegistrationLogger)
    plug(StreampaiWeb.Plugs.RateLimiter, limit: 7, window: 300_000)
    plug(StreampaiWeb.Plugs.EmailDomainFilter)
  end

  pipeline :widget do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    plug(:put_root_layout, false)
    plug(SafeLoadFromSession)
  end

  pipeline :electric_sync do
    plug(:accepts, ["json"])
  end

  scope "/admin" do
    pipe_through(:admin)

    ash_admin("/ash")
    oban_dashboard("/oban")

    live_dashboard("/dashboard",
      metrics: StreampaiWeb.Telemetry,
      live_session_name: :monitoring_dashboard
    )
  end

  scope "/", StreampaiWeb do
    pipe_through(:browser)

    # Serve uploaded slider images
    get("/slider_images/*path", SliderImageController, :serve)

    ash_authentication_live_session :authentication_optional,
      on_mount: {StreampaiWeb.LiveUserAuth, :handle_impersonation} do
      live("/", LandingLive)
      live("/privacy", PrivacyLive)
      live("/terms", TermsLive)
      live("/support", SupportLive)
      live("/contact", ContactLive)
      live("/u/:username", DonationLive)
    end

    get("/home", PageController, :home)
    get("/streaming/connect/:provider", MultiProviderAuth, :request)
    get("/streaming/connect/:provider/callback", MultiProviderAuth, :callback)

    # PayPal onboarding callback
    get("/settings/paypal/callback", PayPalCallbackController, :handle_callback)

    ash_authentication_live_session :authentication_required do
      live("/dashboard", DashboardLive)
      live("/dashboard/stream", DashboardStreamLive)
      live("/dashboard/chat-history", DashboardChatHistoryLive)
      live("/dashboard/patreons", DashboardPatreonsLive)
      live("/dashboard/viewers", ViewersLive)
      live("/dashboard/viewers/:id", ViewerDetailsLive)
      live("/dashboard/stream-history", DashboardStreamHistoryLive)
      live("/dashboard/stream-history/:stream_id", DashboardStreamHistoryDetailLive)
      live("/dashboard/widgets", DashboardWidgetsLive)
      live("/dashboard/smart-canvas", DashboardSmartCanvasLive)
      live("/dashboard/analytics", DashboardAnalyticsLive)
      live("/dashboard/settings", DashboardSettingsLive)
      live("/dashboard/moderate", DashboardModerateLive)
      live("/dashboard/moderate/:user_id", DashboardModerateStreamLive)
      live("/dashboard/admin/users", DashboardAdminUsersLive)
      live("/dashboard/widgets/chat", ChatWidgetSettingsLive)
      live("/dashboard/widgets/alertbox", AlertboxWidgetSettingsLive)
      live("/dashboard/widgets/donation-goal", DonationGoalWidgetSettingsLive)
      live("/dashboard/widgets/top-donors", TopDonorsWidgetSettingsLive)
      live("/dashboard/widgets/viewer-count", ViewerCountWidgetSettingsLive)
      live("/dashboard/widgets/follower-count", FollowerCountWidgetSettingsLive)
      live("/dashboard/widgets/timer", TimerWidgetSettingsLive)
      live("/dashboard/widgets/poll", PollWidgetSettingsLive)
      live("/dashboard/widgets/slider", SliderWidgetSettingsLive)
      live("/dashboard/widgets/giveaway", GiveawayWidgetSettingsLive)
      live("/dashboard/widgets/eventlist", EventlistWidgetSettingsLive)
    end

    sign_out_route(AuthController, "/auth/sign-out")

    sign_in_route(
      path: "/auth/sign-in",
      register_path: "/auth/register",
      reset_path: "/auth/reset",
      auth_routes_prefix: "/auth",
      overrides: [
        StreampaiWeb.AuthOverrides,
        AshAuthentication.Phoenix.Overrides.Default
      ]
    )

    reset_route(auth_routes_prefix: "/auth")

    get("/impersonation/start/:user_id", ImpersonationController, :start_impersonation)
    get("/impersonation/stop", ImpersonationController, :stop_impersonation)
    live("/w/:uuid", WidgetDisplayLive)

    auth_routes(AuthController, Streampai.Accounts.User, path: "/auth")
  end

  scope "/graphql" do
    pipe_through(:graphql)

    forward "/playground",
            Absinthe.Plug.GraphiQL,
            schema: Module.concat(["StreampaiWeb.GraphQL.Schema"]),
            interface: :playground

    forward "/",
            Absinthe.Plug,
            schema: Module.concat(["StreampaiWeb.GraphQL.Schema"])
  end

  # Echo API for benchmarking
  scope "/api", StreampaiWeb do
    pipe_through(:api)

    # Monitoring endpoints (IP-restricted)
    get("/health", MonitoringController, :health_check)
    get("/metrics", MonitoringController, :metrics)
    get("/system", MonitoringController, :system_info)
    get("/errors", MonitoringController, :errors)
    get("/errors/:id", MonitoringController, :error_detail)

    # Cloudflare Stream webhooks
    post("/webhooks/cloudflare/stream", CloudflareWebhookController, :handle_webhook)

    # PayPal webhooks
    post("/webhooks/paypal", PayPalWebhookController, :handle_webhook)
  end

  # Widget display routes - no layout, accessible by user_id
  scope "/w", StreampaiWeb.Components do
    pipe_through(:widget)

    live("/chat/:user_id", ChatObsWidgetLive)
    live("/alertbox/:user_id", AlertboxObsWidgetLive)
    live("/donation-goal/:user_id", DonationGoalObsWidgetLive)
    live("/top-donors/:user_id", TopDonorsObsWidgetLive)
    live("/viewer-count/:user_id", ViewerCountObsWidgetLive)
    live("/follower-count/:user_id", FollowerCountObsWidgetLive)
    live("/timer/:user_id", TimerObsWidgetLive)
    live("/poll/:user_id", PollObsWidgetLive)
    live("/slider/:user_id", SliderObsWidgetLive)
    live("/giveaway/:user_id", GiveawayObsWidgetLive)
    live("/eventlist/:user_id", EventlistObsWidgetLive)
    live("/smart-canvas/:user_id", SmartCanvasObsLive)
  end

  # Phoenix.Sync shape endpoints for Electric real-time sync
  scope "/shapes", StreampaiWeb do
    pipe_through(:electric_sync)

    get "/stream_events", SyncController, :stream_events
    get "/chat_messages", SyncController, :chat_messages
    get "/livestreams", SyncController, :livestreams
    get "/viewers", SyncController, :viewers
    get "/user_preferences", SyncController, :user_preferences
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
end
