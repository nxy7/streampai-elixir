import Config

alias AshMoney.Types.Money
alias Ueberauth.Strategy.OAuth2

config :ash,
  include_embedded_source_by_default?: false,
  default_page_type: :keyset,
  policies: [no_filter_static_forbidden_reads?: false],
  custom_types: [
    ticket_status: Streampai.Support.Ticket.Types.Status,
    event_type: Streampai.Stream.StreamEvent.Type,
    money: Money
  ],
  allow_forbidden_field_for_relationships_by_default?: true,
  show_keysets_for_all_actions?: false,
  keep_read_action_loads_when_loading?: false,
  default_actions_require_atomic?: true,
  read_action_after_action_hooks_in_order?: true,
  bulk_actions_default_to_errors?: true,
  known_types: [Money]

config :ash_oban, pro?: false

config :ash_typescript,
  output_file: "frontend/src/sdk/ash_rpc.ts",
  run_endpoint: "http://localhost:4000/rpc/run",
  validate_endpoint: "http://localhost:4000/rpc/validate",
  input_field_formatter: :camel_case,
  output_field_formatter: :camel_case

config :ex_cldr, default_backend: Streampai.Cldr

config :logger, :console,
  level: :info,
  format: "$time $metadata[$level] $message\n",
  metadata: [
    :request_id,
    :error_id,
    :user_id,
    :path,
    :duration,
    :livestream_id,
    :component,
    :chat_id,
    :input_status,
    :stream_id
  ]

config :phoenix, :json_library, Jason

# Phoenix.Sync configuration (embedded Electric)
config :phoenix_sync,
  env: Mix.env(),
  mode: :embedded,
  repo: Streampai.Repo

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

config :streampai, Oban,
  engine: Oban.Engines.Basic,
  notifier: Oban.Notifiers.Postgres,
  queues: [default: 10, donations: 5, media: 3, maintenance: 1, storage_cleanup: 2],
  repo: Streampai.Repo,
  plugins: [
    {Oban.Plugins.Cron,
     crontab: [
       {"0 3 * * *", Streampai.Storage.CleanupOrphanedFiles}
     ]},
    {Oban.Plugins.Pruner, max_age: 300},
    {Oban.Plugins.Lifeline, rescue_after: to_timeout(minute: 30)}
  ]

config :streampai, Streampai.Mailer, adapter: Swoosh.Adapters.Local

config :streampai, Streampai.Repo,
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  queue_target: 5000,
  queue_interval: 1000,
  timeout: 15_000,
  ownership_timeout: 30_000

config :streampai, StreampaiWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [
      # html: Beacon.Web.ErrorHTML,
      json: StreampaiWeb.ErrorJSON
    ],
    layout: false
  ],
  pubsub_server: Streampai.PubSub

config :streampai,
  ecto_repos: [Streampai.Repo],
  ash_domains: [
    Streampai.Stream,
    Streampai.Accounts,
    Streampai.Cloudflare,
    Streampai.System,
    Streampai.Integrations,
    Streampai.Notifications
  ],
  generators: [timestamp_type: :utc_datetime],
  env: Mix.env(),
  session_options: [
    store: :cookie,
    key: "_streampai_key",
    signing_salt: "streampai_session_salt",
    same_site: "Lax"
  ]

# Configure Tesla to disable deprecated builder warnings
config :tesla, disable_deprecated_builder_warning: true

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
         default_scope:
           "user:read:email user:read:chat user:write:chat channel:bot channel:read:subscriptions channel:read:stream_key channel:manage:broadcast"
       ]},
    facebook:
      {Ueberauth.Strategy.Facebook,
       [
         default_scope: "public_profile,email,pages_show_list,pages_read_engagement"
       ]},
    kick:
      {OAuth2,
       [
         default_scope: "user:read chat:read chat:write"
       ]},
    tiktok:
      {OAuth2,
       [
         default_scope: "user.info.basic video.list video.upload"
       ]},
    trovo:
      {OAuth2,
       [
         default_scope: "user_info_read channel_read chat:read chat:write"
       ]},
    instagram:
      {Ueberauth.Strategy.Instagram,
       [
         default_scope: "instagram_basic,instagram_manage_comments,instagram_manage_insights"
       ]},
    rumble:
      {OAuth2,
       [
         default_scope: "stream chat"
       ]}
  ]

import_config "#{config_env()}.exs"
