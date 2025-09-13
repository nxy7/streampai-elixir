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

    validate present([:user_id])
    validate present([:config])

  end

  def validate_config_structure(changeset) do
    case {Ash.Changeset.get_attribute(changeset, :type), Ash.Changeset.get_attribute(changeset, :config)} do
      {:chat_widget, config} -> validate_chat_widget_config(config, changeset)
      {:alertbox_widget, config} -> validate_alertbox_widget_config(config, changeset)
      # Type validation will catch this
      {nil, _} -> changeset
      # Config validation will catch this
      {_, nil} -> changeset
      # Valid for other widget types
      {_, config} when is_map(config) -> changeset
      _ -> Ash.Changeset.add_error(changeset, :config, "Config must be a map")
    end
  end

  defp validate_chat_widget_config(config, changeset) do
    required_keys = [:max_messages, :show_badges, :show_emotes]
    missing_keys = required_keys -- Map.keys(config)

    changeset =
      if missing_keys == [] do
        changeset
      else
        Ash.Changeset.add_error(
          changeset,
          :config,
          "Missing required chat widget config keys: #{inspect(missing_keys)}"
        )
      end

    # Validate specific values
    changeset =
      case Map.get(config, :max_messages) do
        n when is_integer(n) and n > 0 and n <= 100 ->
          changeset

        n when is_integer(n) ->
          Ash.Changeset.add_error(changeset, :config, "max_messages must be between 1 and 100")

        _ ->
          Ash.Changeset.add_error(changeset, :config, "max_messages must be an integer")
      end

    changeset
  end

  defp validate_alertbox_widget_config(config, changeset) do
    required_keys = [:display_duration, :animation_type, :sound_enabled]
    missing_keys = required_keys -- Map.keys(config)

    changeset =
      if missing_keys == [] do
        changeset
      else
        Ash.Changeset.add_error(
          changeset,
          :config,
          "Missing required alertbox widget config keys: #{inspect(missing_keys)}"
        )
      end

    # Validate specific values
    changeset =
      case Map.get(config, :display_duration) do
        n when is_integer(n) and n > 0 and n <= 30 ->
          changeset

        n when is_integer(n) ->
          Ash.Changeset.add_error(
            changeset,
            :config,
            "display_duration must be between 1 and 30 seconds"
          )

        _ ->
          Ash.Changeset.add_error(changeset, :config, "display_duration must be an integer")
      end

    changeset =
      case Map.get(config, :animation_type) do
        type when type in ["fade", "slide", "bounce"] ->
          changeset

        _ ->
          Ash.Changeset.add_error(
            changeset,
            :config,
            "animation_type must be one of: fade, slide, bounce"
          )
      end

    changeset
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
    case widget_type do
      :chat_widget ->
        %{
          max_messages: 50,
          show_badges: true,
          show_emotes: true,
          hide_bots: false,
          show_timestamps: false,
          show_platform: true,
          message_fade_time: 0,
          font_size: "medium"
        }

      :alertbox_widget ->
        %{
          display_duration: 5,
          animation_type: "fade",
          alert_position: "center",
          sound_enabled: true,
          sound_volume: 80,
          show_amount: true,
          show_message: true,
          font_size: "medium"
        }

      :donation_widget ->
        %{
          show_amount: true,
          show_message: true,
          minimum_amount: 1.0,
          animation_enabled: true,
          sound_enabled: true
        }

      :follow_widget ->
        %{
          show_message: true,
          animation_type: "slide",
          display_duration: 3
        }

      :subscriber_widget ->
        %{
          show_tier: true,
          show_message: true,
          animation_type: "bounce",
          display_duration: 4
        }

      _ ->
        %{}
    end
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
    case widget_type do
      :chat_widget -> [:max_messages, :show_badges, :show_emotes]
      :alertbox_widget -> [:display_duration, :animation_type, :sound_enabled]
      :donation_widget -> [:show_amount, :minimum_amount]
      :follow_widget -> [:animation_type, :display_duration]
      :subscriber_widget -> [:show_tier, :animation_type, :display_duration]
      _ -> []
    end
  end

  defp valid_config_values?(widget_type, config) do
    case widget_type do
      :chat_widget -> valid_chat_config_values?(config)
      :alertbox_widget -> valid_alertbox_config_values?(config)
      # Other widget types don't have specific validations yet
      _ -> true
    end
  end

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
end
