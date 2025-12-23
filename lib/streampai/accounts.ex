defmodule Streampai.Accounts do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshGraphql.Domain]

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.Accounts.User

  admin do
    show? true
  end

  graphql do
    queries do
      read_one User, :current_user, :current_user
      read_one User, :public_profile, :get_public_profile
      list User, :list_users, :list_all
    end

    mutations do
      update User, :grant_pro_access, :grant_pro_access
      update User, :revoke_pro_access, :revoke_pro_access
      update User, :update_avatar, :update_avatar
      destroy StreamingAccount, :disconnect_streaming_account, :destroy
    end
  end

  resources do
    resource Streampai.Accounts.Token
    resource User
    resource Streampai.Accounts.UserPremiumGrant
    resource StreamingAccount
    resource Streampai.Accounts.WidgetConfig
    resource Streampai.Accounts.SmartCanvasLayout
    resource Streampai.Accounts.NewsletterEmail
    resource Streampai.Accounts.UserRole
  end
end
