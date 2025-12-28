defmodule Streampai.Integrations.DiscordActor do
  @moduledoc """
  Represents a Discord bot actor for a user.

  Each user can have their own Discord bot that:
  - Joins their Discord servers
  - Lists available channels
  - Sends notifications to selected channels

  This resource uses the shared `actor_states` table with type="DiscordActor".
  All Discord-specific data is stored in the `data` JSONB field.

  ## Data Structure

  The `data` field contains:
  - bot_token: Discord bot token (sensitive)
  - bot_name: Friendly name for the bot
  - status: Connection status (:disconnected, :connecting, :connected, :error)
  - event_types: List of event types to notify on
  - announcement_guild_id: Selected guild for announcements
  - announcement_channel_id: Selected channel for announcements
  - guilds: List of guilds the bot has joined
  - channels: Map of guild_id => channel list
  - last_connected_at: Last successful connection timestamp
  - last_synced_at: Last guild/channel sync timestamp
  - last_error: Last error message
  - last_error_at: Last error timestamp
  - messages_sent: Total messages sent counter
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Integrations,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource],
    primary_read_warning?: false

  alias Streampai.Integrations.Discord.BotManager
  alias Streampai.Integrations.DiscordActor.Changes

  @type_name "DiscordActor"

  @default_event_types [:donation, :stream_start, :stream_end]

  @valid_statuses [:disconnected, :connecting, :connected, :error]

  postgres do
    table "actor_states"
    repo Streampai.Repo
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
    defaults [:destroy]

    read :read do
      primary? true
      filter expr(type == @type_name)
    end

    create :create do
      primary? true

      argument :bot_token, :string, allow_nil?: false, sensitive?: true
      argument :bot_name, :string, allow_nil?: true
      argument :event_types, {:array, :atom}, default: @default_event_types

      change relate_actor(:user)
      change set_attribute(:type, @type_name)
      change Changes.InitializeData
    end

    update :update do
      primary? true
      require_atomic? false

      argument :bot_token, :string, allow_nil?: true, sensitive?: true
      argument :bot_name, :string, allow_nil?: true
      argument :event_types, {:array, :atom}, allow_nil?: true
      argument :announcement_guild_id, :string, allow_nil?: true
      argument :announcement_channel_id, :string, allow_nil?: true

      change Changes.MergeDataFromArguments
    end

    read :get_by_id do
      argument :id, :uuid, allow_nil?: false
      get? true
      filter expr(id == ^arg(:id) and type == @type_name)
    end

    read :get_by_user do
      argument :user_id, :uuid, allow_nil?: false
      get? true
      filter expr(user_id == ^arg(:user_id) and type == @type_name)
    end

    action :connect, :map do
      description "Connect the Discord bot"
      argument :id, :uuid, allow_nil?: false

      run fn input, context ->
        with {:ok, actor} <- Ash.get(__MODULE__, input.arguments.id, actor: context.actor),
             :ok <- BotManager.start_bot(actor) do
          update_data_field(actor, %{
            "status" => "connected",
            "last_connected_at" => DateTime.to_iso8601(DateTime.utc_now())
          })

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
          update_data_field(actor, %{"status" => "disconnected"})
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
          update_data_field(actor, %{
            "guilds" => guilds_data,
            "last_synced_at" => DateTime.to_iso8601(DateTime.utc_now())
          })

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
            update_data_field(actor, %{
              "announcement_guild_id" => input.arguments.guild_id,
              "announcement_channel_id" => input.arguments.channel_id
            })

            {:ok, %{success: true, message: "Announcement channel set"}}

          {:error, reason} ->
            {:ok, %{success: false, message: "Failed to set channel: #{inspect(reason)}"}}
        end
      end
    end

    # Internal actions for bot manager updates
    update :update_status do
      require_atomic? false
      argument :status, :atom, allow_nil?: false, constraints: [one_of: @valid_statuses]
      argument :last_error, :string, allow_nil?: true
      argument :last_error_at, :utc_datetime_usec, allow_nil?: true

      change Changes.UpdateConnectionStatus
    end

    update :update_actor_state do
      require_atomic? false
      argument :guilds, {:array, :map}, allow_nil?: true
      argument :channels, :map, allow_nil?: true
      argument :last_synced_at, :utc_datetime_usec, allow_nil?: true

      change Changes.UpdateGuildsAndChannels
    end

    update :record_message_sent do
      require_atomic? false

      change Changes.IncrementMessagesSent
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

    attribute :type, :string do
      description "Actor type identifier"
      allow_nil? false
      public? true
    end

    attribute :data, :map do
      description "Actor-specific state data stored as JSONB"
      allow_nil? false
      default %{}
      public? true
    end

    attribute :status, Streampai.System.ActorStatus do
      description "Actor lifecycle status"
      allow_nil? false
      default :active
      public? true
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

  # Calculated attributes to access data fields
  calculations do
    calculate :bot_token, :string, expr(data[:bot_token]) do
      sensitive? true
    end

    calculate :bot_name, :string, expr(data[:bot_name])
    calculate :connection_status, :string, expr(data[:status])
    calculate :event_types, {:array, :string}, expr(data[:event_types])
    calculate :announcement_guild_id, :string, expr(data[:announcement_guild_id])
    calculate :announcement_channel_id, :string, expr(data[:announcement_channel_id])
    calculate :guilds, {:array, :map}, expr(data[:guilds])
    calculate :channels, :map, expr(data[:channels])
    calculate :last_connected_at, :string, expr(data[:last_connected_at])
    calculate :last_synced_at, :string, expr(data[:last_synced_at])
    calculate :last_error, :string, expr(data[:last_error])
    calculate :last_error_at, :string, expr(data[:last_error_at])
    calculate :messages_sent, :integer, expr(data[:messages_sent])
  end

  identities do
    identity :unique_type_user, [:type, :user_id], nils_distinct?: false
  end

  # Helper function to update data fields
  defp update_data_field(actor, updates) do
    current_data = actor.data || %{}
    new_data = Map.merge(current_data, updates)
    Ash.update!(actor, %{data: new_data}, action: :update, authorize?: false)
  end

  # Public helper to get bot token from actor
  def get_bot_token(%{data: data}) when is_map(data), do: Map.get(data, "bot_token")
  def get_bot_token(_), do: nil

  # Public helper to get connection status
  def get_connection_status(%{data: data}) when is_map(data) do
    case Map.get(data, "status", "disconnected") do
      status when is_binary(status) -> String.to_existing_atom(status)
      status when is_atom(status) -> status
      _ -> :disconnected
    end
  end

  def get_connection_status(_), do: :disconnected

  # Public helper to get event types
  def get_event_types(%{data: data}) when is_map(data) do
    case Map.get(data, "event_types", @default_event_types) do
      types when is_list(types) ->
        Enum.map(types, fn
          t when is_binary(t) -> String.to_existing_atom(t)
          t when is_atom(t) -> t
        end)

      _ ->
        @default_event_types
    end
  end

  def get_event_types(_), do: @default_event_types
end
