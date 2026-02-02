defmodule Streampai.Support.Ticket do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Support,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshAdmin.Resource, AshTypescript.Resource],
    data_layer: AshPostgres.DataLayer

  postgres do
    table "support_tickets"
    repo Streampai.Repo
  end

  typescript do
    type_name("SupportTicket")
  end

  code_interface do
    define :create
    define :read
    define :resolve
    define :for_user, args: [:user_id]
    define :all_tickets
  end

  actions do
    defaults [:read]

    create :create do
      accept [:subject, :user_id, :ticket_type]
      primary? true
    end

    update :resolve do
      accept []
      require_atomic? false

      change set_attribute(:status, :resolved)
    end

    read :for_user do
      argument :user_id, :uuid, allow_nil?: false
      filter expr(user_id == ^arg(:user_id))
      prepare build(sort: [inserted_at: :desc])
    end

    read :all_tickets do
      prepare build(sort: [inserted_at: :desc])
    end
  end

  policies do
    policy action(:read) do
      authorize_if actor_present()
    end

    policy action(:create) do
      authorize_if actor_present()
    end

    policy action(:resolve) do
      authorize_if expr(^actor(:role) == :admin)
    end

    policy action(:for_user) do
      authorize_if actor_present()
    end

    policy action(:all_tickets) do
      authorize_if expr(^actor(:role) == :admin)
    end
  end

  attributes do
    uuid_primary_key :id, public?: true

    attribute :subject, :string do
      allow_nil? false
      public? true
    end

    attribute :status, Streampai.Support.Ticket.Types.Status do
      default :open
      allow_nil? false
      public? true
    end

    attribute :ticket_type, Streampai.Support.Ticket.Types.TicketType do
      default :support
      allow_nil? false
      public? true
    end

    create_timestamp :inserted_at, public?: true
    update_timestamp :updated_at, public?: true
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      public? true
      attribute_writable? true
    end

    has_many :messages, Streampai.Support.Message do
      public? true
    end
  end
end
