defmodule Streampai.Stream.StreamTimer do
  @moduledoc """
  Represents a recurring timer that sends messages at intervals during a stream.

  Timers are purely configurational — they store the message content and interval.
  Fire times are computed at runtime from the stream's `started_at` timestamp:

    next_fire = stream_started_at + ceil(elapsed / interval_seconds) * interval_seconds

  The `StreamTimerServer` GenServer runs only during active livestreams,
  computes fire times, and sends chat messages via `StreamManager.send_chat_message/2`.

  ## Fields
  - `label` — display name
  - `content` — message to send when timer fires
  - `interval_seconds` — how often to send (30s–3h)
  - `disabled_at` — when set, the timer is disabled and won't fire
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
      index [:user_id, :disabled_at], name: "idx_stream_timers_user_disabled"
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
    define :enable_timer, args: [:id]
    define :disable_timer, args: [:id]
    define :get_for_user, args: [:user_id]
    define :get_enabled_for_user, args: [:user_id]
  end

  actions do
    defaults [:read]

    destroy :destroy do
      primary? true
      require_atomic? false

      change after_action(fn _changeset, record, _context ->
               broadcast_change(record.user_id)
               {:ok, record}
             end)
    end

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

      change after_action(fn _changeset, record, _context ->
               broadcast_change(record.user_id)
               {:ok, record}
             end)
    end

    update :update do
      primary? true
      require_atomic? false
      accept [:label, :content, :interval_seconds]

      change after_action(fn _changeset, record, _context ->
               broadcast_change(record.user_id)
               {:ok, record}
             end)
    end

    update :enable_timer do
      description "Enable the timer (clear disabled_at)"
      argument :id, :uuid, allow_nil?: false

      require_atomic? false
      change set_attribute(:disabled_at, nil)

      change after_action(fn _changeset, record, _context ->
               broadcast_change(record.user_id)
               {:ok, record}
             end)
    end

    update :disable_timer do
      description "Disable the timer (set disabled_at to now)"
      require_atomic? false

      argument :id, :uuid, allow_nil?: false

      change fn changeset, _context ->
        Ash.Changeset.change_attribute(changeset, :disabled_at, DateTime.utc_now())
      end

      change after_action(fn _changeset, record, _context ->
               broadcast_change(record.user_id)
               {:ok, record}
             end)
    end

    read :get_for_user do
      description "Get all timers for a user"

      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc])
    end

    read :get_enabled_for_user do
      description "Get all enabled timers for a user"

      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id) and is_nil(disabled_at))
      prepare build(sort: [inserted_at: :desc])
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

    attribute :disabled_at, :utc_datetime_usec do
      allow_nil? true
      public? true
      default nil
      description "When set, the timer is disabled and won't fire during streams"
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

  # Broadcast timer config changes so StreamTimerServer can react
  defp broadcast_change(user_id) do
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "stream_timers:#{user_id}",
      :timers_changed
    )
  end
end
