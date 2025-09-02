defmodule Streampai.Accounts.WidgetConfig do
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
    # Default actions
    defaults [:read, :destroy]

    create :create do
      accept [:user_id, :type, :config]
      upsert? true
      upsert_identity :user_type_unique

      change fn changeset, _context ->
        case changeset.context[:actor] do
          %{id: user_id} -> Ash.Changeset.force_change_attribute(changeset, :user_id, user_id)
          _ -> changeset
        end
      end
    end

    read :get_by_user_and_type do
      get? true
      argument :user_id, :uuid, allow_nil?: false
      argument :type, :atom, allow_nil?: false

      filter expr(user_id == ^arg(:user_id) and type == ^arg(:type))

      prepare fn query, _context ->
        Ash.Query.after_action(query, fn _query, results ->
          widget_type = Ash.Query.get_argument(query, :type)
          default_config = get_default_config(widget_type)

          case results do
            [] ->
              IO.puts("no config, creating default")

              default_record = %__MODULE__{
                user_id: Ash.Query.get_argument(query, :user_id),
                type: Ash.Query.get_argument(query, :type),
                config: default_config
              }

              {:ok, [default_record]}

            [result] ->
              IO.puts("found res" <> inspect(result))

              merged_config =
                Map.merge(default_config, StreampaiWeb.Utils.MapUtils.to_atom_keys(result.config))

              updated_result = %{result | config: merged_config}

              {:ok, [updated_result]}
          end
        end)
      end
    end

    read :for_user do
      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
    end
  end

  policies do
    # Users can only manage their own widget configs
    policy action_type(:read) do
      authorize_if always()
    end

    policy action_type([:create, :update, :destroy]) do
      authorize_if always()
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

  # Helper function to get default config based on widget type
  defp get_default_config(:chat_widget), do: StreampaiWeb.Utils.FakeChat.default_config()
  defp get_default_config(:alertbox_widget), do: StreampaiWeb.Utils.FakeAlert.default_config()
  defp get_default_config(_), do: %{}
end
