defmodule StreampaiWeb.Router do
  use StreampaiWeb, :router

  import Oban.Web.Router
  use AshAuthentication.Phoenix.Router
  import Phoenix.LiveDashboard.Router

  import AshAdmin.Router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {StreampaiWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :load_from_session
    # plug StreampaiWeb.AuthPlug, :load_from_session
    plug StreampaiWeb.Plugs.ErrorTracker
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug :load_from_bearer
    # plug StreampaiWeb.AuthPlug, :load_from_bearer
    plug StreampaiWeb.Plugs.ErrorTracker
  end

  pipeline :check_monitoring_ip do
    plug :check_monitoring_access
  end

  @monitoring_allowed_ips ["127.0.0.1", "::1"]

  defp check_monitoring_access(conn, _opts) do
    client_ip = get_client_ip(conn)

    if client_ip in @monitoring_allowed_ips do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.text("Access denied to monitoring interface")
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

  scope "/" do
    pipe_through :browser
    ash_admin "/admin/ash"
  end

  scope "/admin", StreampaiWeb do
    if Application.compile_env(:streampai, :env) == :prod do
      pipe_through [:browser, :check_monitoring_ip]
    else
      pipe_through :browser
    end

    oban_dashboard("/oban")

    live_dashboard "/dashboard",
      metrics: StreampaiWeb.Telemetry,
      live_session_name: :monitoring_dashboard
  end

  scope "/", StreampaiWeb do
    pipe_through :browser

    ash_authentication_live_session :authentication_optional,
      on_mount: {StreampaiWeb.LiveUserAuth, :handle_impersonation} do
      live "/", LandingLive
      live "/privacy", PrivacyLive
      live "/terms", TermsLive
      live "/support", SupportLive
      live "/contact", ContactLive
    end

    live "/widgets/chat/display", Components.ChatObsWidgetLive
    live "/widgets/alertbox/display", Components.AlertboxObsWidgetLive

    get "/home", PageController, :home
    get "/streaming/connect/:provider", MultiProviderAuth, :request
    get "/streaming/connect/:provider/callback", MultiProviderAuth, :callback

    ash_authentication_live_session :authentication_required,
      on_mount: [
        {StreampaiWeb.LiveUserAuth, :handle_impersonation},
        {StreampaiWeb.LiveUserAuth, :dashboard_presence}
      ] do
      live "/dashboard", DashboardLive
      live "/dashboard/stream", StreamLive
      live "/dashboard/chat-history", ChatHistoryLive
      live "/dashboard/widgets", WidgetsLive
      live "/dashboard/analytics", AnalyticsLive
      live "/dashboard/settings", SettingsLive
      live "/dashboard/admin/users", UsersLive
      live "/widgets/chat", ChatWidgetSettingsLive
      live "/widgets/alertbox", AlertboxWidgetSettingsLive
    end

    get "/impersonation/start/:user_id", ImpersonationController, :start_impersonation
    get "/impersonation/stop", ImpersonationController, :stop_impersonation
    live "/button/:id", ButtonLive
    live "/counter", CounterLive
    live "/cursors", SharedCursorLive
    live "/w/:uuid", WidgetDisplayLive
    sign_out_route AuthController, "/auth/sign-out"

    # Remove these if you'd like to use your own authentication views
    sign_in_route path: "/auth/sign-in",
                  register_path: "/auth/register",
                  reset_path: "/auth/reset",
                  auth_routes_prefix: "/auth",
                  overrides: [
                    StreampaiWeb.AuthOverrides,
                    AshAuthentication.Phoenix.Overrides.Default
                  ]

    auth_routes AuthController, Streampai.Accounts.User, path: "/auth"

    # Remove this if you do not want to use the reset password feature
    reset_route auth_routes_prefix: "/auth"
  end

  # Echo API for benchmarking
  scope "/api", StreampaiWeb do
    pipe_through :api

    # Full echo with all request details
    match :*, "/echo", EchoController, :echo
    match :*, "/echo/*path", EchoController, :echo

    # Simple echo for performance testing
    match :*, "/simple", EchoController, :simple_echo

    # Optimized versions for performance testing
    match :*, "/ultra", EchoController, :ultra_minimal
    match :*, "/json", EchoController, :simple_json
    match :*, "/static", EchoController, :static_response

    # Echo with configurable delay
    match :*, "/delay", EchoController, :echo_with_delay
    match :*, "/delay/:delay", EchoController, :echo_with_delay
  end

  # High-performance endpoint with minimal middleware
  scope "/fast", StreampaiWeb do
    # No middleware stack
    pipe_through []

    get "/test", EchoController, :ultra_minimal
    # get "/plug", StreampaiWeb.Plugs.FastResponse, []
  end

  # Monitoring endpoints (IP-restricted)
  scope "/monitoring", StreampaiWeb do
    pipe_through :api

    get "/health", MonitoringController, :health_check
    get "/metrics", MonitoringController, :metrics
    get "/system", MonitoringController, :system_info
    get "/errors", MonitoringController, :errors
    get "/errors/:id", MonitoringController, :error_detail
  end
end
