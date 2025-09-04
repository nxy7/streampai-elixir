import Config

# Set required environment variables for tests
System.put_env(
  "DATABASE_URL",
  "postgresql://postgres:postgres@localhost:5432/streampai_test#{System.get_env("MIX_TEST_PARTITION")}"
)

System.put_env("CLOUDFLARE_API_TOKEN", "test_token")
System.put_env("CLOUDFLARE_ACCOUNT_ID", "test_account")
System.put_env("TOKEN_SIGNING_SECRET", "h4cu7OR38wead3kXqon6ReLmG2o4SH0u")

config :streampai, Oban, testing: :manual
config :streampai, token_signing_secret: "h4cu7OR38wead3kXqon6ReLmG2o4SH0u"
config :ash, disable_async?: true, policies: [show_policy_breakdowns?: true]

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :streampai, Streampai.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "streampai_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :streampai, StreampaiWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "YeyXMtNCHvBxHG6uILUYTZR9Lm/wud/LpXrk9wSS8q9bCxUnY/dlt9ArOMnBFIoS",
  server: false

# In test we don't send emails
config :streampai, Streampai.Mailer, adapter: Swoosh.Adapters.Test

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Enable helpful, but potentially expensive runtime checks
config :phoenix_live_view,
  enable_expensive_runtime_checks: true
