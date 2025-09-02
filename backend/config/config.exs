# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

signing_salt = "WVzcyVtA"

config :streampai,
       StreampaiWeb.CmsEndpoint,
       url: [host: "localhost"],
       adapter: Bandit.PhoenixAdapter,
       render_errors: [
         formats: [html: Beacon.Web.ErrorHTML],
         layout: false
       ],
       pubsub_server: Streampai.PubSub,
       live_view: [signing_salt: signing_salt]

config :streampai,
       StreampaiWeb.ProxyEndpoint,
       adapter: Bandit.PhoenixAdapter,
       pubsub_server: Streampai.PubSub,
       render_errors: [
         formats: [html: Beacon.Web.ErrorHTML],
         layout: false
       ],
       live_view: [signing_salt: signing_salt]

config :ex_cldr, default_backend: Streampai.Cldr
config :ash_oban, pro?: false

config :streampai, Oban,
  engine: Oban.Engines.Basic,
  notifier: Oban.Notifiers.Postgres,
  queues: [default: 10],
  repo: Streampai.Repo,
  plugins: [{Oban.Plugins.Cron, []}]

config :ash,
  include_embedded_source_by_default?: false,
  default_page_type: :keyset,
  policies: [no_filter_static_forbidden_reads?: false],
  custom_types: [
    ticket_status: Streampai.Support.Ticket.Types.Status,
    event_type: Streampai.Stream.StreamEvent.Type,
    money: AshMoney.Types.Money
  ],
  allow_forbidden_field_for_relationships_by_default?: true,
  show_keysets_for_all_actions?: false,
  keep_read_action_loads_when_loading?: false,
  default_actions_require_atomic?: true,
  read_action_after_action_hooks_in_order?: true,
  bulk_actions_default_to_errors?: true,
  known_types: [AshMoney.Types.Money]

config :spark,
  formatter: [
    remove_parens?: true,
    "Ash.Resource": [
      section_order: [
        :admin,
        :authentication,
        :tokens,
        :postgres,
        :resource,
        :code_interface,
        :actions,
        :policies,
        :pub_sub,
        :preparations,
        :changes,
        :validations,
        :multitenancy,
        :attributes,
        :relationships,
        :calculations,
        :aggregates,
        :identities
      ]
    ],
    "Ash.Domain": [
      section_order: [:admin, :resources, :policies, :authorization, :domain, :execution]
    ]
  ]

config :streampai,
  ecto_repos: [Streampai.Repo],
  ash_domains: [Streampai.Stream, Streampai.Accounts],
  generators: [timestamp_type: :utc_datetime],
  env: Mix.env(),
  session_options: [
    store: :cookie,
    key: "_streampai_key",
    signing_salt: "streampai_session_salt",
    same_site: "Lax"
  ]

config :streampai, Streampai.Repo,
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 25,
  queue_target: 5000,
  queue_interval: 1000,
  timeout: 15_000,
  ownership_timeout: 30_000

# Configures the endpoint
config :streampai, StreampaiWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: Beacon.Web.ErrorHTML, json: StreampaiWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Streampai.PubSub,
  live_view: [signing_salt: signing_salt]

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :streampai, Streampai.Mailer, adapter: Swoosh.Adapters.Local

config :ueberauth, Ueberauth,
  base_path: "/streaming/connect",
  providers: [
    google:
      {Ueberauth.Strategy.Google,
       [
         access_type: "offline",
         prompt: "consent select_account",
         approval_prompt: "force",
         include_granted_scopes: true,
         default_scope:
           "openid profile email https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.channel-memberships.creator"
       ]},
    twitch:
      {Ueberauth.Strategy.Twitch,
       [
         default_scope: "user:read:email channel:read:subscriptions"
       ]}
  ]

# Configures Elixir's Logger
config :logger, :console,
  level: :info,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
