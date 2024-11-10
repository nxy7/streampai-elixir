defmodule Streampai.Accounts do
  use Ash.Domain,
    extensions: [AshAdmin.Domain]

  admin do
    show? true
  end

  resources do
    resource Streampai.Accounts.Token
    resource Streampai.Accounts.User
    resource Streampai.Accounts.UserPremiumGrant
    resource Streampai.Accounts.StreamingAccount
    resource Streampai.Accounts.WidgetConfig
    resource Streampai.Accounts.NewsletterEmail
    resource Streampai.Accounts.UserPreferences
  end
end
