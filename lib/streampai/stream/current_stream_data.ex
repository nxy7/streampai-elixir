defmodule Streampai.Stream.CurrentStreamData do
  @moduledoc """
  Stores the current stream state for a user, with separate JSONB columns per domain.

  Unlike the old `StreamManagerState` which stored everything in a single `data` JSONB blob,
  this resource uses separate columns for each domain (cloudflare, youtube, twitch, kick).
  This eliminates concurrent merge conflicts — each domain writes to its own column.

  ## Columns

  - `status` — top-level stream status (idle, streaming, disconnected, error, stopping)
  - `stream_data` — core stream info (livestream_id, title, description, timestamps, etc.)
  - `cloudflare_data` — Cloudflare input state (live_input_uid, input_streaming)
  - `youtube_data` — YouTube platform status (viewer_count, url, title, etc.)
  - `twitch_data` — Twitch platform status
  - `kick_data` — Kick platform status

  Total viewers is calculated from platform columns, not stored.
  """

  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource],
    primary_read_warning?: false

  import Streampai.MapUtils, only: [maybe_put: 3, stringify_keys: 1]

  alias Streampai.Stream.PlatformStatus

  @platform_atoms [:youtube, :twitch, :kick]

  postgres do
    table "current_stream_data"
    repo Streampai.Repo
  end

  typescript do
    type_name("CurrentStreamData")
  end

  code_interface do
    define :read
    define :get_by_user, args: [:user_id]
    define :upsert_for_user, args: [:user_id]
    define :update_status, args: [:status]
    define :update_stream_data
    define :update_cloudflare_data
    define :update_platform_data, args: [:platform, :platform_data]
    define :clear_platform_data, args: [:platform]
    define :set_streaming
    define :set_stopped
    define :clear_all_platform_data
    define :set_error, args: [:error_message]
    define :set_active_alert
    define :clear_active_alert, args: [:alert_id]
    define :highlight_message
    define :clear_highlight
    define :update_alertbox_state
  end

  actions do
    defaults [:destroy]

    read :read do
      primary? true
    end

    read :get_by_user do
      argument :user_id, :uuid, allow_nil?: false
      get? true
      filter expr(user_id == ^arg(:user_id))
    end

    create :create do
      primary? true
      change relate_actor(:user)
    end

    create :upsert_for_user do
      argument :user_id, :uuid, allow_nil?: false

      upsert? true
      upsert_identity :unique_user
      upsert_fields [:updated_at]

      change set_attribute(:user_id, arg(:user_id))
    end

    update :update_status do
      require_atomic? false
      argument :status, :string, allow_nil?: false
      change set_attribute(:status, arg(:status))
    end

    update :update_stream_data do
      require_atomic? false

      argument :stream_data, :map, allow_nil?: false

      change fn changeset, _context ->
        new_data = Ash.Changeset.get_argument(changeset, :stream_data)
        current = Ash.Changeset.get_data(changeset, :stream_data) || %{}
        merged = Map.merge(current, stringify_keys(new_data))
        Ash.Changeset.change_attribute(changeset, :stream_data, merged)
      end
    end

    update :update_cloudflare_data do
      require_atomic? false

      argument :cloudflare_data, :map, allow_nil?: false

      change fn changeset, _context ->
        new_data = Ash.Changeset.get_argument(changeset, :cloudflare_data)
        current = Ash.Changeset.get_data(changeset, :cloudflare_data) || %{}
        merged = Map.merge(current, stringify_keys(new_data))
        Ash.Changeset.change_attribute(changeset, :cloudflare_data, merged)
      end
    end

    update :update_platform_data do
      require_atomic? false

      argument :platform, :atom,
        allow_nil?: false,
        constraints: [one_of: [:youtube, :twitch, :kick]]

      argument :platform_data, :map, allow_nil?: false

      change fn changeset, _context ->
        platform = Ash.Changeset.get_argument(changeset, :platform)
        new_data = Ash.Changeset.get_argument(changeset, :platform_data)
        column = platform_column(platform)
        current = Ash.Changeset.get_data(changeset, column) || %{}
        merged = Map.merge(current, stringify_keys(new_data))
        Ash.Changeset.change_attribute(changeset, column, merged)
      end
    end

    update :clear_platform_data do
      require_atomic? false

      argument :platform, :atom,
        allow_nil?: false,
        constraints: [one_of: [:youtube, :twitch, :kick]]

      change fn changeset, _context ->
        platform = Ash.Changeset.get_argument(changeset, :platform)
        column = platform_column(platform)
        Ash.Changeset.change_attribute(changeset, column, %{})
      end
    end

    update :set_streaming do
      require_atomic? false

      argument :livestream_id, :uuid, allow_nil?: false
      argument :title, :string, allow_nil?: true
      argument :description, :string, allow_nil?: true
      argument :tags, {:array, :string}, allow_nil?: true
      argument :thumbnail_file_id, :uuid, allow_nil?: true
      argument :status_message, :string, allow_nil?: true

      change fn changeset, _context ->
        livestream_id = Ash.Changeset.get_argument(changeset, :livestream_id)
        status_message = Ash.Changeset.get_argument(changeset, :status_message)
        now = DateTime.to_iso8601(DateTime.utc_now())

        stream_data =
          %{
            "livestream_id" => livestream_id,
            "started_at" => now,
            "error_message" => nil,
            "error_at" => nil,
            "status_message" => status_message || "Streaming to platforms"
          }
          |> maybe_put("title", Ash.Changeset.get_argument(changeset, :title))
          |> maybe_put("description", Ash.Changeset.get_argument(changeset, :description))
          |> maybe_put("tags", Ash.Changeset.get_argument(changeset, :tags))
          |> maybe_put(
            "thumbnail_file_id",
            Ash.Changeset.get_argument(changeset, :thumbnail_file_id)
          )

        changeset
        |> Ash.Changeset.change_attribute(:status, "streaming")
        |> Ash.Changeset.change_attribute(:stream_data, stream_data)
      end
    end

    update :set_stopped do
      require_atomic? false

      argument :status_message, :string, allow_nil?: true

      change fn changeset, _context ->
        status_message = Ash.Changeset.get_argument(changeset, :status_message)

        stream_data = %{
          "livestream_id" => nil,
          "started_at" => nil,
          "status_message" => status_message || "Stream ended"
        }

        changeset
        |> Ash.Changeset.change_attribute(:status, "idle")
        |> Ash.Changeset.change_attribute(:stream_data, stream_data)
        |> Ash.Changeset.change_attribute(:youtube_data, %{})
        |> Ash.Changeset.change_attribute(:twitch_data, %{})
        |> Ash.Changeset.change_attribute(:kick_data, %{})
      end
    end

    update :clear_all_platform_data do
      require_atomic? false

      change fn changeset, _context ->
        changeset
        |> Ash.Changeset.change_attribute(:youtube_data, %{})
        |> Ash.Changeset.change_attribute(:twitch_data, %{})
        |> Ash.Changeset.change_attribute(:kick_data, %{})
      end
    end

    update :set_error do
      require_atomic? false

      argument :error_message, :string, allow_nil?: false

      change fn changeset, _context ->
        error_message = Ash.Changeset.get_argument(changeset, :error_message)
        now = DateTime.to_iso8601(DateTime.utc_now())

        current_stream = Ash.Changeset.get_data(changeset, :stream_data) || %{}

        stream_data =
          Map.merge(current_stream, %{
            "error_message" => error_message,
            "error_at" => now,
            "status_message" => "Error: #{error_message}"
          })

        changeset
        |> Ash.Changeset.change_attribute(:status, "error")
        |> Ash.Changeset.change_attribute(:stream_data, stream_data)
      end
    end

    update :set_active_alert do
      require_atomic? false
      argument :active_alert, :map, allow_nil?: false
      change set_attribute(:active_alert, arg(:active_alert))
    end

    update :clear_active_alert do
      require_atomic? false
      argument :alert_id, :string, allow_nil?: false

      change fn changeset, _context ->
        alert_id = Ash.Changeset.get_argument(changeset, :alert_id)
        current = Ash.Changeset.get_data(changeset, :active_alert)

        if is_map(current) && Map.get(current, "id") == alert_id do
          Ash.Changeset.change_attribute(changeset, :active_alert, nil)
        else
          changeset
        end
      end
    end

    update :highlight_message do
      require_atomic? false
      argument :highlighted_message, :map, allow_nil?: false
      change set_attribute(:highlighted_message, arg(:highlighted_message))
    end

    update :clear_highlight do
      require_atomic? false
      change set_attribute(:highlighted_message, nil)
    end

    update :update_alertbox_state do
      require_atomic? false
      argument :alertbox_state, :map, allow_nil?: false
      change set_attribute(:alertbox_state, arg(:alertbox_state))
    end
  end

  policies do
    bypass Streampai.SystemActor.Check do
      authorize_if always()
    end

    bypass actor_attribute_equals(:is_admin, true) do
      authorize_if always()
    end

    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type([:create, :update, :destroy]) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action([
             :update_status,
             :update_stream_data,
             :update_cloudflare_data,
             :update_platform_data,
             :clear_platform_data,
             :set_streaming,
             :set_stopped,
             :clear_all_platform_data,
             :set_error,
             :upsert_for_user,
             :set_active_alert,
             :clear_active_alert,
             :highlight_message,
             :clear_highlight,
             :update_alertbox_state
           ]) do
      authorize_if always()
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :status, :string do
      description "Current stream status: idle, streaming, disconnected, error, stopping"
      allow_nil? false
      default "idle"
      public? true
    end

    attribute :stream_data, :map do
      description "Core stream data: livestream_id, started_at, title, description, tags, error info"
      allow_nil? false
      default %{}
      public? true
    end

    attribute :cloudflare_data, :map do
      description "Cloudflare input state: live_input_uid, input_streaming"
      allow_nil? false
      default %{}
      public? true
    end

    attribute :youtube_data, :map do
      description "YouTube platform status: status, viewer_count, url, title, category"
      allow_nil? false
      default %{}
      public? true
    end

    attribute :twitch_data, :map do
      description "Twitch platform status"
      allow_nil? false
      default %{}
      public? true
    end

    attribute :kick_data, :map do
      description "Kick platform status"
      allow_nil? false
      default %{}
      public? true
    end

    attribute :active_alert, :map do
      description "Currently displayed alert event (donation, follow, subscription, raid)"
      allow_nil? true
      default nil
      public? true
    end

    attribute :highlighted_message, :map do
      description "Currently highlighted chat message for display on stream"
      allow_nil? true
      default nil
      public? true
    end

    attribute :alertbox_state, :map do
      description "Alertbox metadata: paused status, queue size"
      allow_nil? false
      default %{}
      public? true
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
      description "The user who owns this stream data"
    end
  end

  identities do
    identity :unique_user, [:user_id]
  end

  # --- Public convenience functions ---

  @doc "Gets or creates CurrentStreamData for a user."
  def get_or_create_for_user(user_id) when is_binary(user_id) do
    case get_by_user(user_id, actor: Streampai.SystemActor.system()) do
      {:ok, record} when not is_nil(record) ->
        {:ok, record}

      _ ->
        upsert_for_user(user_id, actor: Streampai.SystemActor.system())
    end
  end

  @doc "Updates the status column."
  def update_status_for_user(user_id, status) when is_binary(user_id) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{status: status},
        action: :update_status,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Updates stream_data fields (merges into existing)."
  def update_stream_data_for_user(user_id, data) when is_binary(user_id) and is_map(data) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{stream_data: data},
        action: :update_stream_data,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Updates cloudflare_data fields (merges into existing)."
  def update_cloudflare_data_for_user(user_id, data) when is_binary(user_id) and is_map(data) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{cloudflare_data: data},
        action: :update_cloudflare_data,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Marks stream as started."
  def mark_streaming(user_id, livestream_id, opts \\ []) when is_binary(user_id) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      args =
        %{livestream_id: livestream_id}
        |> maybe_put(:status_message, Keyword.get(opts, :status_message))
        |> maybe_put(:title, Keyword.get(opts, :title))
        |> maybe_put(:description, Keyword.get(opts, :description))
        |> maybe_put(:tags, Keyword.get(opts, :tags))
        |> maybe_put(:thumbnail_file_id, Keyword.get(opts, :thumbnail_file_id))

      Ash.update(record, args, action: :set_streaming, actor: Streampai.SystemActor.system())
    end
  end

  @doc "Marks stream as stopped. Clears all platform data."
  def mark_stopped(user_id, status_message \\ nil) when is_binary(user_id) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      mark_stopped_record(record, status_message)
    end
  end

  @doc "Marks an already-loaded record as stopped."
  def mark_stopped_record(record, status_message \\ nil) do
    args = if status_message, do: %{status_message: status_message}, else: %{}
    Ash.update(record, args, action: :set_stopped, actor: Streampai.SystemActor.system())
  end

  @doc "Marks stream as error."
  def mark_error(user_id, error_message) when is_binary(user_id) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{error_message: error_message},
        action: :set_error,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Updates a platform's data (writes to the platform's own column)."
  def set_platform_status(user_id, platform, %PlatformStatus{} = status)
      when is_binary(user_id) and platform in @platform_atoms do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{platform: platform, platform_data: PlatformStatus.to_map(status)},
        action: :update_platform_data,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Merges additional data into a platform's column (e.g. reconnection data)."
  def update_platform_data_for_user(user_id, platform, data)
      when is_binary(user_id) and platform in @platform_atoms and is_map(data) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{platform: platform, platform_data: data},
        action: :update_platform_data,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Clears a platform's data (sets its column to empty map)."
  def remove_platform_status(user_id, platform) when is_binary(user_id) and platform in @platform_atoms do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{platform: platform},
        action: :clear_platform_data,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Clears all platform columns (youtube_data, twitch_data, kick_data)."
  def clear_all_platforms(user_id) when is_binary(user_id) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{},
        action: :clear_all_platform_data,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Updates viewer count for a platform."
  def update_viewer_count(user_id, platform, count)
      when is_binary(user_id) and platform in @platform_atoms and is_integer(count) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{platform: platform, platform_data: %{"viewer_count" => count}},
        action: :update_platform_data,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Updates stream metadata (title, description, tags)."
  def update_metadata(user_id, metadata) when is_binary(user_id) and is_map(metadata) do
    allowed_keys = ~w(title description tags thumbnail_file_id)

    updates =
      Enum.reduce(metadata, %{}, fn {k, v}, acc ->
        key = to_string(k)
        if key in allowed_keys, do: Map.put(acc, key, v), else: acc
      end)

    if map_size(updates) == 0 do
      :ok
    else
      update_stream_data_for_user(user_id, updates)
    end
  end

  @doc "Gets the current status atom."
  def get_status(%{status: status}) when is_binary(status) do
    String.to_existing_atom(status)
  rescue
    ArgumentError -> :idle
  end

  def get_status(_), do: :idle

  @doc "Gets the stream_data from a record (for reading livestream_id etc.)"
  def get_stream_data(%{stream_data: data}) when is_map(data), do: data
  def get_stream_data(_), do: %{}

  @doc "Sets the active alert for a user."
  def set_active_alert_for_user(user_id, alert_data) when is_binary(user_id) and is_map(alert_data) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{active_alert: alert_data},
        action: :set_active_alert,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Clears the active alert for a user, only if the alert_id matches."
  def clear_active_alert_for_user(user_id, alert_id) when is_binary(user_id) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{alert_id: alert_id},
        action: :clear_active_alert,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Highlights a chat message for a user."
  def highlight_message_for_user(user_id, message_data) when is_binary(user_id) and is_map(message_data) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{highlighted_message: message_data},
        action: :highlight_message,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Clears the highlighted message for a user."
  def clear_highlight_for_user(user_id) when is_binary(user_id) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{},
        action: :clear_highlight,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  @doc "Updates the alertbox state (paused, queue_size) for a user."
  def update_alertbox_state_for_user(user_id, state_data) when is_binary(user_id) and is_map(state_data) do
    with {:ok, record} <- get_or_create_for_user(user_id) do
      Ash.update(record, %{alertbox_state: state_data},
        action: :update_alertbox_state,
        actor: Streampai.SystemActor.system()
      )
    end
  end

  # --- Private helpers ---

  defp platform_column(:youtube), do: :youtube_data
  defp platform_column(:twitch), do: :twitch_data
  defp platform_column(:kick), do: :kick_data
end
