defmodule Streampai.Stream.ChatBotConfig do
  @moduledoc """
  Configuration for the per-user chat bot that runs during live streams.

  Each user has at most one config row (upserted on first save).
  The `ChatBotServer` GenServer subscribes to changes via `Phoenix.Sync.Shape`
  and adjusts its behaviour in real time.

  ## Settings

  - `enabled` — master toggle; when false the bot does nothing
  - `greeting_enabled` / `greeting_message` — post a welcome message when the stream starts
  - `command_prefix` — character(s) that prefix bot commands (default `/`)
  - `ai_chat_enabled` — let the bot participate in chat conversations using AI (experimental)
  - `auto_shoutout_enabled` — automatically shout out raiders
  - `link_protection_enabled` — delete messages containing links from non-moderators
  - `slow_mode_on_raid_enabled` — temporarily enable slow mode when a raid is detected
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource]

  alias Streampai.Accounts.User
  alias Streampai.Types.CoercibleBoolean

  postgres do
    table "chat_bot_configs"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id], unique: true, name: "idx_chat_bot_configs_user_id"
    end
  end

  typescript do
    type_name("ChatBotConfig")
  end

  code_interface do
    define :read
    define :upsert
    define :update
    define :get_for_user, args: [:user_id]
  end

  actions do
    defaults [:read]

    create :upsert do
      description "Create or update chat bot config for the current user"

      upsert? true
      upsert_identity :unique_user

      upsert_fields [
        :enabled,
        :greeting_enabled,
        :greeting_message,
        :command_prefix,
        :ai_chat_enabled,
        :ai_personality,
        :ai_bot_name,
        :ai_provider,
        :auto_shoutout_enabled,
        :link_protection_enabled,
        :slow_mode_on_raid_enabled
      ]

      accept [
        :enabled,
        :greeting_enabled,
        :greeting_message,
        :command_prefix,
        :ai_chat_enabled,
        :ai_personality,
        :ai_bot_name,
        :ai_provider,
        :auto_shoutout_enabled,
        :link_protection_enabled,
        :slow_mode_on_raid_enabled
      ]

      change set_attribute(:user_id, actor(:id))
    end

    update :update do
      primary? true
      require_atomic? false

      accept [
        :enabled,
        :greeting_enabled,
        :greeting_message,
        :command_prefix,
        :ai_chat_enabled,
        :ai_personality,
        :ai_bot_name,
        :ai_provider,
        :auto_shoutout_enabled,
        :link_protection_enabled,
        :slow_mode_on_raid_enabled
      ]
    end

    read :get_for_user do
      description "Get chat bot config for a user"

      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
      prepare build(limit: 1)
    end
  end

  policies do
    bypass actor_attribute_equals(:is_admin, true) do
      authorize_if always()
      description "Admins can do anything"
    end

    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type(:create) do
      authorize_if actor_present()
    end

    policy action_type(:update) do
      authorize_if expr(user_id == ^actor(:id))
    end
  end

  attributes do
    uuid_primary_key :id, public?: true

    attribute :enabled, CoercibleBoolean do
      allow_nil? false
      public? true
      default true
      description "Master toggle — when false the bot does nothing"
    end

    attribute :greeting_enabled, CoercibleBoolean do
      allow_nil? false
      public? true
      default false
      description "Post a welcome message when the stream starts"
    end

    attribute :greeting_message, :string do
      allow_nil? false
      public? true
      default "Hello everyone! Welcome to the stream!"
      constraints max_length: 500
      description "The message to post when the stream starts"
    end

    attribute :command_prefix, :string do
      allow_nil? false
      public? true
      default "!"
      constraints max_length: 5
      description "Character(s) that prefix bot commands"
    end

    attribute :ai_chat_enabled, CoercibleBoolean do
      allow_nil? false
      public? true
      default false
      description "Let the bot participate in chat conversations using AI (experimental)"
    end

    attribute :ai_personality, :string do
      allow_nil? true
      public? true
      constraints max_length: 1000
      description "Custom personality prompt for AI chat participation"
    end

    attribute :ai_bot_name, :string do
      allow_nil? false
      public? true
      default "Streampai"
      constraints max_length: 50
      description "Name the bot responds to (used for mention detection)"
    end

    attribute :ai_provider, :string do
      allow_nil? false
      public? true
      default "openai"
      constraints max_length: 50
      description "Which LLM provider to use for AI chat"
    end

    attribute :auto_shoutout_enabled, CoercibleBoolean do
      allow_nil? false
      public? true
      default false
      description "Automatically shout out raiders"
    end

    attribute :link_protection_enabled, CoercibleBoolean do
      allow_nil? false
      public? true
      default false
      description "Delete messages with links from non-moderators"
    end

    attribute :slow_mode_on_raid_enabled, CoercibleBoolean do
      allow_nil? false
      public? true
      default false
      description "Temporarily enable slow mode when a raid is detected"
    end

    timestamps(public?: true)
  end

  relationships do
    belongs_to :user, User do
      allow_nil? false
      attribute_writable? true
      description "The user who owns this config"
    end
  end

  identities do
    identity :unique_user, [:user_id]
  end
end
