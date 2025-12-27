defmodule Streampai.Notifications.NotificationLocalization do
  @moduledoc """
  Stores localized content for notifications.

  Each notification can have multiple localizations, one per locale.
  The `content` field in Notification serves as the default (English) content.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Notifications,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource, AshTypescript.Resource],
    data_layer: AshPostgres.DataLayer

  admin do
    actor? true
  end

  postgres do
    table "notification_localizations"
    repo Streampai.Repo
  end

  typescript do
    type_name("NotificationLocalization")
  end

  code_interface do
    define :create
    define :read
    define :destroy
    define :list_for_notification, args: [:notification_id]
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:notification_id, :locale, :content]
      primary? true
    end

    read :list_for_notification do
      description "Get all localizations for a notification"
      argument :notification_id, :uuid, allow_nil?: false

      filter expr(notification_id == ^arg(:notification_id))
    end
  end

  policies do
    policy action(:read) do
      authorize_if actor_present()
    end

    policy action(:list_for_notification) do
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

    attribute :notification_id, :uuid do
      allow_nil? false
      public? true
    end

    attribute :locale, :string do
      allow_nil? false
      public? true
      description "Language code (e.g., 'de', 'pl', 'es')"
    end

    attribute :content, :string do
      allow_nil? false
      public? true
      description "Localized notification content"
    end

    create_timestamp :inserted_at, public?: true
  end

  relationships do
    belongs_to :notification, Streampai.Notifications.Notification do
      allow_nil? false
      public? true
      attribute_writable? true
      define_attribute? false
    end
  end

  identities do
    identity :notification_locale_unique, [:notification_id, :locale]
  end
end
