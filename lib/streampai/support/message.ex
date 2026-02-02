defmodule Streampai.Support.Message do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Support,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource, AshTypescript.Resource],
    data_layer: AshPostgres.DataLayer

  postgres do
    table "support_messages"
    repo Streampai.Repo
  end

  typescript do
    type_name("SupportMessage")
  end

  code_interface do
    define :create
    define :read
    define :for_ticket, args: [:ticket_id]
  end

  actions do
    defaults [:read]

    create :create do
      accept [:content, :ticket_id, :user_id]
      primary? true
    end

    read :for_ticket do
      argument :ticket_id, :uuid, allow_nil?: false
      filter expr(ticket_id == ^arg(:ticket_id))
      prepare build(sort: [inserted_at: :asc])
    end
  end

  policies do
    policy action(:read) do
      authorize_if actor_present()
    end

    policy action(:create) do
      authorize_if actor_present()
    end

    policy action(:for_ticket) do
      authorize_if actor_present()
    end
  end

  attributes do
    uuid_primary_key :id, public?: true

    attribute :content, :string do
      allow_nil? false
      public? true
    end

    create_timestamp :inserted_at, public?: true
  end

  relationships do
    belongs_to :ticket, Streampai.Support.Ticket do
      allow_nil? false
      public? true
      attribute_writable? true
    end

    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      public? true
      attribute_writable? true
    end
  end
end
