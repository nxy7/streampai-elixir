import Config

secret_key_base = System.get_env("SECRET_KEY")

config :ash, policies: [show_policy_breakdowns?: true]

config :live_vue, vite_host: "http://localhost:5173", ssr: false

# Logging and debugging
config :logger, :console, format: "[$level] $message\n"

config :phoenix, :plug_init_mode, :runtime
config :phoenix, :stacktrace_depth, 20

# LiveView development settings
config :phoenix_live_view,
  debug_heex_annotations: true,
  enable_expensive_runtime_checks: true

# Database configuration
config :streampai, Streampai.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "postgres",
  pool_size: 30,
  show_sensitive_data_on_connection_error: true

# For development, we disable any cache and enable
# debugging and code reloading.
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we can use it
# to bundle .js and .css sources.
# Main endpoint configuration
config :streampai, StreampaiWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: secret_key_base,
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

# Development specific settings
config :streampai,
  dev_routes: true,
  token_signing_secret: System.get_env("SECRET_KEY")

# External services (disabled in dev)
config :swoosh, :api_client, false
