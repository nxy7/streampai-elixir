defmodule Streampai.Stream.ChatMessage do
  @moduledoc """
  Represents a chat message from a streaming platform.

  ChatMessages are linked to both users (the streamer) and optionally to viewers
  (the person who sent the message). This allows tracking chat activity across
  different platforms and linking messages to specific viewer identities.

  ## Key Features
  - Platform-agnostic message storage
  - Optional viewer linking for identity management
  - Moderator and subscription status tracking
  - Upsert capabilities for message deduplication
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  postgres do
    table "chat_messages"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id], name: "idx_chat_messages_user_id"
      index [:livestream_id], name: "idx_chat_messages_livestream_id"
      index [:inserted_at], name: "idx_chat_messages_inserted_at"
      index [:livestream_id, :inserted_at], name: "idx_chat_messages_stream_chrono"
    end
  end

  typescript do
    type_name("ChatMessage")
  end

  code_interface do
    define :upsert
    define :create
    define :read
    define :get_for_livestream, args: [:livestream_id]
    define :get_for_user, args: [:user_id, :platform, :date_range]
    define :get_for_viewer, args: [:viewer_id, :user_id]
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      primary? true

      accept [
        :id,
        :message,
        :sender_username,
        :platform,
        :sender_channel_id,
        :sender_is_moderator,
        :sender_is_patreon,
        :user_id,
        :livestream_id,
        :viewer_id
      ]
    end

    create :upsert do
      accept [
        :id,
        :message,
        :sender_username,
        :platform,
        :sender_channel_id,
        :sender_is_moderator,
        :sender_is_patreon,
        :user_id,
        :livestream_id,
        :viewer_id
      ]

      upsert? true
      upsert_identity :primary_key

      upsert_fields [
        :message,
        :sender_username,
        :platform,
        :sender_channel_id,
        :sender_is_moderator,
        :sender_is_patreon,
        :user_id,
        :livestream_id,
        :viewer_id
      ]
    end

    read :get_for_livestream do
      description "Get all chat messages for a livestream, sorted chronologically"

      argument :livestream_id, :uuid, allow_nil?: false

      filter expr(livestream_id == ^arg(:livestream_id))
      prepare build(sort: [inserted_at: :asc])
    end

    read :get_count_for_livestream do
      description "Count chat messages for a livestream"

      argument :livestream_id, :uuid, allow_nil?: false

      filter expr(livestream_id == ^arg(:livestream_id))
    end

    read :get_for_user do
      description "Get chat messages for a user across all livestreams, with optional platform and date range filters"

      argument :user_id, :uuid, allow_nil?: false
      argument :platform, :atom, allow_nil?: true
      argument :date_range, :string, allow_nil?: true
      argument :search, :string, allow_nil?: true

      filter expr(user_id == ^arg(:user_id))

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
                contains(fragment("LOWER(?)", message), ^search_term) or
                  contains(fragment("LOWER(?)", sender_username), ^search_term)
              )
            )
          else
            query
          end

        case date_range do
          "7days" ->
            cutoff = DateTime.add(DateTime.utc_now(), -7, :day)
            Ash.Query.filter(query, expr(inserted_at >= ^cutoff))

          "30days" ->
            cutoff = DateTime.add(DateTime.utc_now(), -30, :day)
            Ash.Query.filter(query, expr(inserted_at >= ^cutoff))

          "3months" ->
            cutoff = DateTime.add(DateTime.utc_now(), -90, :day)
            Ash.Query.filter(query, expr(inserted_at >= ^cutoff))

          _ ->
            query
        end
      end
    end

    read :get_for_viewer do
      description "Get chat messages for a specific viewer on a user's streams"

      argument :viewer_id, :string, allow_nil?: false
      argument :user_id, :uuid, allow_nil?: false

      filter expr(viewer_id == ^arg(:viewer_id) and user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc], limit: 50)
    end
  end

  attributes do
    attribute :id, :string do
      primary_key? true
      allow_nil? false
      public? true
    end

    attribute :message, :string do
      allow_nil? false
      public? true
      constraints max_length: 500
    end

    attribute :platform, Streampai.Stream.Platform do
      allow_nil? false
      public? true
    end

    attribute :sender_username, :string do
      allow_nil? false
      public? true
      constraints max_length: 100
    end

    attribute :sender_channel_id, :string do
      allow_nil? false
      public? true
    end

    attribute :sender_is_moderator, :boolean do
      default false
      public? true
    end

    attribute :sender_is_patreon, :boolean do
      default false
      public? true
    end

    attribute :inserted_at, :utc_datetime_usec do
      allow_nil? false
      public? true
      default &DateTime.utc_now/0
    end

    attribute :viewer_id, :string do
      public? true
    end
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
      public? true
    end

    belongs_to :livestream, Streampai.Stream.Livestream do
      allow_nil? false
      attribute_writable? true
      public? true
    end
  end

  identities do
    identity :primary_key, [:id]
  end
end
