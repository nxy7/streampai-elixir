import Config

env = config_env()

# Load .env file for non-production environments
if env != :prod do
  env_path = Path.expand("../.env", __DIR__)

  if File.exists?(env_path) do
    env_vars = Dotenvy.source!([env_path])

    # Explicitly set environment variables
    Enum.each(env_vars, fn {key, value} ->
      System.put_env(key, value)
    end)
  end

  if env == :dev do
    config :tidewave, :root, File.cwd!()
  end
end

if System.get_env("PHX_SERVER") do
  config :streampai, StreampaiWeb.Endpoint, server: true
end

# Database configuration for all environments
database_url =
  case env do
    :prod ->
      System.get_env("DATABASE_URL") ||
        raise "DATABASE_URL environment variable is missing"

    :test ->
      # Build test database name similar to test.exs logic
      worktree_name = File.cwd!() |> Path.basename() |> String.replace("-", "_")
      test_db_name = "streampai_#{worktree_name}_test#{System.get_env("MIX_TEST_PARTITION")}"

      System.get_env("DATABASE_URL") ||
        "postgresql://postgres:postgres@localhost:5432/#{test_db_name}"

    :dev ->
      System.get_env("DATABASE_URL") ||
        "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable"
  end

# Configure the repository for all environments
pool_size =
  case env do
    :test -> System.schedulers_online() * 2
    :dev -> 30
    :prod -> String.to_integer(System.get_env("POOL_SIZE") || "25")
  end

config :streampai, Streampai.Repo,
  url: database_url,
  pool_size: pool_size,
  show_sensitive_data_on_connection_error: env != :prod,
  queue_target: 5000,
  queue_interval: 1000,
  timeout: 15_000,
  ownership_timeout: 30_000

# Configure SQL logging based on DEBUG_SQL environment variable
if System.get_env("DEBUG_SQL") == "true" do
  config :logger, level: :info

  config :streampai, Streampai.Repo,
    log: :info,
    stacktrace: true
end

config :streampai, :strategies,
  google: [
    client_id: System.get_env("GOOGLE_CLIENT_ID"),
    client_secret: System.get_env("GOOGLE_CLIENT_SECRET"),
    redirect_uri: System.get_env("GOOGLE_REDIRECT_URI"),
    strategy: Assent.Strategy.Google
  ]

config :streampai,
  google_client_id: System.get_env("GOOGLE_CLIENT_ID"),
  google_client_secret: System.get_env("GOOGLE_CLIENT_SECRET"),
  google_redirect_uri: System.get_env("GOOGLE_REDIRECT_URI"),
  twitch_client_id: System.get_env("TWITCH_CLIENT_ID"),
  twitch_client_secret: System.get_env("TWITCH_CLIENT_SECRET"),
  twitch_redirect_uri: System.get_env("TWITCH_REDIRECT_URI"),
  token_signing_secret: System.get_env("SECRET_KEY"),
  cloudflare_api_token: System.get_env("CLOUDFLARE_API_KEY"),
  cloudflare_account_id: System.get_env("CLOUDFLARE_ACCOUNT_ID")

config :stripity_stripe, api_key: System.get_env("STRIPE_SECRET")

config :ueberauth, Ueberauth.Strategy.Google.OAuth,
  client_id: System.get_env("GOOGLE_CLIENT_ID"),
  client_secret: System.get_env("GOOGLE_CLIENT_SECRET")

config :ueberauth, Ueberauth.Strategy.Twitch.OAuth,
  client_id: System.get_env("TWITCH_CLIENT_ID"),
  client_secret: System.get_env("TWITCH_CLIENT_SECRET")

# Set secret_key_base for development environment
if config_env() == :dev do
  secret_key_base =
    System.get_env("SECRET_KEY") ||
      "dev_secret_key_at_least_64_chars_long_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

  config :streampai, StreampaiWeb.Endpoint, secret_key_base: secret_key_base
end

if config_env() == :prod do
  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  secret_key_base =
    System.get_env("SECRET_KEY") ||
      raise "SECRET_KEY environment variable is missing"

  host = System.get_env("PHX_HOST") || "streampai.com"
  port = String.to_integer(System.get_env("PORT") || "4000")

  # Add production-specific database settings
  config :streampai, Streampai.Repo, socket_options: maybe_ipv6

  config :streampai, StreampaiWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [ip: {0, 0, 0, 0, 0, 0, 0, 0}, port: port],
    secret_key_base: secret_key_base,
    check_origin: [
      "https://streampai.com",
      "http://streampai.com",
      "http://localhost:4000",
      "https://#{host}",
      "http://#{host}"
    ]
end
