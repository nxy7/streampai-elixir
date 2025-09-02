import Config

config :beacon,
  cms: [
    site: :cms,
    repo: Streampai.Repo,
    endpoint: StreampaiWeb.CmsEndpoint,
    router: StreampaiWeb.Router
  ]

if config_env() == :dev do
  config :tidewave, :root, File.cwd!()
end

import Dotenvy

source!(["../.env", System.get_env()])
# config/runtime.exs is executed for all environments, including
# during releases. It is executed after compilation and before the
# system starts, so it is typically used to load production configuration
# and secrets from environment variables or elsewhere. Do not define
# any compile-time configuration in here, as it won't be applied.
# The block below contains prod specific runtime configuration.

# ## Using releases
#
# If you use `mix release`, you need to explicitly enable the server
# by passing the PHX_SERVER=true when you start it:
#
#     PHX_SERVER=true bin/streampai start
#
# Alternatively, you can use `mix phx.gen.release` to generate a `bin/server`
# script that automatically sets the env var above.
if System.get_env("PHX_SERVER") do
  config :streampai, StreampaiWeb.Endpoint, server: true
end

database_url =
  env!("DATABASE_URL") ||
    raise """
    environment variable DATABASE_URL is missing.
    For example: ecto://USER:PASS@HOST/DATABASE
    """

config :streampai,
  google_client_id: env!("GOOGLE_CLIENT_ID", :string),
  google_client_secret: env!("GOOGLE_CLIENT_SECRET", :string),
  google_redirect_uri: env!("GOOGLE_REDIRECT_URI", :string),
  token_signing_secret: env!("TOKEN_SIGNING_SECRET", :string)

config :streampai, :strategies,
  google: [
    client_id: env!("GOOGLE_CLIENT_ID"),
    client_secret: env!("GOOGLE_CLIENT_SECRET"),
    redirect_uri: env!("GOOGLE_REDIRECT_URI"),
    strategy: Assent.Strategy.Google
  ]

config :ueberauth, Ueberauth.Strategy.Google.OAuth,
  client_id: env!("GOOGLE_CLIENT_ID"),
  client_secret: env!("GOOGLE_CLIENT_SECRET")

config :ueberauth, Ueberauth.Strategy.Twitch.OAuth,
  client_id: env!("TWITCH_CLIENT_ID"),
  client_secret: env!("TWITCH_CLIENT_SECRET")

if config_env() == :prod do
  maybe_ipv6 = if env!("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :streampai, Streampai.Repo,
    username: "postgres",
    password: "postgres",
    hostname: "localhost",
    database: "postgres",
    port: 5432,
    # ssl: true,
    url: database_url,
    pool_size: String.to_integer(env!("POOL_SIZE") || "25"),
    queue_target: 5000,
    queue_interval: 1000,
    timeout: 15_000,
    ownership_timeout: 30_000,
    socket_options: maybe_ipv6

  # The secret key base is used to sign/encrypt cookies and other secrets.
  # A default value is used in config/dev.exs and config/test.exs but you
  # want to use a different value for prod and you most likely don't want
  # to check this value into version control, so we use an environment
  # variable instead.
  secret_key_base =
    env!("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = env!("PHX_HOST") || "example.com"
  port = String.to_integer(env!("PORT") || "4000")

  # config :streampai, :dns_cluster_query, env!("DNS_CLUSTER_QUERY")

  config :streampai, StreampaiWeb.Endpoint,
    url: [host: host, port: 8443, scheme: "https"],
    http: [ip: {0, 0, 0, 0, 0, 0, 0, 0}, port: port],
    secret_key_base: secret_key_base,
    check_origin: ["https://streampai.com", "http://streampai.com", "https://#{host}", "http://#{host}"]

  config :streampai, StreampaiWeb.ProxyEndpoint,
    check_origin: {StreampaiWeb.ProxyEndpoint, :check_origin, []},
    url: [port: 443, scheme: "https"],
    http: [ip: {0, 0, 0, 0, 0, 0, 0, 0}, port: "4001"],
    secret_key_base: secret_key_base,
    server: !!System.get_env("PHX_SERVER")

  config :streampai, StreampaiWeb.CmsEndpoint,
    url: [host: host, port: 8868, scheme: "https"],
    http: [ip: {0, 0, 0, 0, 0, 0, 0, 0}, port: 4464],
    secret_key_base: secret_key_base,
    server: !!System.get_env("PHX_SERVER")

  # twitch: [
  #   client_id: "REPLACE_WITH_CLIENT_ID",
  #   client_secret: "REPLACE_WITH_CLIENT_SECRET",
  #   strategy: Assent.Strategy.
  # ]

  # ## SSL Support
  #
  # To get SSL working, you will need to add the `https` key
  # to your endpoint configuration:
  #
  #     config :streampai, StreampaiWeb.Endpoint,
  #       https: [
  #         ...,
  #         port: 443,
  #         cipher_suite: :strong,
  #         keyfile: env!("SOME_APP_SSL_KEY_PATH"),
  #         certfile: env!("SOME_APP_SSL_CERT_PATH")
  #       ]
  #
  # The `cipher_suite` is set to `:strong` to support only the
  # latest and more secure SSL ciphers. This means old browsers
  # and clients may not be supported. You can set it to
  # `:compatible` for wider support.
  #
  # `:keyfile` and `:certfile` expect an absolute path to the key
  # and cert in disk or a relative path inside priv, for example
  # "priv/ssl/server.key". For all supported SSL configuration
  # options, see https://hexdocs.pm/plug/Plug.SSL.html#configure/1
  #
  # We also recommend setting `force_ssl` in your config/prod.exs,
  # ensuring no data is ever sent via http, always redirecting to https:
  #
  #     config :streampai, StreampaiWeb.Endpoint,
  #       force_ssl: [hsts: true]
  #
  # Check `Plug.SSL` for all available options in `force_ssl`.

  # ## Configuring the mailer
  #
  # In production you need to configure the mailer to use a different adapter.
  # Also, you may need to configure the Swoosh API client of your choice if you
  # are not using SMTP. Here is an example of the configuration:
  #
  #     config :streampai, Streampai.Mailer,
  #       adapter: Swoosh.Adapters.Mailgun,
  #       api_key: env!("MAILGUN_API_KEY"),
  #       domain: env!("MAILGUN_DOMAIN")
  #
  # For this example you need include a HTTP client required by Swoosh API client.
  # Swoosh supports Hackney and Finch out of the box:
  #
  #     config :swoosh, :api_client, Swoosh.ApiClient.Hackney
  #
  # See https://hexdocs.pm/swoosh/Swoosh.html#module-installation for details.
end
