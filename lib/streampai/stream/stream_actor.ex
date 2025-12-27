defmodule Streampai.Stream.StreamActor do
  @moduledoc """
  Represents a stream agent actor for a user.

  Persists the current state of the streaming agent so that the frontend can
  use Electric SQL sync to get real-time updates on what the agent is doing.

  This resource uses the shared `actor_states` table with type="StreamActor".
  All stream-specific data is stored in the `data` JSONB field.

  ## Data Structure

  The `data` field contains:
  - status: Agent status (:idle, :starting, :streaming, :stopping, :error)
  - status_message: Human-readable message about what the agent is doing
  - error_message: Error message if the agent crashed or encountered an error
  - error_at: Timestamp of when the error occurred
  - viewers: Map of platform => viewer count (e.g., %{"twitch" => 150, "youtube" => 200})
  - total_viewers: Total viewer count across all platforms
  - livestream_id: Current livestream ID if streaming
  - started_at: When the stream started
  - platforms: Map of platform => platform status info
  - input_streaming: Whether input is streaming to Cloudflare
  - last_updated_at: Last time the state was updated
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource],
    primary_read_warning?: false

  @type_name "StreamActor"

  @valid_statuses [:idle, :starting, :streaming, :stopping, :error]

  postgres do
    table "actor_states"
    repo Streampai.Repo
  end

  typescript do
    type_name("StreamActor")
  end

  code_interface do
    define :read
    define :get_by_id, args: [:id]
    define :get_by_user, args: [:user_id]
    define :upsert_for_user, args: [:user_id]
    define :update_state
    define :set_streaming
    define :set_stopped
    define :set_error
    define :update_viewers
  end

  actions do
    defaults [:destroy]

    read :read do
      primary? true
      filter expr(type == @type_name)
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

    create :create do
      primary? true

      argument :status, :atom, default: :idle, constraints: [one_of: @valid_statuses]
      argument :status_message, :string, allow_nil?: true

      change relate_actor(:user)
      change set_attribute(:type, @type_name)

      change fn changeset, _context ->
        status = Ash.Changeset.get_argument(changeset, :status) || :idle
        status_message = Ash.Changeset.get_argument(changeset, :status_message)

        data = %{
          "status" => to_string(status),
          "status_message" => status_message,
          "viewers" => %{},
          "total_viewers" => 0,
          "platforms" => %{},
          "input_streaming" => false,
          "last_updated_at" => DateTime.utc_now() |> DateTime.to_iso8601()
        }

        Ash.Changeset.change_attribute(changeset, :data, data)
      end
    end

    create :upsert_for_user do
      argument :user_id, :uuid, allow_nil?: false
      argument :status, :atom, default: :idle, constraints: [one_of: @valid_statuses]
      argument :status_message, :string, allow_nil?: true

      upsert? true
      upsert_identity :unique_type_user
      upsert_fields [:data, :status, :updated_at]

      change set_attribute(:type, @type_name)

      change fn changeset, _context ->
        user_id = Ash.Changeset.get_argument(changeset, :user_id)
        status = Ash.Changeset.get_argument(changeset, :status) || :idle
        status_message = Ash.Changeset.get_argument(changeset, :status_message)

        changeset = Ash.Changeset.change_attribute(changeset, :user_id, user_id)

        data = %{
          "status" => to_string(status),
          "status_message" => status_message,
          "viewers" => %{},
          "total_viewers" => 0,
          "platforms" => %{},
          "input_streaming" => false,
          "last_updated_at" => DateTime.utc_now() |> DateTime.to_iso8601()
        }

        Ash.Changeset.change_attribute(changeset, :data, data)
      end
    end

    update :update_state do
      require_atomic? false

      argument :status, :atom, allow_nil?: true, constraints: [one_of: @valid_statuses]
      argument :status_message, :string, allow_nil?: true
      argument :livestream_id, :uuid, allow_nil?: true
      argument :input_streaming, :boolean, allow_nil?: true
      argument :platforms, :map, allow_nil?: true

      change fn changeset, _context ->
        current_data = Ash.Changeset.get_data(changeset, :data) || %{}

        updates =
          [:status, :status_message, :livestream_id, :input_streaming, :platforms]
          |> Enum.reduce(%{}, fn key, acc ->
            case Ash.Changeset.get_argument(changeset, key) do
              nil -> acc
              value when key == :status -> Map.put(acc, to_string(key), to_string(value))
              value -> Map.put(acc, to_string(key), value)
            end
          end)
          |> Map.put("last_updated_at", DateTime.utc_now() |> DateTime.to_iso8601())

        new_data = Map.merge(current_data, updates)
        Ash.Changeset.change_attribute(changeset, :data, new_data)
      end
    end

    update :set_streaming do
      require_atomic? false

      argument :livestream_id, :uuid, allow_nil?: false
      argument :status_message, :string, allow_nil?: true

      change fn changeset, _context ->
        current_data = Ash.Changeset.get_data(changeset, :data) || %{}
        livestream_id = Ash.Changeset.get_argument(changeset, :livestream_id)
        status_message = Ash.Changeset.get_argument(changeset, :status_message)

        updates = %{
          "status" => "streaming",
          "livestream_id" => livestream_id,
          "started_at" => DateTime.utc_now() |> DateTime.to_iso8601(),
          "error_message" => nil,
          "error_at" => nil,
          "last_updated_at" => DateTime.utc_now() |> DateTime.to_iso8601()
        }

        updates =
          if status_message do
            Map.put(updates, "status_message", status_message)
          else
            Map.put(updates, "status_message", "Streaming to platforms")
          end

        new_data = Map.merge(current_data, updates)
        Ash.Changeset.change_attribute(changeset, :data, new_data)
      end
    end

    update :set_stopped do
      require_atomic? false

      argument :status_message, :string, allow_nil?: true

      change fn changeset, _context ->
        current_data = Ash.Changeset.get_data(changeset, :data) || %{}

        updates = %{
          "status" => "idle",
          "livestream_id" => nil,
          "viewers" => %{},
          "total_viewers" => 0,
          "input_streaming" => false,
          "last_updated_at" => DateTime.utc_now() |> DateTime.to_iso8601()
        }

        updates =
          if status_message = Ash.Changeset.get_argument(changeset, :status_message) do
            Map.put(updates, "status_message", status_message)
          else
            Map.put(updates, "status_message", "Stream ended")
          end

        new_data = Map.merge(current_data, updates)
        Ash.Changeset.change_attribute(changeset, :data, new_data)
      end
    end

    update :set_error do
      require_atomic? false

      argument :error_message, :string, allow_nil?: false

      change fn changeset, _context ->
        current_data = Ash.Changeset.get_data(changeset, :data) || %{}
        error_message = Ash.Changeset.get_argument(changeset, :error_message)

        updates = %{
          "status" => "error",
          "error_message" => error_message,
          "error_at" => DateTime.utc_now() |> DateTime.to_iso8601(),
          "status_message" => "Error: #{error_message}",
          "last_updated_at" => DateTime.utc_now() |> DateTime.to_iso8601()
        }

        new_data = Map.merge(current_data, updates)
        Ash.Changeset.change_attribute(changeset, :data, new_data)
      end
    end

    update :update_viewers do
      require_atomic? false

      argument :platform, :atom, allow_nil?: false
      argument :viewer_count, :integer, allow_nil?: false

      change fn changeset, _context ->
        current_data = Ash.Changeset.get_data(changeset, :data) || %{}
        platform = Ash.Changeset.get_argument(changeset, :platform)
        viewer_count = Ash.Changeset.get_argument(changeset, :viewer_count)

        current_viewers = Map.get(current_data, "viewers", %{})
        updated_viewers = Map.put(current_viewers, to_string(platform), viewer_count)
        total = updated_viewers |> Map.values() |> Enum.sum()

        updates = %{
          "viewers" => updated_viewers,
          "total_viewers" => total,
          "last_updated_at" => DateTime.utc_now() |> DateTime.to_iso8601()
        }

        new_data = Map.merge(current_data, updates)
        Ash.Changeset.change_attribute(changeset, :data, new_data)
      end
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

    # Internal actions used by stream manager
    policy action([
             :update_state,
             :set_streaming,
             :set_stopped,
             :set_error,
             :update_viewers,
             :upsert_for_user
           ]) do
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
      description "The user who owns this stream actor"
    end
  end

  identities do
    identity :unique_type_user, [:type, :user_id], nils_distinct?: false
  end

  # Calculated attributes to access data fields
  calculations do
    calculate :agent_status, :string, expr(data[:status])
    calculate :status_message, :string, expr(data[:status_message])
    calculate :error_message, :string, expr(data[:error_message])
    calculate :error_at, :string, expr(data[:error_at])
    calculate :viewers, :map, expr(data[:viewers])
    calculate :total_viewers, :integer, expr(data[:total_viewers])
    calculate :livestream_id, :string, expr(data[:livestream_id])
    calculate :started_at, :string, expr(data[:started_at])
    calculate :platforms, :map, expr(data[:platforms])
    calculate :input_streaming, :boolean, expr(data[:input_streaming])
    calculate :last_updated_at, :string, expr(data[:last_updated_at])
  end

  @doc """
  Gets or creates a StreamActor for a user.
  """
  def get_or_create_for_user(user_id) when is_binary(user_id) do
    case get_by_user(user_id) do
      {:ok, actor} when not is_nil(actor) ->
        {:ok, actor}

      _ ->
        upsert_for_user(user_id, authorize?: false)
    end
  end

  @doc """
  Updates the stream actor state for a user.
  Creates the actor if it doesn't exist.
  """
  def update_for_user(user_id, updates) when is_binary(user_id) and is_map(updates) do
    case get_or_create_for_user(user_id) do
      {:ok, actor} ->
        Ash.update(actor, updates, action: :update_state, authorize?: false)

      error ->
        error
    end
  end

  @doc """
  Marks the stream as started for a user.
  """
  def mark_streaming(user_id, livestream_id, status_message \\ nil)
      when is_binary(user_id) and is_binary(livestream_id) do
    case get_or_create_for_user(user_id) do
      {:ok, actor} ->
        args = %{livestream_id: livestream_id}
        args = if status_message, do: Map.put(args, :status_message, status_message), else: args
        Ash.update(actor, args, action: :set_streaming, authorize?: false)

      error ->
        error
    end
  end

  @doc """
  Marks the stream as stopped for a user.
  """
  def mark_stopped(user_id, status_message \\ nil) when is_binary(user_id) do
    case get_or_create_for_user(user_id) do
      {:ok, actor} ->
        args = if status_message, do: %{status_message: status_message}, else: %{}
        Ash.update(actor, args, action: :set_stopped, authorize?: false)

      error ->
        error
    end
  end

  @doc """
  Marks the stream actor as having an error.
  """
  def mark_error(user_id, error_message) when is_binary(user_id) and is_binary(error_message) do
    case get_or_create_for_user(user_id) do
      {:ok, actor} ->
        Ash.update(actor, %{error_message: error_message}, action: :set_error, authorize?: false)

      error ->
        error
    end
  end

  @doc """
  Updates viewer count for a platform.
  """
  def update_viewer_count(user_id, platform, count)
      when is_binary(user_id) and is_atom(platform) and is_integer(count) do
    case get_or_create_for_user(user_id) do
      {:ok, actor} ->
        Ash.update(actor, %{platform: platform, viewer_count: count},
          action: :update_viewers,
          authorize?: false
        )

      error ->
        error
    end
  end

  @doc """
  Gets the current status of the stream actor.
  """
  def get_status(%{data: data}) when is_map(data) do
    case Map.get(data, "status", "idle") do
      status when is_binary(status) -> String.to_existing_atom(status)
      status when is_atom(status) -> status
      _ -> :idle
    end
  end

  def get_status(_), do: :idle
end
