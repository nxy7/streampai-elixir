defmodule Streampai.Accounts.NewsletterEmail do
  @moduledoc """
  Stores newsletter subscriber emails and sends confirmation on signup.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Accounts,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "newsletter_emails"
    repo Streampai.Repo
  end

  code_interface do
    define :create
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      accept [:email]

      change after_action(fn _changeset, record, _context ->
               Streampai.Emails.send_newsletter_confirmation_email(record.email)
               {:ok, record}
             end)
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
end
