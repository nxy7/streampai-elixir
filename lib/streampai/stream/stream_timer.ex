defmodule Streampai.Stream.StreamTimer do
  @moduledoc """
  Represents a recurring timer that sends messages at intervals during a stream.

  Timers are used by streamers to:
  - Send periodic messages to chat (e.g., reminders, promotions, social links)
  - Automate recurring announcements at set intervals

  ## How it works
  - `interval_seconds` defines how often the message should be sent
  - `next_fire_at` tracks when the next message will be sent
  - `is_active` controls whether the timer is currently running

  The Elixir actor process (StreamTimerActor) periodically checks active timers
  and sends messages when `next_fire_at` is reached, then updates it to the next interval.
  This approach prevents time drift and avoids constant DB updates for remaining time.
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
      index [:user_id, :is_active], name: "idx_stream_timers_user_active"
      index [:is_active, :next_fire_at], name: "idx_stream_timers_active_next_fire"
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
    define :create_timer, args: [:label, :content, :interval_seconds]
    define :start_timer, args: [:id]
    define :stop_timer, args: [:id]
    define :get_for_user, args: [:user_id]
    define :get_active_timers
    define :mark_fired, args: [:id]
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
        allow_nil? false
        constraints max_length: 2000
      end

      argument :interval_seconds, :integer do
        allow_nil? false
        constraints min: 30, max: 10_800
      end

      change set_attribute(:user_id, actor(:id))
      change set_attribute(:label, arg(:label))
      change set_attribute(:content, arg(:content))
      change set_attribute(:interval_seconds, arg(:interval_seconds))
      change set_attribute(:is_active, false)
    end

    update :update do
      primary? true
      accept [:label, :content, :interval_seconds]
    end

    update :start_timer do
      description "Start the timer - sets next_fire_at to now + interval"
      require_atomic? false

      argument :id, :uuid, allow_nil?: false

      change fn changeset, _context ->
        timer = changeset.data
        next_fire = DateTime.add(DateTime.utc_now(), timer.interval_seconds, :second)

        changeset
        |> Ash.Changeset.change_attribute(:is_active, true)
        |> Ash.Changeset.change_attribute(:next_fire_at, next_fire)
      end
    end

    update :stop_timer do
      description "Stop the timer"
      require_atomic? false

      argument :id, :uuid, allow_nil?: false

      change set_attribute(:is_active, false)
      change set_attribute(:next_fire_at, nil)
    end

    update :mark_fired do
      description "Called by actor after sending message - updates next_fire_at"
      require_atomic? false

      argument :id, :uuid, allow_nil?: false

      change fn changeset, _context ->
        timer = changeset.data
        next_fire = DateTime.add(DateTime.utc_now(), timer.interval_seconds, :second)

        Ash.Changeset.change_attribute(changeset, :next_fire_at, next_fire)
      end
    end

    read :get_for_user do
      description "Get all timers for a user"

      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc])
    end

    read :get_active_timers do
      description "Get all active timers that need to fire (for the actor)"

      filter expr(is_active == true and next_fire_at <= ^DateTime.utc_now())
      prepare build(sort: [next_fire_at: :asc])
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

    # Allow the system to read active timers without actor
    policy action(:get_active_timers) do
      authorize_if always()
    end

    policy action(:mark_fired) do
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

    attribute :label, :string do
      allow_nil? false
      public? true
      constraints max_length: 100
      description "Display name of the timer"
    end

    attribute :content, :string do
      allow_nil? false
      public? true
      constraints max_length: 2000
      description "Message content to send when timer fires"
    end

    attribute :interval_seconds, :integer do
      allow_nil? false
      public? true
      constraints min: 30, max: 10_800
      description "Interval between messages in seconds (min 30s, max 3 hours)"
    end

    attribute :is_active, :boolean do
      allow_nil? false
      public? true
      default false
      description "Whether the timer is currently active"
    end

    attribute :next_fire_at, :utc_datetime_usec do
      allow_nil? true
      public? true
      description "When the next message should be sent"
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
