defmodule Streampai.Accounts do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshTypescript.Rpc]

  alias Streampai.Accounts.User

  admin do
    show? true
  end

  typescript_rpc do
    resource User do
      rpc_action :list_accounts, :list_all
      rpc_action :current_user, :current_user
    end
  end

  resources do
    resource Streampai.Accounts.Token
    resource User
    resource Streampai.Accounts.UserPremiumGrant
    resource Streampai.Accounts.StreamingAccount
    resource Streampai.Accounts.WidgetConfig
    resource Streampai.Accounts.SmartCanvasLayout
    resource Streampai.Accounts.NewsletterEmail
    resource Streampai.Accounts.UserPreferences
    resource Streampai.Accounts.UserRole
  end
end
