defmodule Streampai.Stream.HighlightedMessage do
  @moduledoc """
  Represents a highlighted chat message that the streamer wants to display prominently.

  Only one message can be highlighted per user at a time. When a new message is highlighted,
  the previous highlight is automatically cleared. The widget syncs this data via Electric SQL
  to display the highlighted message on stream.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  postgres do
    table "highlighted_messages"
    repo Streampai.Repo

    custom_indexes do
      index [:user_id], unique: true, name: "idx_highlighted_messages_user_id_unique"
    end
  end

  typescript do
    type_name("HighlightedMessage")
  end

  code_interface do
    define :highlight_message
    define :clear_highlight
    define :get_for_user, args: [:user_id]
  end

  actions do
    defaults [:read, :destroy]

    create :highlight_message do
      description "Highlight a chat message. Clears any existing highlight for the user."

      accept [
        :chat_message_id,
        :message,
        :sender_username,
        :sender_channel_id,
        :platform,
        :viewer_id
      ]

      argument :user_id, :uuid, allow_nil?: false

      change set_attribute(:user_id, arg(:user_id))

      # Upsert to replace existing highlight
      upsert? true
      upsert_identity :unique_user

      upsert_fields [
        :chat_message_id,
        :message,
        :sender_username,
        :sender_channel_id,
        :platform,
        :viewer_id,
        :highlighted_at
      ]

      change set_attribute(:highlighted_at, &DateTime.utc_now/0)
    end

    action :clear_highlight, :boolean do
      description "Clear the highlighted message for a user"

      argument :user_id, :uuid, allow_nil?: false

      run fn input, _context ->
        require Ash.Query

        query = Ash.Query.filter(__MODULE__, user_id == ^input.arguments.user_id)

        case Ash.read(query) do
          {:ok, [highlight]} ->
            case Ash.destroy(highlight) do
              :ok -> {:ok, true}
              {:error, error} -> {:error, error}
            end

          {:ok, []} ->
            {:ok, false}

          {:error, error} ->
            {:error, error}
        end
      end
    end

    read :get_for_user do
      description "Get the currently highlighted message for a user"

      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))

      prepare build(limit: 1)
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :chat_message_id, :string do
      allow_nil? false
      public? true
      description "The ID of the original chat message"
    end

    attribute :message, :string do
      allow_nil? false
      public? true
      constraints max_length: 500
      description "The message content"
    end

    attribute :sender_username, :string do
      allow_nil? false
      public? true
      constraints max_length: 100
      description "Username of the message sender"
    end

    attribute :sender_channel_id, :string do
      allow_nil? false
      public? true
      description "Platform-specific channel ID of the sender"
    end

    attribute :platform, Streampai.Stream.Platform do
      allow_nil? false
      public? true
      description "Platform the message came from"
    end

    attribute :viewer_id, :string do
      public? true
      description "Optional viewer ID for identity linking"
    end

    attribute :highlighted_at, :utc_datetime_usec do
      allow_nil? false
      public? true
      default &DateTime.utc_now/0
      description "When the message was highlighted"
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
      public? true
      description "The streamer who highlighted this message"
    end
  end

  identities do
    identity :unique_user, [:user_id], pre_check_with: Streampai.Stream
  end
end
