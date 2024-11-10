defmodule Streampai.Accounts.StreamingAccount do
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "streaming_account"
    repo Streampai.Repo
  end

  actions do
    defaults [:read, :destroy, create: :*, update: :*]
  end

  attributes do
    attribute :user_id, :string do
      primary_key? true
      allow_nil? false
    end

    attribute :platform, Streampai.Stream.Platform do
      primary_key? true
      allow_nil? false
    end

    attribute :refresh_token, :string do
      allow_nil? false
      sensitive? true
    end

    attribute :access_token, :string do
      allow_nil? false
      sensitive? true
    end

    attribute :access_token_expires_at, :utc_datetime do
      allow_nil? false
    end

    attribute :extra_data, :map do
      allow_nil? false
    end

    timestamps()
  end
end
