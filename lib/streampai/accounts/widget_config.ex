defmodule Streampai.Accounts.WidgetConfig do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource, AshGraphql.Resource],
    data_layer: AshPostgres.DataLayer

  alias Streampai.Accounts.WidgetConfigDefaults

  postgres do
    table "widget_configs"
    repo Streampai.Repo
  end

  graphql do
    type :widget_config

    queries do
      read_one :widget_config, :get_by_user_and_type
    end

    mutations do
      create :save_widget_config, :create
    end
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

      change Streampai.Accounts.WidgetConfig.Changes.AtomizeConfigKeys
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

  changes do
    change fn changeset, _opts ->
             # Ensure user_id is set to actor's id for security
             case changeset.context[:actor] do
               %{id: actor_id} when not is_nil(actor_id) ->
                 Ash.Changeset.force_change_attribute(changeset, :user_id, actor_id)

               _ ->
                 changeset
             end
           end,
           on: [:create]
  end

  validations do
    validate one_of(:type, [
               :placeholder_widget,
               :chat_widget,
               :alertbox_widget,
               :viewer_count_widget,
               :follower_count_widget,
               :donation_widget,
               :donation_goal_widget,
               :top_donors_widget,
               :follow_widget,
               :subscriber_widget,
               :overlay_widget,
               :alert_widget,
               :goal_widget,
               :leaderboard_widget,
               :timer_widget,
               :poll_widget,
               :slider_widget,
               :giveaway_widget,
               :eventlist_widget
             ])

    validate present([:user_id])
    validate present([:config])
    validate Streampai.Accounts.WidgetConfig.Validations.ConfigStructure
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

  # Helper functions

  @doc """
  Gets default configuration for a specific widget type.
  """
  def get_default_config(widget_type) do
    WidgetConfigDefaults.get_default_config(widget_type)
  end

  @doc """
  Validates if a config map has all required keys for the widget type.
  """
  def valid_config?(widget_type, config) when is_map(config) do
    required_keys = get_required_config_keys(widget_type)
    has_all_keys = Enum.all?(required_keys, &Map.has_key?(config, &1))

    has_all_keys and valid_config_values?(widget_type, config)
  end

  def valid_config?(_, _), do: false

  @doc """
  Gets required configuration keys for a widget type.
  """
  def get_required_config_keys(widget_type) do
    WidgetConfigDefaults.get_required_config_keys(widget_type)
  end

  defp valid_config_values?(:chat_widget, config), do: valid_chat_config_values?(config)
  defp valid_config_values?(:alertbox_widget, config), do: valid_alertbox_config_values?(config)

  defp valid_config_values?(:viewer_count_widget, config), do: valid_viewer_count_config_values?(config)

  defp valid_config_values?(:top_donors_widget, config), do: valid_top_donors_config_values?(config)

  defp valid_config_values?(:follower_count_widget, config), do: valid_follower_count_config_values?(config)

  defp valid_config_values?(_widget_type, _config), do: true

  defp valid_chat_config_values?(config) do
    max_messages = Map.get(config, :max_messages)
    is_integer(max_messages) and max_messages > 0 and max_messages <= 100
  end

  defp valid_alertbox_config_values?(config) do
    display_duration = Map.get(config, :display_duration)
    animation_type = Map.get(config, :animation_type)

    duration_valid =
      is_integer(display_duration) and display_duration > 0 and display_duration <= 30

    animation_valid = animation_type in ["fade", "slide", "bounce"]

    duration_valid and animation_valid
  end

  defp valid_viewer_count_config_values?(config) do
    display_style = Map.get(config, :display_style)
    style_valid = display_style in ["minimal", "detailed", "cards"]
    style_valid
  end

  defp valid_top_donors_config_values?(config) do
    display_count = Map.get(config, :display_count, 10)
    currency = Map.get(config, :currency, "$")

    display_count_valid = is_integer(display_count) and display_count >= 1 and display_count <= 20
    currency_valid = currency in ["$", "€", "£", "¥", "₹", "₽"]

    display_count_valid and currency_valid
  end

  defp valid_follower_count_config_values?(config) do
    display_style = Map.get(config, :display_style)
    style_valid = display_style in ["minimal", "detailed", "cards"]
    style_valid
  end
end
