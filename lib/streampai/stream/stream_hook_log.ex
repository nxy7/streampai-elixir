defmodule Streampai.Stream.StreamHookLog do
  @moduledoc """
  Execution log for stream hooks. Records every hook trigger attempt
  with its outcome (success, failure, skipped).
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource]

  alias Streampai.Accounts.User
  alias Streampai.Stream.StreamHook

  postgres do
    table "stream_hook_logs"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id, :inserted_at], name: "idx_stream_hook_logs_user_chrono"
      index [:hook_id, :inserted_at], name: "idx_stream_hook_logs_hook_chrono"
    end
  end

  typescript do
    type_name("StreamHookLog")
  end

  code_interface do
    define :create
    define :read
    define :get_for_user, args: [:user_id]
    define :get_for_hook, args: [:hook_id]
  end

  actions do
    defaults [:read]

    create :create do
      primary? true

      accept [
        :hook_id,
        :user_id,
        :stream_event_id,
        :trigger_type,
        :action_type,
        :status,
        :error_message,
        :executed_at,
        :duration_ms
      ]
    end

    read :get_for_user do
      description "Get recent hook logs for a user"
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc], limit: 100)
    end

    read :get_for_hook do
      description "Get recent logs for a specific hook"
      argument :hook_id, :uuid, allow_nil?: false
      filter expr(hook_id == ^arg(:hook_id))
      prepare build(sort: [inserted_at: :desc], limit: 50)
    end
  end

  policies do
    bypass actor_attribute_equals(:is_admin, true) do
      authorize_if always()
    end

    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type(:create) do
      authorize_if always()
    end
  end

  attributes do
    uuid_primary_key :id, public?: true

    attribute :hook_id, :uuid do
      allow_nil? false
      public? true
    end

    attribute :user_id, :uuid do
      allow_nil? false
      public? true
    end

    attribute :stream_event_id, :uuid do
      allow_nil? true
      public? true
    end

    attribute :trigger_type, Streampai.Stream.HookTriggerType do
      allow_nil? false
      public? true
    end

    attribute :action_type, Streampai.Stream.HookActionType do
      allow_nil? false
      public? true
    end

    attribute :status, Streampai.Stream.HookLogStatus do
      allow_nil? false
      public? true
    end

    attribute :error_message, :string do
      allow_nil? true
      public? true
    end

    attribute :executed_at, :utc_datetime_usec do
      allow_nil? false
      public? true
    end

    attribute :duration_ms, :integer do
      allow_nil? true
      public? true
    end

    create_timestamp :inserted_at, public?: true
  end

  relationships do
    belongs_to :hook, StreamHook do
      source_attribute :hook_id
      destination_attribute :id
    end

    belongs_to :user, User do
      source_attribute :user_id
      destination_attribute :id
    end
  end
end
