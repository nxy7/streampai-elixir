defmodule Streampai.Notifications.NotificationRead do
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
    table "notification_reads"
    repo Streampai.Repo
  end

  graphql do
    type :notification_read
  end

  code_interface do
    define :create
    define :read
    define :mark_as_read
    define :mark_as_unread
    define :list_for_user, args: [:user_id]
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:user_id, :notification_id]
      primary? true
    end

    create :mark_as_read do
      description "Mark a notification as read for a user"
      accept [:notification_id]

      change set_attribute(:user_id, actor(:id))
      change set_attribute(:seen_at, &DateTime.utc_now/0)

      upsert? true
      upsert_identity :user_notification_unique
    end

    read :list_for_user do
      description "Get all read notifications for a user"
      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
    end

    action :mark_as_unread, :map do
      description "Mark a notification as unread for the current user"
      argument :notification_id, :uuid, allow_nil?: false

      run fn input, context ->
        actor = context.actor

        case Ash.get(__MODULE__, %{user_id: actor.id, notification_id: input.arguments.notification_id}, actor: actor) do
          {:ok, record} ->
            case Ash.destroy(record, actor: actor) do
              :ok -> {:ok, %{notification_id: input.arguments.notification_id, user_id: actor.id}}
              {:error, error} -> {:error, error}
            end

          {:error, %Ash.Error.Query.NotFound{}} ->
            {:ok, %{notification_id: input.arguments.notification_id, user_id: actor.id}}

          {:error, error} ->
            {:error, error}
        end
      end
    end
  end

  policies do
    policy action(:read) do
      authorize_if actor_present()
    end

    policy action(:list_for_user) do
      authorize_if actor_present()
    end

    policy action(:mark_as_read) do
      authorize_if actor_present()
    end

    policy action(:mark_as_unread) do
      authorize_if actor_present()
    end

    policy action(:create) do
      authorize_if actor_present()
    end

    policy action(:destroy) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end
  end

  attributes do
    attribute :user_id, :uuid do
      allow_nil? false
      public? true
      primary_key? true
    end

    attribute :notification_id, :uuid do
      allow_nil? false
      public? true
      primary_key? true
    end

    attribute :seen_at, :utc_datetime_usec do
      allow_nil? false
      public? true
      default &DateTime.utc_now/0
    end
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      public? true
      attribute_writable? true
      define_attribute? false
    end

    belongs_to :notification, Streampai.Notifications.Notification do
      allow_nil? false
      public? true
      attribute_writable? true
      define_attribute? false
    end
  end

  identities do
    identity :user_notification_unique, [:user_id, :notification_id]
  end
end
