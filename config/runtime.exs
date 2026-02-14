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

# Configure Electric with unique slot/publication names per database
# This is required for worktrees that use different databases
if env == :dev do
  # Extract database name from URL to create unique Electric identifiers
  db_name =
    database_url
    |> URI.parse()
    |> Map.get(:path, "/postgres")
    |> String.trim_leading("/")
    |> String.split("?")
    |> List.first()
    |> String.replace(~r/[^a-z0-9_]/, "_")

  # Use shorter suffix to avoid slot name length limits (63 chars max)
  # The slot will be named: electric_slot_<replication_stream_id>
  electric_stream_id = String.slice(db_name, 0, 30)

  config :phoenix_sync,
    replication_stream_id: electric_stream_id
end

# Configure SQL logging based on DEBUG_SQL environment variable
if System.get_env("DEBUG_SQL") == "true" do
  config :logger, level: :info

  config :streampai, Streampai.Repo,
    log: :info,
    stacktrace: true
end

google_redirect_uri =
  System.get_env("GOOGLE_REDIRECT_URI") ||
    if config_env() == :dev, do: "http://localhost:4000/auth/user/google/callback"

twitch_redirect_uri =
  System.get_env("TWITCH_AUTH_REDIRECT_URI") ||
    if config_env() == :dev, do: "http://localhost:4000/auth/user/twitch/callback"

# Discord bot configuration (Nostrum)
# Configure based on whether DISCORD_BOT_TOKEN is provided
discord_token = System.get_env("DISCORD_BOT_TOKEN")

config :nostrum,
  token: discord_token || "not_configured",
  gateway_intents: [:guilds, :guild_messages]

# Store whether Discord is enabled for application startup decisions
config :streampai, :discord_enabled, discord_token != nil

# Paddle Billing configuration
config :streampai, :paddle,
  api_key: System.get_env("PADDLE_API_KEY"),
  webhook_secret: System.get_env("PADDLE_WEBHOOK_SECRET"),
  environment: if(System.get_env("PADDLE_ENVIRONMENT") == "live", do: :live, else: :sandbox),
  price_pro_monthly: System.get_env("PADDLE_PRICE_PRO_MONTHLY"),
  price_pro_yearly: System.get_env("PADDLE_PRICE_PRO_YEARLY")

config :streampai, :strategies,
  google: [
    client_id: System.get_env("GOOGLE_CLIENT_ID"),
    client_secret: System.get_env("GOOGLE_CLIENT_SECRET"),
    redirect_uri: google_redirect_uri,
    strategy: Assent.Strategy.Google
  ]

config :streampai,
  google_client_id: System.get_env("GOOGLE_CLIENT_ID"),
  google_client_secret: System.get_env("GOOGLE_CLIENT_SECRET"),
  google_redirect_uri: google_redirect_uri,
  twitch_client_id: System.get_env("TWITCH_CLIENT_ID"),
  twitch_client_secret: System.get_env("TWITCH_CLIENT_SECRET"),
  twitch_redirect_uri: twitch_redirect_uri,
  token_signing_secret: System.get_env("SECRET_KEY"),
  cloudflare_api_token: System.get_env("CF_API_TOKEN"),
  cloudflare_account_id: System.get_env("CLOUDFLARE_ACCOUNT_ID"),
  openai_api_key: System.get_env("OPENAI_API_KEY"),
  elevenlabs_api_key: System.get_env("ELEVENLABS_API_KEY"),
  whisper_live_enabled: System.get_env("WHISPER_LIVE_ENABLED") == "true",
  whisper_live_url: System.get_env("WHISPER_LIVE_URL") || "ws://localhost:9090",
  whisper_live_model: System.get_env("WHISPER_LIVE_MODEL") || "large-v3-turbo",
  whisper_live_language: System.get_env("WHISPER_LIVE_LANGUAGE")

config :ueberauth, Ueberauth.Strategy.Google.OAuth,
  client_id: System.get_env("GOOGLE_CLIENT_ID"),
  client_secret: System.get_env("GOOGLE_CLIENT_SECRET")

config :ueberauth, Ueberauth.Strategy.Twitch.OAuth,
  # Set secret_key_base and port for development environment
  client_id: System.get_env("TWITCH_CLIENT_ID"),
  client_secret: System.get_env("TWITCH_CLIENT_SECRET"),
  redirect_uri: System.get_env("TWITCH_STREAMING_REDIRECT_URI")

