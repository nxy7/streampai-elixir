defmodule Streampai.System.ActorState do
  @moduledoc """
  Persistent state storage for agents/actors.

  Actors can use this resource to persist their state across restarts.
  The `data` field stores JSONB data - actors should define their own
  typed structures for this data to maintain type safety.

  ## Usage

      # Create/update actor state
      ActorState.upsert(%{
        type: "MyApp.SomeActor",
        user_id: user.id,
        data: %{counter: 0, last_processed_at: DateTime.utc_now()}
      })

      # Get actor state
      ActorState.get_by_type("MyApp.SomeActor", user_id: user.id)
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.System,
    data_layer: AshPostgres.DataLayer

  alias Streampai.System.ActorStatus

  postgres do
    table "actor_states"
    repo Streampai.Repo

    custom_indexes do
      index [:status],
        name: "idx_actor_states_status"
    end
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :upsert
    define :get_by_type, args: [:type, {:optional, :user_id}]
    define :for_user, args: [:user_id]
    define :by_status, args: [:status]
    define :pause
    define :resume
    define :terminate
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:type, :data, :user_id, :status]
    end

    update :update do
      accept [:data, :status]
      primary? true
    end

    create :upsert do
      accept [:type, :data, :user_id, :status]

      upsert? true
      upsert_identity :unique_type_user
      upsert_fields [:data, :status, :updated_at]
    end

    read :get_by_type do
      description "Get actor state by type and optional user_id"

      argument :type, :string, allow_nil?: false
      argument :user_id, :uuid, allow_nil?: true

      get? true

      filter expr(type == ^arg(:type))

      prepare fn query, _context ->
        require Ash.Query

        user_id = Ash.Query.get_argument(query, :user_id)

        if user_id do
          Ash.Query.filter(query, user_id == ^user_id)
        else
          Ash.Query.filter(query, is_nil(user_id))
        end
      end
    end

    read :for_user do
      description "Get all actor states for a user"

      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [updated_at: :desc])
    end

    read :by_status do
      description "Get all actor states with a specific status"

      argument :status, ActorStatus, allow_nil?: false

      filter expr(status == ^arg(:status))
      prepare build(sort: [updated_at: :desc])
    end

    update :pause do
      description "Pause an actor"
      accept []
      change set_attribute(:status, :paused)
    end

    update :resume do
      description "Resume a paused actor"
      accept []
      change set_attribute(:status, :active)
    end

    update :terminate do
      description "Terminate an actor"
      accept []
      change set_attribute(:status, :terminated)
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :type, :string do
      description "Actor module name (e.g., 'MyApp.SomeActor')"
      allow_nil? false
      public? true
    end

    attribute :data, :map do
      description "Actor-specific state data stored as JSONB"
      allow_nil? false
      default %{}
      public? true
    end

    attribute :status, ActorStatus do
      description "Actor lifecycle status"
      allow_nil? false
      default :active
      public? true
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      description "Optional user this actor is associated with"
      allow_nil? true
      public? true
    end
  end

  identities do
    identity :unique_type_user, [:type, :user_id], nils_distinct?: false
  end
end
