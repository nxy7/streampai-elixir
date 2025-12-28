defmodule Streampai.Integrations.IFTTTWebhook do
  @moduledoc """
  Represents an IFTTT webhook configuration for a user.

  Users can configure IFTTT webhooks to trigger events when various streaming
  events occur. IFTTT's Webhooks service (formerly Maker) allows users to
  connect their stream events to hundreds of other services.

  Each webhook stores the user's IFTTT webhook key and can be configured
  to trigger different IFTTT events for different streaming event types.

  IFTTT webhooks use the endpoint:
  POST https://maker.ifttt.com/trigger/{event}/with/key/{key}

  And can pass up to 3 values (value1, value2, value3) in the request body.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Integrations,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource]

  alias Streampai.Integrations.IFTTT.Client
  alias Streampai.Integrations.IFTTTWebhook

  postgres do
    table "ifttt_webhooks"
    repo Streampai.Repo

    migration_defaults event_types: "nil"

    custom_indexes do
      index [:user_id], name: "idx_ifttt_webhooks_user_id"
      index [:is_enabled], name: "idx_ifttt_webhooks_enabled"
    end
  end

  typescript do
    type_name("IFTTTWebhook")
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
        :webhook_key,
        :event_types,
        :event_name_prefix,
        :is_enabled
      ]

      change relate_actor(:user)
      change set_attribute(:last_tested_at, nil)
    end

    update :update do
      primary? true

      accept [
        :name,
        :webhook_key,
        :event_types,
        :event_name_prefix,
        :is_enabled
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
      description "Sends a test event to the IFTTT webhook"
      argument :id, :uuid, allow_nil?: false

      run fn input, context ->
        with {:ok, webhook} <-
               Ash.get(IFTTTWebhook, input.arguments.id, actor: context.actor),
             {:ok, result} <- Client.send_test_event(webhook) do
          Ash.update(webhook, %{last_tested_at: DateTime.utc_now()}, actor: context.actor)
          {:ok, %{success: true, message: "Test event sent successfully"}}
        else
          {:error, reason} ->
            {:ok, %{success: false, message: "Failed to send test event: #{inspect(reason)}"}}
        end
      end
    end

    action :send_notification, :map do
      description "Sends a notification event to IFTTT for a specific event type"
      argument :id, :uuid, allow_nil?: false
      argument :event_type, :atom, allow_nil?: false
      argument :data, :map, allow_nil?: false

      run fn input, context ->
        with {:ok, webhook} <-
               Ash.get(IFTTTWebhook, input.arguments.id, actor: context.actor),
             true <- input.arguments.event_type in webhook.event_types,
             {:ok, result} <-
               Client.send_event(
                 webhook,
                 input.arguments.event_type,
                 input.arguments.data
               ) do
          {:ok, %{success: true, message: "Event sent successfully"}}
        else
          false ->
            {:ok, %{success: false, message: "Event type not enabled for this webhook"}}

          {:error, reason} ->
            {:ok, %{success: false, message: "Failed to send event: #{inspect(reason)}"}}
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

    policy action_type([:create, :update, :destroy]) do
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

    attribute :webhook_key, :string do
      allow_nil? false
      sensitive? true
      constraints max_length: 100

      description "IFTTT Webhooks key (found at https://ifttt.com/maker_webhooks)"
    end

    attribute :event_name_prefix, :string do
      allow_nil? false
      default "streampai"
      constraints max_length: 50

      description "Prefix for IFTTT event names (e.g., 'streampai' becomes 'streampai_donation')"
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

      description "Types of events that trigger IFTTT webhooks"
    end

    attribute :is_enabled, :boolean do
      allow_nil? false
      default true
      description "Whether this webhook is active"
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
    identity :unique_user_ifttt_webhook_name, [:user_id, :name]
  end
end
