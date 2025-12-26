defmodule Streampai.Integrations.DiscordActor do
  @moduledoc """
  Represents a Discord bot actor for a user.

  Each user can have their own Discord bot that:
  - Joins their Discord servers
  - Lists available channels
  - Sends notifications to selected channels

  The actor_state stores synced data like available guilds and channels,
  which can be synced to the frontend for user selection.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Integrations,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource]

  alias Streampai.Integrations.Discord.BotManager

  postgres do
    table "discord_actors"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id], name: "idx_discord_actors_user_id"
      index [:status], name: "idx_discord_actors_status"
    end
  end

  typescript do
    type_name("DiscordActor")
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :get_by_id, args: [:id]
    define :get_by_user, args: [:user_id]
    define :connect, args: [:id]
    define :disconnect, args: [:id]
    define :sync_guilds, args: [:id]
    define :set_announcement_channel, args: [:id, :guild_id, :channel_id]
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true

      accept [
        :bot_token,
        :bot_name,
        :event_types
      ]

      change relate_actor(:user)
      change set_attribute(:status, :disconnected)
      change set_attribute(:actor_state, %{guilds: [], channels: %{}})
    end

    update :update do
      primary? true

      accept [
        :bot_token,
        :bot_name,
        :event_types,
        :announcement_guild_id,
        :announcement_channel_id
      ]
    end

    read :get_by_id do
      argument :id, :uuid, allow_nil?: false
      get? true
      filter expr(id == ^arg(:id))
    end

    read :get_by_user do
      argument :user_id, :uuid, allow_nil?: false
      get? true
      filter expr(user_id == ^arg(:user_id))
    end

    action :connect, :map do
      description "Connect the Discord bot"
      argument :id, :uuid, allow_nil?: false

      run fn input, context ->
        with {:ok, actor} <- Ash.get(__MODULE__, input.arguments.id, actor: context.actor),
             :ok <- BotManager.start_bot(actor) do
          Ash.update(actor, %{status: :connected, last_connected_at: DateTime.utc_now()}, actor: context.actor)

          {:ok, %{success: true, message: "Bot connected successfully"}}
        else
          {:error, reason} ->
            {:ok, %{success: false, message: "Failed to connect: #{inspect(reason)}"}}
        end
      end
    end

    action :disconnect, :map do
      description "Disconnect the Discord bot"
      argument :id, :uuid, allow_nil?: false

      run fn input, context ->
        with {:ok, actor} <- Ash.get(__MODULE__, input.arguments.id, actor: context.actor),
             :ok <- BotManager.stop_bot(actor) do
          Ash.update(actor, %{status: :disconnected}, actor: context.actor)
          {:ok, %{success: true, message: "Bot disconnected"}}
        else
          {:error, reason} ->
            {:ok, %{success: false, message: "Failed to disconnect: #{inspect(reason)}"}}
        end
      end
    end

    action :sync_guilds, :map do
      description "Sync available guilds and channels from Discord"
      argument :id, :uuid, allow_nil?: false

      run fn input, context ->
        with {:ok, actor} <- Ash.get(__MODULE__, input.arguments.id, actor: context.actor),
             {:ok, guilds_data} <- BotManager.fetch_guilds(actor) do
          new_state = Map.put(actor.actor_state || %{}, "guilds", guilds_data)

          Ash.update(actor, %{actor_state: new_state, last_synced_at: DateTime.utc_now()}, actor: context.actor)

          {:ok, %{success: true, guilds: guilds_data}}
        else
          {:error, reason} ->
            {:ok, %{success: false, message: "Failed to sync: #{inspect(reason)}"}}
        end
      end
    end

    action :set_announcement_channel, :map do
      description "Set the channel for announcements"
      argument :id, :uuid, allow_nil?: false
      argument :guild_id, :string, allow_nil?: false
      argument :channel_id, :string, allow_nil?: false

      run fn input, context ->
        case Ash.get(__MODULE__, input.arguments.id, actor: context.actor) do
          {:ok, actor} ->
            Ash.update(
              actor,
              %{
                announcement_guild_id: input.arguments.guild_id,
                announcement_channel_id: input.arguments.channel_id
              },
              actor: context.actor
            )

            {:ok, %{success: true, message: "Announcement channel set"}}

          {:error, reason} ->
            {:ok, %{success: false, message: "Failed to set channel: #{inspect(reason)}"}}
        end
      end
    end

    # Internal actions for bot manager updates
    update :update_status do
      accept [:status, :last_connected_at, :last_error, :last_error_at]
    end

    update :update_actor_state do
      accept [:actor_state, :last_synced_at]
    end

    update :record_message_sent do
      accept [:messages_sent]
    end
  end

  policies do
    bypass actor_attribute_equals(:is_admin, true) do
      authorize_if always()
    end

    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type([:create, :update, :destroy]) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action([:connect, :disconnect, :sync_guilds, :set_announcement_channel]) do
      authorize_if actor_present()
    end

    # Internal actions used by bot manager
    policy action([:update_status, :update_actor_state, :record_message_sent]) do
      authorize_if always()
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :bot_token, :string do
      allow_nil? false
      sensitive? true
      description "Discord bot token (from Discord Developer Portal)"
    end

    attribute :bot_name, :string do
      allow_nil? true
      constraints max_length: 100
      description "Friendly name for this bot configuration"
    end

    attribute :status, :atom do
      allow_nil? false
      default :disconnected
      constraints one_of: [:disconnected, :connecting, :connected, :error]
      description "Current connection status of the bot"
    end

    attribute :event_types, {:array, :atom} do
      allow_nil? false
      default [:donation, :stream_start, :stream_end]

      constraints items: [
                    one_of: [
                      :donation,
                      :stream_start,
                      :stream_end,
                      :new_follower,
                      :new_subscriber,
                      :raid,
                      :host,
                      :poll_created,
                      :poll_ended,
                      :giveaway_started,
                      :giveaway_ended
                    ]
                  ]

      description "Types of events that trigger notifications"
    end

    attribute :announcement_guild_id, :string do
      allow_nil? true
      description "Discord guild (server) ID for announcements"
    end

    attribute :announcement_channel_id, :string do
      allow_nil? true
      description "Discord channel ID for announcements"
    end

    attribute :actor_state, :map do
      allow_nil? false
      default %{}

      description """
      Synced state from Discord API:
      - guilds: list of {id, name, icon} the bot has joined
      - channels: map of guild_id => [{id, name, type}]
      """
    end

    attribute :last_connected_at, :utc_datetime_usec do
      allow_nil? true
      description "When the bot last connected successfully"
    end

    attribute :last_synced_at, :utc_datetime_usec do
      allow_nil? true
      description "When guilds/channels were last synced"
    end

    attribute :last_error, :string do
      allow_nil? true
      constraints max_length: 1000
      description "Last error message"
    end

    attribute :last_error_at, :utc_datetime_usec do
      allow_nil? true
      description "When the last error occurred"
    end

    attribute :messages_sent, :integer do
      allow_nil? false
      default 0
      description "Total messages sent through this bot"
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
      description "The user who owns this Discord bot configuration"
    end
  end

  identities do
    identity :unique_user_actor, [:user_id]
  end
end
