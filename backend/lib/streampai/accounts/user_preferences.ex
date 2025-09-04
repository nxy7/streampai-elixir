defmodule Streampai.Accounts.UserPreferences do
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource],
    data_layer: AshPostgres.DataLayer

  postgres do
    table "user_preferences"
    repo Streampai.Repo
  end

  code_interface do
    define :get_by_user_id
    define :create
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:user_id, :email_notifications]
      upsert? true
      upsert_identity :primary_key
    end

    read :get_by_user_id do
      get? true
      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))

      prepare fn query, _context ->
        Ash.Query.after_action(query, fn _query, results ->
          case results do
            [] ->
              default_record = %__MODULE__{
                user_id: Ash.Query.get_argument(query, :user_id),
                email_notifications: true
              }

              {:ok, [default_record]}

            [result] ->
              {:ok, [result]}
          end
        end)
      end
    end
  end

  policies do
    # Users can only manage their own preferences
    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action_type(:create) do
      authorize_if expr(^actor(:role) == :admin)
      authorize_if actor_present()
    end

    policy action_type(:destroy) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end
  end

  attributes do
    attribute :user_id, :uuid, primary_key?: true, allow_nil?: false, public?: true
    attribute :email_notifications, :boolean, allow_nil?: false, default: true, public?: true

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
    identity :primary_key, [:user_id]
  end
end
