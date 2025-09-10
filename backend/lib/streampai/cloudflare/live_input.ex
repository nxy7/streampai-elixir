defmodule Streampai.Cloudflare.LiveInput do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Cloudflare,
    authorizers: [Ash.Policy.Authorizer],
    data_layer: AshPostgres.DataLayer

  postgres do
    table "cloudflare_live_inputs"
    repo Streampai.Repo
  end

  code_interface do
    define :get_or_fetch_for_user, args: [:user_id]
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      accept [:user_id, :data]
    end

    read :get_or_fetch_for_user do
      argument :user_id, :uuid, allow_nil?: false

      prepare Streampai.Cloudflare.LiveInput.Preparations.GetOrFetch
    end
  end

  policies do
    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type(:create) do
      authorize_if actor_present()
    end

    policy action_type(:update) do
      authorize_if expr(user_id == ^actor(:id))
    end

    policy action_type(:destroy) do
      authorize_if expr(user_id == ^actor(:id))
    end
  end

  attributes do
    attribute :user_id, :uuid do
      primary_key? true
      allow_nil? false
    end

    attribute :data, :map do
      allow_nil? false
    end

    timestamps()
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      source_attribute :user_id
      destination_attribute :id
    end
  end

  identities do
    identity :one_live_input_per_user, [:user_id]
  end
end
