defmodule Streampai.Integrations.DiscordWebhook do
  @moduledoc """
  Represents a Discord webhook configuration for a user.

  Users can configure Discord webhooks to receive notifications for various events
  such as new donations, stream starting/stopping, new followers, etc.

  Each webhook can be configured to listen for specific event types, allowing
  granular control over which notifications are sent to which Discord channels.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Integrations,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource]

  alias Streampai.Integrations.Discord.Client
  alias Streampai.Integrations.DiscordWebhook

  postgres do
    table "discord_webhooks"
    repo Streampai.Repo

    migration_defaults event_types: "nil"

    custom_indexes do
      index [:user_id], name: "idx_discord_webhooks_user_id"
      index [:is_enabled], name: "idx_discord_webhooks_enabled"
    end
  end

  typescript do
    type_name("DiscordWebhook")
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :get_by_id, args: [:id]
    define :get_by_user, args: [:user_id]
    define :get_enabled_by_user, args: [:user_id]
    define :test_webhook, args: [:id]
    define :send_notification, args: [:id, :event_type, :data]
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true

      accept [
        :name,
        :webhook_url,
        :event_types,
        :is_enabled,
        :include_amount,
        :include_message,
        :custom_template
      ]

      change relate_actor(:user)
      change set_attribute(:last_tested_at, nil)
    end

    update :update do
      primary? true

      accept [
        :name,
        :webhook_url,
        :event_types,
        :is_enabled,
        :include_amount,
        :include_message,
        :custom_template
      ]
    end

    update :record_delivery_success do
      description "Internal action to record successful delivery"

      accept [
        :successful_deliveries,
        :last_error,
        :last_error_at
      ]
    end

    update :record_delivery_failure do
      description "Internal action to record failed delivery"

      accept [
        :failed_deliveries,
        :last_error,
        :last_error_at
      ]
    end

    update :record_test do
      description "Internal action to record webhook test"
      accept [:last_tested_at]
    end

    read :get_by_id do
      argument :id, :uuid, allow_nil?: false
      get? true
      filter expr(id == ^arg(:id))
    end

    read :get_by_user do
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc])
    end

    read :get_enabled_by_user do
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id) and is_enabled == true)
      prepare build(sort: [inserted_at: :desc])
    end

    action :test_webhook, :map do
      description "Sends a test message to the Discord webhook"
      argument :id, :uuid, allow_nil?: false

      run fn input, context ->
        with {:ok, webhook} <-
               Ash.get(DiscordWebhook, input.arguments.id, actor: context.actor),
             {:ok, result} <- Client.send_test_message(webhook) do
          # Update last_tested_at
          Ash.update(webhook, %{last_tested_at: DateTime.utc_now()}, actor: context.actor)
          {:ok, %{success: true, message: "Test message sent successfully"}}
        else
          {:error, reason} ->
            {:ok, %{success: false, message: "Failed to send test message: #{inspect(reason)}"}}
        end
      end
    end

    action :send_notification, :map do
      description "Sends a notification to the Discord webhook for a specific event"
      argument :id, :uuid, allow_nil?: false
      argument :event_type, :atom, allow_nil?: false
      argument :data, :map, allow_nil?: false

      run fn input, context ->
        with {:ok, webhook} <-
               Ash.get(DiscordWebhook, input.arguments.id, actor: context.actor),
             true <- input.arguments.event_type in webhook.event_types,
             {:ok, result} <-
               Client.send_notification(
                 webhook,
                 input.arguments.event_type,
                 input.arguments.data
               ) do
          {:ok, %{success: true, message: "Notification sent successfully"}}
        else
          false ->
            {:ok, %{success: false, message: "Event type not enabled for this webhook"}}

          {:error, reason} ->
            {:ok, %{success: false, message: "Failed to send notification: #{inspect(reason)}"}}
        end
      end
    end
  end

  policies do
    bypass Streampai.SystemActor.Check do
      authorize_if always()
    end

    bypass actor_attribute_equals(:is_admin, true) do
      authorize_if always()
    end

    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type(:create) do
      authorize_if actor_present()
    end

    policy action_type([:update, :destroy]) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action([:test_webhook, :send_notification]) do
      authorize_if actor_present()
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :name, :string do
      allow_nil? false
      constraints max_length: 100
      description "User-friendly name for this webhook configuration"
    end

    attribute :webhook_url, :string do
      allow_nil? false
      sensitive? true
      constraints max_length: 500

      description "Discord webhook URL (https://discord.com/api/webhooks/...)"
    end

    attribute :event_types, {:array, :atom} do
      allow_nil? false
      default [:donation]

      constraints items: [
                    one_of: [
                      :donation,
                      :stream_start,
                      :stream_end,
                      :new_follower,
                      :new_subscriber,
                      :raid,
                      :host,
                      :chat_message,
                      :poll_created,
                      :poll_ended,
                      :giveaway_started,
                      :giveaway_ended
                    ]
                  ]

      description "Types of events that trigger notifications to this webhook"
    end

    attribute :is_enabled, :boolean do
      allow_nil? false
      default true
      description "Whether this webhook is active"
    end

    attribute :include_amount, :boolean do
      allow_nil? false
      default true
      description "Include donation amount in notifications (for donation events)"
    end

    attribute :include_message, :boolean do
      allow_nil? false
      default true
      description "Include donor message in notifications (for donation events)"
    end

    attribute :custom_template, :map do
      allow_nil? true

      description "Custom Discord embed template (overrides default formatting)"
    end

    attribute :last_tested_at, :utc_datetime_usec do
      allow_nil? true
      description "When the webhook was last tested"
    end

    attribute :last_error, :string do
      allow_nil? true
      constraints max_length: 1000
      description "Last error message if webhook delivery failed"
    end

    attribute :last_error_at, :utc_datetime_usec do
      allow_nil? true
      description "When the last error occurred"
    end

    attribute :successful_deliveries, :integer do
      allow_nil? false
      default 0
      description "Count of successful webhook deliveries"
    end

    attribute :failed_deliveries, :integer do
      allow_nil? false
      default 0
      description "Count of failed webhook deliveries"
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
      description "The user who owns this webhook configuration"
    end
  end

  identities do
    identity :unique_user_webhook_name, [:user_id, :name]
  end
end
