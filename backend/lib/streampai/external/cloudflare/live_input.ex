defmodule Streampai.Cloudflare.LiveInput do
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Cloudflare,
    authorizers: [Ash.Policy.Authorizer]

  # data_layer: AshPostgres.DataLayer

  require Ash.Query

  actions do
    # defaults [:read, :destroy, update: :*]
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

  # identities do
  #   identity :unique_user_platform, [:user_id, :platform]
  # end
end
