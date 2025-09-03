import Config

if config_env() == :dev do
  config :tidewave, :root, File.cwd!()
end

if System.get_env("PHX_SERVER") do
  config :streampai, StreampaiWeb.Endpoint, server: true
end

database_url =
  System.get_env("DATABASE_URL") ||
    raise "DATABASE_URL environment variable is missing"

config :streampai,
  google_client_id: System.get_env("GOOGLE_CLIENT_ID"),
  google_client_secret: System.get_env("GOOGLE_CLIENT_SECRET"),
  google_redirect_uri: System.get_env("GOOGLE_REDIRECT_URI"),
  token_signing_secret: System.get_env("TOKEN_SIGNING_SECRET")

config :streampai, :strategies,
  google: [
    client_id: System.get_env("GOOGLE_CLIENT_ID"),
    client_secret: System.get_env("GOOGLE_CLIENT_SECRET"),
    redirect_uri: System.get_env("GOOGLE_REDIRECT_URI"),
    strategy: Assent.Strategy.Google
  ]

config :ueberauth, Ueberauth.Strategy.Google.OAuth,
  client_id: System.get_env("GOOGLE_CLIENT_ID"),
  client_secret: System.get_env("GOOGLE_CLIENT_SECRET")

config :ueberauth, Ueberauth.Strategy.Twitch.OAuth,
  client_id: System.get_env("TWITCH_CLIENT_ID"),
  client_secret: System.get_env("TWITCH_CLIENT_SECRET")

if config_env() == :prod do
  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :streampai, Streampai.Repo,
    username: "postgres",
    password: "postgres",
    hostname: "localhost",
    database: "postgres",
    port: 5432,
    # ssl: true,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "25"),
    queue_target: 5000,
    queue_interval: 1000,
    timeout: 15_000,
    ownership_timeout: 30_000,
    socket_options: maybe_ipv6

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise "SECRET_KEY_BASE environment variable is missing"

  host = System.get_env("PHX_HOST") || "streampai.com"
  port = String.to_integer(System.get_env("PORT") || "4000")

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
