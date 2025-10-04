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
    define :get_completed_by_user, args: [:user_id]
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      accept [:id, :started_at, :user_id, :title, :thumbnail_url]
    end

    read :get_completed_by_user do
      argument :user_id, :uuid do
        allow_nil? false
      end

      filter expr(user_id == ^arg(:user_id) and not is_nil(ended_at))
      prepare build(sort: [started_at: :desc], limit: 50)
    end
  end

  attributes do
    uuid_primary_key :id do
      writable? true
    end

    attribute :title, :string do
      public? true
      allow_nil? false
    end

    attribute :thumbnail_url, :string do
      public? true
      allow_nil? true
    end

    attribute :started_at, :utc_datetime do
      public? true
      allow_nil? false
    end

    attribute :ended_at, :utc_datetime do
      public? true
      allow_nil? true
    end
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
    end
  end
end
