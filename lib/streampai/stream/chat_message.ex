defmodule Streampai.Stream.ChatMessage do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

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

  code_interface do
    define :upsert
  end

  actions do
    defaults [:read, :destroy, create: :*, update: :*]

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
        :livestream_id
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
        :livestream_id
      ]
    end
  end

  attributes do
    attribute :id, :string, primary_key?: true, allow_nil?: false

    attribute :message, :string do
      allow_nil? false
      constraints max_length: 500
    end

    attribute :platform, Streampai.Stream.Platform do
      allow_nil? false
    end

    attribute :sender_username, :string do
      allow_nil? false
      constraints max_length: 100
    end

    attribute :sender_channel_id, :string do
      allow_nil? false
    end

    attribute :sender_is_moderator, :boolean do
      default false
    end

    attribute :sender_is_patreon, :boolean do
      default false
    end

    attribute :inserted_at, :utc_datetime_usec do
      allow_nil? false
      default &DateTime.utc_now/0
    end
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
    end

    belongs_to :livestream, Streampai.Stream.Livestream do
      allow_nil? false
      attribute_writable? true
    end
  end

  identities do
    identity :primary_key, [:id]
  end
end
