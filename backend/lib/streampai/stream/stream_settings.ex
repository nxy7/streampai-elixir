defmodule Streampai.Stream.StreamSettings do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    authorizers: [Ash.Policy.Authorizer],
    data_layer: AshPostgres.DataLayer

  postgres do
    table "stream_settings"
    repo Streampai.Repo
  end

  code_interface do
    define :create
    define :read
    define :destroy
    define :get_for_user, action: :get_for_user, args: [:user_id]
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [
        :user_id,
        :title,
        :description,
        :thumbnail_url,
        :tags,
        :visibility,
        :enabled_platforms
      ]

      change set_attribute(:user_id, actor(:id))

      upsert? true
      upsert_identity :unique_user_settings
    end

    read :get_for_user do
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id))
    end
  end

  policies do
    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action_type([:create]) do
      authorize_if expr(^actor(:role) == :admin)
      authorize_if actor_present()
    end

    policy action_type([:update, :destroy]) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end
  end

  attributes do
    attribute :user_id, :uuid do
      allow_nil? false
      primary_key? true
    end

    attribute :title, :string do
      allow_nil? true
      constraints max_length: 500, min_length: 3
    end

    attribute :description, :string do
      allow_nil? true
      constraints max_length: 5000
    end

    attribute :thumbnail_url, :string do
      allow_nil? true
      constraints max_length: 1000
    end

    attribute :tags, {:array, :string} do
      allow_nil? true
      default []
      constraints items: [max_length: 50], max_length: 20
    end

    attribute :visibility, :atom do
      allow_nil? false
      default :public
      constraints one_of: [:public, :unlisted]
    end

    attribute :enabled_platforms, {:array, Streampai.Stream.Platform} do
      allow_nil? false
      default []
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      destination_attribute :id
      allow_nil? false
    end
  end

  identities do
    identity :unique_user_settings, [:user_id]
  end
end
