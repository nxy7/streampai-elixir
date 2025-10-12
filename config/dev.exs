import Config

config :ash, policies: [show_policy_breakdowns?: true]

config :live_vue, vite_host: "http://localhost:5173", ssr: false

# Logging and debugging
config :logger, :console,
  format: {Streampai.LoggerFormatter, :format},
  # Use :all to include all metadata - the formatter will filter what to display
  metadata: :all

# LiveDebugger configuration - disable if DISABLE_LIVE_DEBUGGER=true to avoid port conflicts
# Note: LiveDebugger can cause ETS errors when tracing LiveView sockets with large assigns
# If you see frequent gen_server errors, consider disabling it: DISABLE_LIVE_DEBUGGER=true mix phx.server
if System.get_env("DISABLE_LIVE_DEBUGGER") == "true" do
  config :live_debugger, :disabled?, true
else
  config :live_debugger, LiveDebugger.App.Web.Endpoint,
    http: [port: "LIVE_DEBUGGER_PORT" |> System.get_env("4008") |> String.to_integer()]
end

config :phoenix, :plug_init_mode, :runtime
config :phoenix, :stacktrace_depth, 20

# LiveView development settings
config :phoenix_live_view,
  debug_heex_annotations: true,
  enable_expensive_runtime_checks: true

# Database configuration is now handled entirely in runtime.exs

# For development, we disable any cache and enable
# debugging and code reloading.
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we can use it
# to bundle .js and .css sources.
# Main endpoint configuration
config :streampai, StreampaiWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: String.to_integer(System.get_env("PORT") || "4000")],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  watchers: [
    npm: ["--silent", "run", "dev", cd: Path.expand("../assets", __DIR__)]
  ]

# Live reload configuration
config :streampai, StreampaiWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/(?!uploads/).*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"lib/streampai_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

# PayPal Configuration (Sandbox for development)
# See config/paypal.example.exs for setup instructions
config :streampai, :paypal,
  mode: :sandbox,
  client_id: System.get_env("PAYPAL_SANDBOX_CLIENT_ID") || "your_sandbox_client_id",
  secret: System.get_env("PAYPAL_SANDBOX_SECRET") || "your_sandbox_secret",
  webhook_id: System.get_env("PAYPAL_SANDBOX_WEBHOOK_ID") || "your_sandbox_webhook_id"

# Development specific settings
config :streampai,
  dev_routes: true,
  token_signing_secret: System.get_env("SECRET_KEY")

# External services (disabled in dev)
config :swoosh, :api_client, false
