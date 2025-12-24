defmodule Streampai.Notifications.Notification do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Notifications,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource, AshGraphql.Resource],
    data_layer: AshPostgres.DataLayer

  admin do
    actor? true
  end

  postgres do
    table "notifications"
    repo Streampai.Repo
  end

  graphql do
    type :notification
  end

  code_interface do
    define :create
    define :read
    define :list_for_user, args: [:user_id]
    define :list_global
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:user_id, :content]
      primary? true
    end

    read :list_for_user do
      description "Get notifications for a specific user (user-specific + global)"
      argument :user_id, :uuid, allow_nil?: false

      filter expr(is_nil(user_id) or user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc])
    end

    read :list_global do
      description "Get only global notifications (user_id is NULL)"
      filter expr(is_nil(user_id))
      prepare build(sort: [inserted_at: :desc])
    end
  end

  policies do
    policy action(:read) do
      authorize_if actor_present()
    end

    policy action(:list_for_user) do
      authorize_if actor_present()
    end

    policy action(:list_global) do
      authorize_if actor_present()
    end

    policy action(:create) do
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action(:destroy) do
      authorize_if expr(^actor(:role) == :admin)
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :user_id, :uuid do
      allow_nil? true
      public? true
      description "NULL for global notifications, set for user-specific"
    end

    attribute :content, :string do
      allow_nil? false
      public? true
    end

    create_timestamp :inserted_at, public?: true
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? true
      public? true
      attribute_writable? true
    end

    has_many :reads, Streampai.Notifications.NotificationRead do
      public? true
    end
  end
end
