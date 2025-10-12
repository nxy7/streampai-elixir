defmodule Streampai.Accounts.SmartWidgetLayout do
  @moduledoc """
  Stores the layout configuration for Smart Widgets - widgets that users can
  position on a 16:9 canvas for their stream overlay.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource],
    data_layer: AshPostgres.DataLayer

  postgres do
    table "smart_widget_layouts"
    repo Streampai.Repo
  end

  code_interface do
    define :get_by_user
    define :create
    define :update
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:user_id, :widgets]
      upsert? true
      upsert_identity :user_unique
    end

    update :update do
      accept [:widgets]
    end

    read :get_by_user do
      get? true
      argument :user_id, :uuid, allow_nil?: false

      filter expr(user_id == ^arg(:user_id))
    end
  end

  policies do
    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action_type([:create, :update]) do
      authorize_if actor_present()
    end

    policy action_type(:destroy) do
      authorize_if expr(user_id == ^actor(:id))
      authorize_if expr(^actor(:role) == :admin)
    end
  end

  changes do
    change fn changeset, _opts ->
             case changeset.context[:actor] do
               %{id: actor_id} when not is_nil(actor_id) ->
                 Ash.Changeset.force_change_attribute(changeset, :user_id, actor_id)

               _ ->
                 changeset
             end
           end,
           on: [:create]
  end

  attributes do
    uuid_primary_key :id

    attribute :user_id, :uuid, allow_nil?: false, public?: true

    attribute :widgets, {:array, :map},
      allow_nil?: false,
      public?: true,
      default: []

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
    identity :user_unique, [:user_id]
  end
end
