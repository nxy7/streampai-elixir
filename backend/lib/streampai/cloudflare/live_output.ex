defmodule Streampai.Cloudflare.LiveOutput do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Cloudflare,
    authorizers: [Ash.Policy.Authorizer],
    data_layer: AshPostgres.DataLayer

  require Ash.Query

  postgres do
    table "cloudflare_live_outputs"
    repo Streampai.Repo
  end

  actions do
  end

  policies do
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
end
