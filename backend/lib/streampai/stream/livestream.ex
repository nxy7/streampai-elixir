defmodule Streampai.Stream.Livestream do
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "livestreams"
    repo Streampai.Repo
  end

  actions do
    defaults [:read, :destroy, create: :*, update: :*]
  end

  attributes do
    uuid_primary_key :id

    attribute :started_at, :utc_datetime do
      allow_nil? false
    end

    attribute :ended_at, :utc_datetime do
      allow_nil? true
    end
  end
end
