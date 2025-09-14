import Config

# Set required environment variables for tests - worktree-friendly
worktree_name = File.cwd!() |> Path.basename() |> String.replace("-", "_") |> String.downcase()

test_db_name = "streampai_#{worktree_name}_test#{System.get_env("MIX_TEST_PARTITION")}"

System.put_env(
  "DATABASE_URL",
  "postgresql://postgres:postgres@localhost:5432/#{test_db_name}"
)

System.put_env("SECRET_KEY", "YeyXMtNCHvBxHG6uILUYTZR9Lm/wud/LpXrk9wSS8q9bCxUnY/dlt9ArOMnBFIoS")

config :ash, disable_async?: true, policies: [show_policy_breakdowns?: true]

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Enable helpful, but potentially expensive runtime checks
config :phoenix_live_view,
  enable_expensive_runtime_checks: true

config :streampai, Oban, testing: :manual

# In test we don't send emails
config :streampai, Streampai.Mailer, adapter: Swoosh.Adapters.Test

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
# Test-specific database configuration (URL is handled in runtime.exs)
config :streampai, Streampai.Repo, pool: Ecto.Adapters.SQL.Sandbox

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :streampai, StreampaiWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: System.get_env("SECRET_KEY"),
  server: false

config :streampai,
  env: :test

config :streampai, token_signing_secret: System.get_env("SECRET_KEY")

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false

# WireMock configuration for testing external APIs
wiremock_enabled = System.get_env("WIREMOCK_ENABLED", "false") == "true"
wiremock_host = System.get_env("WIREMOCK_HOST", "localhost")
wiremock_port = System.get_env("WIREMOCK_PORT", "8080")

if wiremock_enabled do
  # Override API base URLs to point to WireMock
  config :streampai,
    cloudflare_base_url: "http://#{wiremock_host}:#{wiremock_port}",
    youtube_base_url: "http://#{wiremock_host}:#{wiremock_port}",
    wiremock_enabled: true,
    wiremock_host: wiremock_host,
    wiremock_port: wiremock_port,
    # Use test values for WireMock
    cloudflare_api_token: "test_token",
    cloudflare_account_id: "test_account"
else
  # Use real APIs for integration tests
  config :streampai,
    wiremock_enabled: false
end
