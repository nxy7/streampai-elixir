defmodule Streampai.Stream.ChatMessage do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "chat_messages"
    repo Streampai.Repo
  end

  actions do
    defaults [:read, :destroy, create: :*, update: :*]

    create :create_batch do
      accept [
        :id,
        :message,
        :username,
        :platform,
        :channel_id,
        :is_moderator,
        :is_patreon,
        :user_id,
        :livestream_id
      ]

      upsert? true
      upsert_identity :primary_key

      upsert_fields [
        :message,
        :username,
        :platform,
        :channel_id,
        :is_moderator,
        :is_patreon,
        :user_id,
        :livestream_id
      ]
    end

    create :bulk_create do
      accept [
        :id,
        :message,
        :username,
        :platform,
        :channel_id,
        :is_moderator,
        :is_patreon,
        :user_id,
        :livestream_id
      ]

      primary? false
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

    attribute :username, :string do
      allow_nil? false
      constraints max_length: 100
    end

    attribute :channel_id, :string do
      allow_nil? false
    end

    attribute :is_moderator, :boolean do
      default false
    end

    attribute :is_patreon, :boolean do
      default false
    end

    timestamps()
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
