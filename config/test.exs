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

# ExAws S3 configuration for MinIO in tests
config :ex_aws, :s3,
  scheme: "http://",
  host: System.get_env("MINIO_HOST") || "localhost",
  port: String.to_integer(System.get_env("MINIO_PORT") || "9000"),
  region: "us-east-1"

config :ex_aws,
  access_key_id: System.get_env("MINIO_ACCESS_KEY") || "minioadmin",
  secret_access_key: System.get_env("MINIO_SECRET_KEY") || "minioadmin"

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

config :streampai, :storage,
  bucket: "streampai-test",
  public_url: nil

config :streampai,
  env: :test,
  test_mode: true,
  # Use Mox mock for Cloudflare API in tests
  cloudflare_client: Streampai.Cloudflare.APIClientMock,
  # Shorter timeouts for testing
  stream_disconnect_timeout: 100,
  circuit_breaker_reset_timeout: 100,
  circuit_breaker_failure_threshold: 3,
  retry_max_retries: 2,
  retry_base_delay_ms: 10,
  retry_max_delay_ms: 100

config :streampai, token_signing_secret: System.get_env("SECRET_KEY")

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false
