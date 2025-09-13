defmodule Streampai.Accounts.NewsletterEmail do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "newsletter_emails"
    repo Streampai.Repo
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      accept [:email]
    end
  end

  attributes do
    attribute :email, :string do
      primary_key? true
      allow_nil? false
      constraints match: ~r/^[^\s]+@[^\s]+\.[^\s]+$/
    end

    timestamps()
  end

  identities do
    identity :unique_email, [:email]
  end

  code_interface do
    define :create
  end
end
