defmodule StreampaiWeb.Router do
  use StreampaiWeb, :router

  use AshAuthentication.Phoenix.Router

  import AshAdmin.Router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {StreampaiWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :load_from_session
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug :load_from_bearer
  end

  scope "/" do
    pipe_through :browser

    ash_admin "/admin"
  end

  scope "/", StreampaiWeb do
    pipe_through :browser

    ash_authentication_live_session :authentication_optional,
      on_mount: {StreampaiWeb.LiveUserAuth, :live_user_optional} do
      live "/", LandingLive
    end
    get "/home", PageController, :home
    get "/streaming/connect/:provider", MultiProviderAuth, :request
    get "/streaming/connect/:provider/callback", MultiProviderAuth, :callback

    ash_authentication_live_session :authentication_required,
      on_mount: {StreampaiWeb.LiveUserAuth, :live_user_required} do
      live "/dashboard", DashboardLive
      live "/dashboard/stream", StreamLive
      live "/dashboard/chat-history", ChatHistoryLive
      live "/dashboard/widgets", WidgetsLive
      live "/dashboard/analytics", AnalyticsLive
      live "/dashboard/settings", SettingsLive
    end
    live "/button/:id", ButtonLive
    live "/counter", CounterLive
    live "/cursors", SharedCursorLive
    live "/svelte-cursors", SvelteCursorLive
    live "/svelte-test", SvelteTestLive
    auth_routes AuthController, Streampai.Accounts.User, path: "/auth"
    sign_out_route AuthController

    # Remove these if you'd like to use your own authentication views
    sign_in_route register_path: "/register",
                  reset_path: "/reset",
                  auth_routes_prefix: "/auth",
                  on_mount: [{StreampaiWeb.LiveUserAuth, :live_no_user}],
                  overrides: [
                    StreampaiWeb.AuthOverrides,
                    AshAuthentication.Phoenix.Overrides.Default
                  ]

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
    get "/plug", StreampaiWeb.Plugs.FastResponse, []
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:streampai, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: StreampaiWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
