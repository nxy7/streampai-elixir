defmodule Streampai.Notifications.Notification do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Notifications,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource, AshTypescript.Resource],
    data_layer: AshPostgres.DataLayer

  alias Streampai.Notifications.NotificationLocalization

  admin do
    actor? true
  end

  postgres do
    table "notifications"
    repo Streampai.Repo
  end

  typescript do
    type_name("Notification")
  end

  code_interface do
    define :create
    define :create_with_localizations
    define :read
    define :list_for_user, args: [:user_id]
    define :list_global
  end

  actions do
    defaults [:read]

    destroy :destroy do
      primary? true
      require_atomic? false
      change Streampai.Notifications.Notification.Changes.DeleteReads
    end

    create :create do
      accept [:user_id, :content]
      primary? true
    end

    create :create_with_localizations do
      description "Create a notification with optional localizations"
      accept [:user_id, :content]

      argument :localizations, {:array, :map} do
        allow_nil? true
        default []
        description "Array of {locale, content} pairs for translations"
      end

      change after_action(fn changeset, notification, context ->
               localizations = Ash.Changeset.get_argument(changeset, :localizations) || []

               case create_localizations(notification, localizations, context.actor) do
                 :ok -> {:ok, notification}
                 {:error, error} -> {:error, error}
               end
             end)
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

    policy action([:create, :create_with_localizations]) do
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

    has_many :localizations, NotificationLocalization do
      public? true
    end
  end

  defp create_localizations(_notification, [], _actor), do: :ok

  defp create_localizations(notification, localizations, actor) do
    # Ensure the actor has role loaded for policy checks
    actor =
      case actor do
        %{role: %Ash.NotLoaded{}} ->
          case Ash.load(actor, [:role]) do
            {:ok, loaded_actor} -> loaded_actor
            _ -> actor
          end

        _ ->
          actor
      end

    Enum.reduce_while(localizations, :ok, fn localization, _acc ->
      locale = localization["locale"] || localization[:locale]
      content = localization["content"] || localization[:content]

      if locale && content do
        case NotificationLocalization
             |> Ash.Changeset.for_create(:create, %{
               notification_id: notification.id,
               locale: locale,
               content: content
             })
             |> Ash.create(actor: actor) do
          {:ok, _} -> {:cont, :ok}
          {:error, error} -> {:halt, {:error, error}}
        end
      else
        {:cont, :ok}
      end
    end)
  end
end