if config_env() == :dev do
  secret_key_base =
    System.get_env("SECRET_KEY") ||
      "dev_secret_key_at_least_64_chars_long_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

  # Port configuration for worktree isolation
  port = String.to_integer(System.get_env("PORT") || "4000")

  # In dev, we access the app through Caddy (HTTPS) which proxies both frontend and backend
  # This is required for auth flows to work correctly (cookies, OAuth callbacks, etc.)
  caddy_port = System.get_env("CADDY_PORT") || "8000"
  frontend_url = System.get_env("FRONTEND_URL") || "https://localhost:#{caddy_port}"

  config :streampai, StreampaiWeb.Endpoint,
    secret_key_base: secret_key_base,
    http: [ip: {127, 0, 0, 1}, port: port]

  config :streampai,
    frontend_url: frontend_url
end

# S3-compatible storage configuration (works with MinIO, R2, AWS S3, etc.)
# Defaults for development/test environments
s3_scheme =
  System.get_env("S3_SCHEME") ||
    case env do
      :prod -> "https://"
      _ -> "http://"
    end

s3_host =
  System.get_env("S3_HOST") ||
    case env do
      :prod -> raise "S3_HOST environment variable is missing"
      _ -> "localhost"
    end

s3_port =
  if port_str = System.get_env("S3_PORT") do
    String.to_integer(port_str)
  else
    case env do
      :prod -> nil
      _ -> 9000
    end
  end

s3_region = System.get_env("S3_REGION") || "us-east-1"

s3_access_key_id =
  System.get_env("S3_ACCESS_KEY_ID") ||
    case env do
      :prod -> raise "S3_ACCESS_KEY_ID environment variable is missing"
      _ -> "minioadmin"
    end

s3_secret_access_key =
  System.get_env("S3_SECRET_ACCESS_KEY") ||
    case env do
      :prod -> raise "S3_SECRET_ACCESS_KEY environment variable is missing"
      _ -> "minioadmin"
    end

s3_bucket =
  System.get_env("S3_BUCKET") ||
    case env do
      :prod -> raise "S3_BUCKET environment variable is missing"
      :test -> "streampai-test"
      _ -> "streampai-dev"
    end

config :ex_aws, :s3,
  scheme: s3_scheme,
  host: s3_host,
  port: s3_port,
  region: s3_region

config :ex_aws,
  access_key_id: s3_access_key_id,
  secret_access_key: s3_secret_access_key

config :streampai, :storage,
  bucket: s3_bucket,
  public_url: System.get_env("S3_PUBLIC_URL")

if config_env() == :prod do
  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  secret_key_base =
    System.get_env("SECRET_KEY") ||
      raise "SECRET_KEY environment variable is missing"

  host = System.get_env("PHX_HOST") || "streampai.com"
  port = String.to_integer(System.get_env("PORT") || "4000")

  # Application domain configuration
  # All URLs are derived from APP_DOMAIN (defaults to streampai.com)
  # Frontend: https://streampai.com
  # Backend:  https://api.streampai.com
  app_domain = System.get_env("APP_DOMAIN", "streampai.com")

  # Add production-specific database settings
  config :streampai, Streampai.Repo, socket_options: maybe_ipv6

  config :streampai, StreampaiWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [ip: {0, 0, 0, 0, 0, 0, 0, 0}, port: port],
    secret_key_base: secret_key_base,
    check_origin: [
      "https://streampai.com",
      "https://api.streampai.com",
      "http://streampai.com",
      "http://localhost:4000",
      "https://#{host}",
      "http://#{host}"
    ]

  # Application URLs derived from APP_DOMAIN
  # Backend URL is used for email links (confirmation emails, password reset, etc.)
  config :streampai,
    app_domain: app_domain,
    frontend_url: "https://#{app_domain}",
    backend_url: "https://api.#{app_domain}"

  # Production session options for cross-subdomain cookies
  # Frontend is at streampai.com, API is at api.streampai.com
  # SameSite=None + Secure allows cross-origin requests with credentials
  # domain=.streampai.com shares cookies across subdomains
  config :streampai,
    session_options: [
      store: :cookie,
      key: "_streampai_key",
      signing_salt: "streampai_session_salt",
      same_site: "None",
      secure: true,
      domain: ".streampai.com"
    ]

  # Production email configuration (optional)
  # Currently OAuth users skip confirmation emails (already verified by provider)
  # For password-based auth, set RESEND_API_KEY to enable email delivery:
  if resend_api_key = System.get_env("RESEND_API_KEY") do
    config :streampai, Streampai.Mailer,
      adapter: Swoosh.Adapters.Resend,
      api_key: resend_api_key
  end
end
