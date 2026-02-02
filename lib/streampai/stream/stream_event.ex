defmodule Streampai.Stream.StreamEvent do
  @moduledoc """
  Base resource for all stream events. Events are stored in a single table
  with type discrimination and JSONB data storage for flexibility.

  This allows for efficient chronological queries across all event types.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  alias Streampai.Stream.EventData.PlatformEventData
  alias Streampai.Types.CoercibleString

  postgres do
    table "stream_events"
    repo Streampai.Repo

    # Add indexes for common query patterns
    custom_indexes do
      # For chronological queries by stream
      index [:livestream_id, :inserted_at],
        name: "idx_stream_events_stream_chrono"

      # For type-specific queries
      index [:livestream_id, :type, :inserted_at],
        name: "idx_stream_events_type_chrono"

      # For user's events across all streams
      index [:user_id, :inserted_at],
        name: "idx_stream_events_user_chrono"

      # For platform-specific queries
      index [:platform, :inserted_at],
        name: "idx_stream_events_platform_chrono"

      # For viewer-specific queries (chronological)
      index [:viewer_id, :inserted_at],
        name: "idx_stream_events_viewer_chrono"
    end
  end

  typescript do
    type_name("StreamEvent")
  end

  code_interface do
    define :create
    define :read
    define :for_stream
    define :by_type
    define :destroy
    define :get_activity_events_for_livestream, args: [:livestream_id]
    define :get_platform_started_for_livestream, args: [:livestream_id]
    define :get_for_viewer, args: [:viewer_id, :user_id]
    define :get_chat_for_user, args: [:user_id, :platform, :date_range]
    define :get_chat_for_livestream, args: [:livestream_id]
    define :get_chat_for_viewer, args: [:viewer_id, :user_id]
    define :upsert
    define :create_stream_updated, args: [:livestream_id, :user_id, :author_id, :metadata]
    define :mark_as_displayed
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [
        :type,
        :data,
        :author_id,
        :livestream_id,
        :user_id,
        :platform,
        :viewer_id
      ]
    end

    read :for_stream do
      description "Get events for a stream"

      argument :livestream_id, :uuid, allow_nil?: false
      argument :limit, :integer, default: 50

      filter expr(livestream_id == ^arg(:livestream_id))
      prepare build(sort: [inserted_at: :desc], limit: arg(:limit))
    end

    read :by_type do
      description "Get events by type for a stream"

      argument :livestream_id, :uuid, allow_nil?: false
      argument :event_type, :atom, allow_nil?: false
      argument :limit, :integer, default: 50

      filter expr(livestream_id == ^arg(:livestream_id) and type == ^arg(:event_type))
      prepare build(sort: [inserted_at: :desc], limit: arg(:limit))
    end

    read :get_activity_events_for_livestream do
      description "Get activity events (donations, follows, raids, etc.) for a livestream"

      argument :livestream_id, :uuid, allow_nil?: false

      filter expr(
               livestream_id == ^arg(:livestream_id) and
                 type in [:donation, :follow, :raid, :cheer, :patreon]
             )

      prepare build(sort: [inserted_at: :asc])
    end

    read :get_platform_started_for_livestream do
      description "Get platform_started events for a livestream to determine which platforms were used"

      argument :livestream_id, :uuid, allow_nil?: false

      filter expr(livestream_id == ^arg(:livestream_id) and type == :platform_started)
    end

    read :get_for_viewer do
      description "Get events for a specific viewer on a user's streams"

      argument :viewer_id, :string, allow_nil?: false
      argument :user_id, :uuid, allow_nil?: false

      filter expr(viewer_id == ^arg(:viewer_id) and user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc], limit: 50)
    end

    read :get_chat_for_user do
      description "Get chat messages for a user with search, platform and date filters"

      argument :user_id, :uuid, allow_nil?: false
      argument :platform, :atom, allow_nil?: true
      argument :date_range, :string, allow_nil?: true
      argument :search, :string, allow_nil?: true

      filter expr(user_id == ^arg(:user_id) and type == :chat_message)
      prepare build(sort: [inserted_at: :desc, id: :desc])

      pagination do
        required? false
        offset? false
        keyset? true
        countable false
        default_limit 20
        max_page_size 100
      end

      prepare fn query, _context ->
        require Ash.Query

        platform = Ash.Query.get_argument(query, :platform)
        date_range = Ash.Query.get_argument(query, :date_range)
        search = Ash.Query.get_argument(query, :search)

        query =
          if platform do
            Ash.Query.filter(query, expr(platform == ^platform))
          else
            query
          end

        query =
          if search && String.trim(search) != "" do
            search_term = String.downcase(search)

            Ash.Query.filter(
              query,
              expr(
                contains(fragment("LOWER(?->>?)", data, "message"), ^search_term) or
                  contains(fragment("LOWER(?->>?)", data, "username"), ^search_term)
              )
            )
          else
            query
          end

        case date_range do
          "7days" ->
            Ash.Query.filter(
              query,
              expr(inserted_at >= ^DateTime.add(DateTime.utc_now(), -7, :day))
            )

          "30days" ->
            Ash.Query.filter(
              query,
              expr(inserted_at >= ^DateTime.add(DateTime.utc_now(), -30, :day))
            )

          "3months" ->
            Ash.Query.filter(
              query,
              expr(inserted_at >= ^DateTime.add(DateTime.utc_now(), -90, :day))
            )

          _ ->
            query
        end
      end
    end

    read :get_chat_for_livestream do
      description "Get chat messages for a livestream, sorted chronologically"

      argument :livestream_id, :uuid, allow_nil?: false

      filter expr(livestream_id == ^arg(:livestream_id) and type == :chat_message)
      prepare build(sort: [inserted_at: :asc])
    end

    read :get_chat_for_viewer do
      description "Get chat messages for a specific viewer on a user's streams"

      argument :viewer_id, :string, allow_nil?: false
      argument :user_id, :uuid, allow_nil?: false

      filter expr(
               viewer_id == ^arg(:viewer_id) and user_id == ^arg(:user_id) and
                 type == :chat_message
             )

      prepare build(sort: [inserted_at: :desc], limit: 50)
    end

    create :upsert do
      accept [
        :type,
        :data,
        :author_id,
        :livestream_id,
        :user_id,
        :platform,
        :viewer_id,
        :inserted_at
      ]

      argument :id, :uuid do
        allow_nil? true
      end

      change set_attribute(:id, arg(:id))

      upsert? true
      upsert_identity :primary_key

      upsert_fields [
        :type,
        :data,
        :author_id,
        :livestream_id,
        :user_id,
        :platform,
        :viewer_id
      ]
    end

    create :create_stream_updated do
      description "Creates a stream_updated event with proper metadata structure"

      argument :livestream_id, :uuid, allow_nil?: false
      argument :user_id, :uuid, allow_nil?: false
      argument :author_id, :string, allow_nil?: false
      argument :metadata, :map, allow_nil?: false

      change set_attribute(:type, :stream_updated)
      change set_attribute(:livestream_id, arg(:livestream_id))
      change set_attribute(:user_id, arg(:user_id))
      change set_attribute(:author_id, arg(:author_id))
      change set_attribute(:platform, nil)

      change fn changeset, _context ->
        metadata = Ash.Changeset.get_argument(changeset, :metadata)

        data = %{
          "type" => "stream_updated",
          "username" => metadata["username"],
          "title" => metadata["title"],
          "description" => metadata["description"],
          "thumbnail_url" => metadata["thumbnail_url"],
          "user" => metadata["user"]
        }

        Ash.Changeset.change_attribute(changeset, :data, data)
      end

      change fn changeset, _context ->
        metadata = Ash.Changeset.get_argument(changeset, :metadata)

        viewer_id =
          get_in(metadata, ["user", "id"]) ||
            Ash.Changeset.get_attribute(changeset, :author_id)

        Ash.Changeset.change_attribute(changeset, :viewer_id, to_string(viewer_id))
      end
    end

    update :update_data do
      description "Update the data field of a stream event"
      accept [:data]
    end

    update :mark_as_displayed do
      description "Mark a stream event as displayed. This is called by OBS browser sources when an alert is shown."

      accept []
      change set_attribute(:was_displayed, true)
    end

    update :replay_alert do
      description "Replays this event on the alertbox by enqueueing it at the front of the alert queue."

      require_atomic? false
      accept []

      change fn changeset, _context ->
        Ash.Changeset.after_action(changeset, fn _changeset, record ->
          alert_event = build_alert_event(record)

          Streampai.LivestreamManager.StreamManager.replay_alert(
            record.user_id,
            alert_event
          )

          {:ok, record}
        end)
      end
    end
  end

  attributes do
    uuid_primary_key :id, public?: true

    attribute :type, Streampai.Stream.EventType do
      public? true
      allow_nil? false
    end

    attribute :data, :union do
      description "Typed event data. Shape depends on event type (union with :map_with_tag storage)."

      public? true
      allow_nil? false

      constraints storage: :map_with_tag,
                  types: [
                    chat_message: [
                      type: Streampai.Stream.EventData.ChatMessageData,
                      tag: :type,
                      tag_value: "chat_message"
                    ],
                    donation: [
                      type: Streampai.Stream.EventData.DonationData,
                      tag: :type,
                      tag_value: "donation"
                    ],
                    follow: [
                      type: Streampai.Stream.EventData.FollowData,
                      tag: :type,
                      tag_value: "follow"
                    ],
                    subscription: [
                      type: Streampai.Stream.EventData.SubscriptionData,
                      tag: :type,
                      tag_value: "subscription"
                    ],
                    raid: [
                      type: Streampai.Stream.EventData.RaidData,
                      tag: :type,
                      tag_value: "raid"
                    ],
                    stream_updated: [
                      type: Streampai.Stream.EventData.StreamUpdatedData,
                      tag: :type,
                      tag_value: "stream_updated"
                    ],
                    platform_started: [
                      type: PlatformEventData,
                      tag: :type,
                      tag_value: "platform_started"
                    ],
                    platform_stopped: [
                      type: PlatformEventData,
                      tag: :type,
                      tag_value: "platform_stopped"
                    ]
                  ]
    end

    attribute :author_id, CoercibleString do
      public? true
      allow_nil? false
    end

    attribute :livestream_id, :uuid do
      public? true
      allow_nil? false
    end

    attribute :user_id, :uuid do
      public? true
      allow_nil? false
    end

    attribute :platform, Streampai.Stream.Platform do
      public? true
      allow_nil? true
    end

    attribute :viewer_id, CoercibleString do
      public? true
    end

    attribute :was_displayed, Streampai.Types.CoercibleBoolean do
      description "Whether this event has been displayed in an overlay/widget"
      public? true
      default false
    end

    attribute :inserted_at, :utc_datetime_usec do
      public? true
      allow_nil? false
      default &DateTime.utc_now/0
    end
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      source_attribute :user_id
      destination_attribute :id
    end

    belongs_to :livestream, Streampai.Stream.Livestream do
      source_attribute :livestream_id
      destination_attribute :id
    end
  end

  identities do
    identity :primary_key, [:id]
  end

  @doc false
  def build_alert_event(record) do
    data = extract_data(record.data)

    %{
      stream_event_id: record.id,
      type: record.type,
      username: data[:username] || data[:donor_name] || data[:raider_name] || "Unknown",
      donor_name: data[:donor_name],
      message: data[:message],
      amount: parse_number(data[:amount]),
      currency: data[:currency],
      platform: record.platform,
      tts_url: data[:tts_url],
      viewer_count: parse_number(data[:viewer_count])
    }
  end

  defp extract_data(%Ash.Union{value: value}) when is_struct(value) do
    Map.from_struct(value)
  end

  defp extract_data(%Ash.Union{value: value}) when is_map(value), do: value
  defp extract_data(data) when is_map(data), do: data
  defp extract_data(_), do: %{}

  defp parse_number(nil), do: nil
  defp parse_number(n) when is_number(n), do: n

  defp parse_number(s) when is_binary(s) do
    case Float.parse(s) do
      {f, _} -> f
      :error -> nil
    end
  end

  defp parse_number(_), do: nil
end
