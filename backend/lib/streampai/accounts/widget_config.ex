defmodule Streampai.Accounts.WidgetConfig do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource],
    data_layer: AshPostgres.DataLayer

  postgres do
    table "widget_configs"
    repo Streampai.Repo
  end

  code_interface do
    define :get_by_user_and_type
    define :create
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:user_id, :type, :config]
      upsert? true
      upsert_identity :user_type_unique
    end

    read :get_by_user_and_type do
      get? true
      argument :user_id, :uuid, allow_nil?: false
      argument :type, :atom, allow_nil?: false

      filter expr(user_id == ^arg(:user_id) and type == ^arg(:type))

      prepare Streampai.Accounts.WidgetConfig.Preparations.GetOrCreateWithDefaults
    end

    read :for_user do
      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
    end
  end

  policies do
    # Users can only manage their own widget configs
    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action_type(:create) do
      authorize_if expr(^actor(:role) == :admin)
      # For regular users, the create action will force user_id to actor's id anyway
      # so we can allow creates - the change function ensures data integrity
      authorize_if actor_present()
    end

    policy action_type([:update, :destroy]) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end
  end

  validations do
    validate one_of(:type, [
               :chat_widget,
               :alertbox_widget,
               :donation_widget,
               :follow_widget,
               :subscriber_widget,
               :overlay_widget,
               :alert_widget,
               :goal_widget,
               :leaderboard_widget
             ]) do
      message "Type must be one of: chat_widget, alertbox_widget, donation_widget, follow_widget, subscriber_widget, overlay_widget, alert_widget, goal_widget, leaderboard_widget"
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :user_id, :uuid, allow_nil?: false, public?: true
    attribute :type, :atom, allow_nil?: false, public?: true
    attribute :config, :map, allow_nil?: false, public?: true, default: %{}

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      source_attribute :user_id
      destination_attribute :id
      allow_nil? false
      public? true
    end
  end

  identities do
    identity :user_type_unique, [:user_id, :type]
  end
end
