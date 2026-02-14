import Config

alias Ueberauth.Strategy.OAuth2

# Phoenix.Sync configuration (embedded Electric)
# Use a unique stack_id and replication_stream_id per worktree to avoid conflicts
electric_worktree_id =
  File.cwd!()
  |> Path.basename()
  |> String.replace("-", "_")

config :ash,
  include_embedded_source_by_default?: false,
  default_page_type: :keyset,
  policies: [no_filter_static_forbidden_reads?: false],
  custom_types: [
    ticket_status: Streampai.Support.Ticket.Types.Status,
    ticket_type: Streampai.Support.Ticket.Types.TicketType,
    event_type: Streampai.Stream.StreamEvent.Type
  ],
  allow_forbidden_field_for_relationships_by_default?: true,
  show_keysets_for_all_actions?: false,
  keep_read_action_loads_when_loading?: false,
  default_actions_require_atomic?: true,
  read_action_after_action_hooks_in_order?: true,
  bulk_actions_default_to_errors?: true,
  known_types: []

config :ash_oban, pro?: false

config :ash_typescript,
  output_file: "frontend/src/sdk/ash_rpc.ts",
  # Use relative URLs so the SDK works with any proxy/port configuration
  run_endpoint: "/api/rpc/run",
  validate_endpoint: "/api/rpc/validate",
  input_field_formatter: :camel_case,
  output_field_formatter: :camel_case,
  generate_phx_channel_rpc_actions: true,
  phoenix_import_path: "phoenix",
  # CSRF protection: automatically add token and credentials to all RPC requests
  rpc_action_before_request_hook: "RpcHooks.beforeRequest",
  rpc_validation_before_request_hook: "RpcHooks.beforeRequest",
  import_into_generated: [
    %{
      import_name: "RpcHooks",
      file: "../lib/rpcHooks"
    }
  ]

config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [
    # Request tracking
    :request_id,
    :error_id,
    :user_id,
    :path,
    :duration,
    :method,
    :remote_ip,
    # Stream management
    :livestream_id,
    :stream_id,
    :component,
    :chat_id,
    :input_status,
    :alert_id,
    :stream_event_id,
    :display_time,
    # API response handling
    :status,
    :body,
    :reason,
    :error,
    :error_type,
    :stacktrace,
    # TTS processing
    :voice,
    :voice_name,
    :audio_size,
    :message_length,
    :hash,
    :has_tts,
    # Webhook/notification handling
    :webhook_id,
    :event_type,
    :event_id,
    :retry_after,
    :attempt,
    # Donation processing
    :donor_name,
    :amount,
    # Email/job processing
    :type,
    :opts,
    # File operations
    :size
  ]

config :phoenix, :json_library, Jason

config :phoenix_sync,
  env: Mix.env(),
  mode: :embedded,
  repo: Streampai.Repo,
  stack_id: "electric_#{electric_worktree_id}",
  replication_stream_id: electric_worktree_id

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
  queues: [default: 10, donations: 5, media: 3, maintenance: 1, storage_cleanup: 2, emails: 5],
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
    Streampai.Notifications,
    Streampai.Storage,
    Streampai.Support
  ],
  generators: [timestamp_type: :utc_datetime],
  env: Mix.env(),
  # Session options are environment-specific (see runtime.exs for prod)
  # Dev uses Lax for same-origin, prod uses None for cross-subdomain
  session_options: [
    store: :cookie,
    key: "_streampai_key",
    signing_salt: "streampai_session_salt",
    same_site: "Lax"
  ],
  default_broadcast_strategy: :membrane,
  membrane_rtmp_port: 1935,
  membrane_rtmp_host: "localhost"

# Configure Tesla to disable deprecated builder warnings
config :tesla, disable_deprecated_builder_warning: true

config :ueberauth, Ueberauth,
  base_path: "/api/streaming/connect",
  providers: [
    google:
      {Ueberauth.Strategy.Google,
       [
         access_type: "offline",
         prompt: "consent select_account",
         approval_prompt: "force",
         include_granted_scopes: true,
         # Always use port 8000 for OAuth callbacks (main Caddy instance)
         # This allows worktrees on different ports to share the same Google OAuth config
         callback_port: 8000,
         callback_scheme: "https",
         default_scope:
           "openid profile email https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.channel-memberships.creator https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly"
       ]},
    twitch:
      {Ueberauth.Strategy.Twitch,
       [
         # Always use port 8000 for OAuth callbacks (main Caddy instance)
         callback_port: 8000,
         callback_scheme: "https",
         default_scope:
           "user:read:email user:read:chat user:write:chat channel:bot channel:read:subscriptions channel:read:stream_key channel:manage:broadcast moderator:read:followers"
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
