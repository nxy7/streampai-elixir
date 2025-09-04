import Config

signing_salt = "WVzcyVtA"

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
  ash_domains: [Streampai.Stream, Streampai.Accounts, Streampai.Cloudflare],
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

config :streampai, StreampaiWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: Beacon.Web.ErrorHTML, json: StreampaiWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Streampai.PubSub,
  live_view: [signing_salt: signing_salt]

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

config :logger, :console,
  level: :info,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :error_id, :user_id, :path, :duration]

config :phoenix, :json_library, Jason

# Configure Tailwind version
config :tailwind, :version, "4.0.9"

# Configure esbuild version (even though we're using Vite)
config :esbuild, :version, "0.25.0"

import_config "#{config_env()}.exs"
