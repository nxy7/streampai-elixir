defmodule Streampai.Accounts do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshGraphql.Domain]

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserRole

  admin do
    show? true
  end

  graphql do
    queries do
      read_one User, :current_user, :current_user
      read_one User, :public_profile, :get_public_profile
      read_one User, :user_by_name, :get_by_name
      read_one User, :user_info, :get_user_info
      list User, :list_users, :list_all
      list UserRole, :my_pending_invitations, :get_pending_invitations
      list UserRole, :my_granted_roles, :get_user_roles_for_user
      list UserRole, :roles_i_granted, :get_user_roles_for_granter
    end

    mutations do
      update User, :grant_pro_access, :grant_pro_access
      update User, :revoke_pro_access, :revoke_pro_access
      update User, :update_avatar, :update_avatar
      destroy StreamingAccount, :disconnect_streaming_account, :destroy
      create UserRole, :invite_user_role, :invite
      update UserRole, :accept_role_invitation, :accept
      update UserRole, :decline_role_invitation, :decline
      update UserRole, :revoke_user_role, :revoke
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
    resource UserRole
  end
end
