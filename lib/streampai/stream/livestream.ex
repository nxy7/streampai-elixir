defmodule Streampai.Stream.Livestream do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "livestreams"
    repo Streampai.Repo
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      accept [:started_at, :ended_at]
    end
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
