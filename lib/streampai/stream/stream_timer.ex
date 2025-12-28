defmodule Streampai.Stream.StreamTimer do
  @moduledoc """
  Represents a timer that can be used during a stream to send messages at intervals.

  Timers are used by streamers to:
  - Send periodic messages to chat (e.g., reminders, promotions)
  - Create countdowns for events (e.g., giveaways, breaks)
  - Automate recurring announcements

  ## Timer States
  - **Ready**: Timer is created but not started (is_running: false, is_paused: false)
  - **Running**: Timer is actively counting down (is_running: true, is_paused: false)
  - **Paused**: Timer is temporarily stopped (is_running: false, is_paused: true)
  - **Finished**: Timer has completed (remaining_seconds <= 0)

  The Elixir actor process (StreamTimerActor) syncs with these database records
  to send messages at the appropriate intervals.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource]

  alias Streampai.Accounts.User

  postgres do
    table "stream_timers"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id], name: "idx_stream_timers_user_id"
      index [:user_id, :is_running], name: "idx_stream_timers_user_running"
    end
  end

  typescript do
    type_name("StreamTimer")
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :create_timer, args: [:label, :content, :duration_seconds]
    define :start_timer, args: [:id]
    define :pause_timer, args: [:id]
    define :reset_timer, args: [:id]
    define :get_for_user, args: [:user_id]
    define :get_running_timers, args: [:user_id]
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:*]
    end

    create :create_timer do
      description "Create a new stream timer"

      argument :label, :string do
        allow_nil? false
        constraints max_length: 100
      end

      argument :content, :string do
        allow_nil? true
        constraints max_length: 2000
      end

      argument :duration_seconds, :integer do
        allow_nil? false
        constraints min: 1, max: 10800
      end

      change set_attribute(:user_id, actor(:id))
      change set_attribute(:label, arg(:label))
      change set_attribute(:content, arg(:content))
      change set_attribute(:duration_seconds, arg(:duration_seconds))
      change set_attribute(:remaining_seconds, arg(:duration_seconds))
      change set_attribute(:is_running, false)
      change set_attribute(:is_paused, false)
    end

    update :update do
      primary? true
      accept [:label, :content, :duration_seconds, :remaining_seconds, :is_running, :is_paused]
    end

    update :start_timer do
      description "Start the timer"
      require_atomic? false

      argument :id, :uuid, allow_nil?: false

      change set_attribute(:is_running, true)
      change set_attribute(:is_paused, false)
      change set_attribute(:started_at, &DateTime.utc_now/0)
    end

    update :pause_timer do
      description "Pause the timer"
      require_atomic? false

      argument :id, :uuid, allow_nil?: false

      change set_attribute(:is_running, false)
      change set_attribute(:is_paused, true)
    end

    update :reset_timer do
      description "Reset the timer to its original duration"
      require_atomic? false

      argument :id, :uuid, allow_nil?: false

      change fn changeset, _context ->
        timer = changeset.data
        changeset
        |> Ash.Changeset.change_attribute(:remaining_seconds, timer.duration_seconds)
        |> Ash.Changeset.change_attribute(:is_running, false)
        |> Ash.Changeset.change_attribute(:is_paused, false)
        |> Ash.Changeset.change_attribute(:started_at, nil)
      end
    end

    read :get_for_user do
      description "Get all timers for a user"

      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc])
    end

    read :get_running_timers do
      description "Get all currently running timers for a user"

      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id) and is_running == true)
      prepare build(sort: [started_at: :asc])
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

    policy action_type(:destroy) do
      authorize_if expr(user_id == ^actor(:id))
    end
  end

  attributes do
    uuid_primary_key :id, public?: true

    attribute :label, :string do
      allow_nil? false
      public? true
      constraints max_length: 100
      description "Display name of the timer"
    end

    attribute :content, :string do
      allow_nil? true
      public? true
      constraints max_length: 2000
      description "Message content to send when timer triggers"
    end

    attribute :duration_seconds, :integer do
      allow_nil? false
      public? true
      constraints min: 1, max: 10800
      description "Original duration of the timer in seconds (max 3 hours)"
    end

    attribute :remaining_seconds, :integer do
      allow_nil? false
      public? true
      default 0
      description "Remaining time in seconds"
    end

    attribute :is_running, :boolean do
      allow_nil? false
      public? true
      default false
      description "Whether the timer is currently running"
    end

    attribute :is_paused, :boolean do
      allow_nil? false
      public? true
      default false
      description "Whether the timer is paused"
    end

    attribute :started_at, :utc_datetime_usec do
      allow_nil? true
      public? true
      description "When the timer was last started"
    end

    timestamps(public?: true)
  end

  relationships do
    belongs_to :user, User do
      allow_nil? false
      attribute_writable? true
      description "The user who owns this timer"
    end
  end
end
