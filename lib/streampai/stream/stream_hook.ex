defmodule Streampai.Stream.StreamHook do
  @moduledoc """
  User-defined automation: "When [trigger] happens → do [action]".

  Hooks run in the `HookExecutor` GenServer which is started when the user
  comes online (presence-based) and stays alive. The executor subscribes to
  stream events via `Phoenix.Sync.Client.stream` and to hook config changes
  via `Phoenix.Sync.Shape`.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource]

  alias Streampai.Accounts.User
  alias Streampai.Stream.HookActionType
  alias Streampai.Stream.HookTriggerType

  postgres do
    table "stream_hooks"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id], name: "idx_stream_hooks_user_id"
      index [:user_id, :enabled], name: "idx_stream_hooks_user_enabled"
      index [:user_id, :trigger_type], name: "idx_stream_hooks_user_trigger"
    end
  end

  typescript do
    type_name("StreamHook")
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :create_hook, args: [:name, :trigger_type, :action_type, :action_config]
    define :get_for_user, args: [:user_id]
    define :get_enabled_for_user, args: [:user_id]
  end

  actions do
    defaults [:read]

    destroy :destroy do
      primary? true
    end

    create :create do
      primary? true
      accept [:*]
    end

    create :create_hook do
      description "Create a new hook"

      argument :name, :string, allow_nil?: false
      argument :trigger_type, HookTriggerType, allow_nil?: false
      argument :action_type, HookActionType, allow_nil?: false
      argument :action_config, :map, allow_nil?: false
      argument :conditions, :map, allow_nil?: true
      argument :cooldown_seconds, :integer, allow_nil?: true

      change set_attribute(:user_id, actor(:id))
      change set_attribute(:name, arg(:name))
      change set_attribute(:trigger_type, arg(:trigger_type))
      change set_attribute(:action_type, arg(:action_type))
      change set_attribute(:action_config, arg(:action_config))
      change set_attribute(:conditions, arg(:conditions))

      change fn changeset, _context ->
        case Ash.Changeset.get_argument(changeset, :cooldown_seconds) do
          nil -> changeset
          val -> Ash.Changeset.change_attribute(changeset, :cooldown_seconds, val)
        end
      end
    end

    update :update do
      primary? true
      require_atomic? false

      accept [
        :name,
        :trigger_type,
        :conditions,
        :action_type,
        :action_config,
        :cooldown_seconds,
        :enabled
      ]
    end

    update :toggle do
      description "Toggle hook enabled state"
      argument :enabled, :boolean, allow_nil?: false
      change set_attribute(:enabled, arg(:enabled))
    end

    update :mark_triggered do
      description "Update last_triggered_at after hook fires"
      accept []
      change set_attribute(:last_triggered_at, &DateTime.utc_now/0)
    end

    read :get_for_user do
      description "Get all hooks for a user"
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc])
    end

    read :get_enabled_for_user do
      description "Get enabled hooks for a user"
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id) and enabled == true)
      prepare build(sort: [inserted_at: :desc])
    end
  end

  policies do
    bypass actor_attribute_equals(:is_admin, true) do
      authorize_if always()
    end

    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action(:get_enabled_for_user) do
      authorize_if always()
    end

    policy action_type(:create) do
      authorize_if actor_present()
    end

    policy action_type(:update) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type(:destroy) do
      authorize_if expr(user_id == ^actor(:id))
    end
  end

  attributes do
    uuid_primary_key :id, public?: true

    attribute :name, :string do
      allow_nil? false
      public? true
      constraints max_length: 200
    end

    attribute :enabled, :boolean do
      allow_nil? false
      public? true
      default true
    end

    attribute :trigger_type, HookTriggerType do
      allow_nil? false
      public? true
    end

    attribute :conditions, :map do
      allow_nil? true
      public? true
      default %{}
    end

    attribute :action_type, HookActionType do
      allow_nil? false
      public? true
    end

    attribute :action_config, :map do
      allow_nil? false
      public? true
    end

    attribute :cooldown_seconds, :integer do
      allow_nil? false
      public? true
      default 0
      constraints min: 0, max: 86_400
    end

    attribute :last_triggered_at, :utc_datetime_usec do
      allow_nil? true
      public? true
    end

    timestamps(public?: true)
  end

  relationships do
    belongs_to :user, User do
      allow_nil? false
      attribute_writable? true
    end
  end
end
