defmodule Streampai.Accounts do
  @moduledoc false
  use Ash.Domain,
    extensions: [AshAdmin.Domain, AshTypescript.Rpc]

  alias Streampai.Accounts.SmartCanvasLayout
  alias Streampai.Accounts.StreamingAccount
  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserRole
  alias Streampai.Accounts.WidgetConfig

  admin do
    show? true
  end

  typescript_rpc do
    resource User do
      rpc_action(:get_current_user, :current_user)
      rpc_action(:get_public_profile, :get_public_profile)
      rpc_action(:list_users, :list_all)
      rpc_action(:get_user_by_name, :get_by_name)
      rpc_action(:get_user_info, :get_user_info)
      rpc_action(:update_name, :update_name)
      rpc_action(:update_avatar, :update_avatar)
      rpc_action(:toggle_email_notifications, :toggle_email_notifications)
      rpc_action(:save_donation_settings, :update_donation_settings)
      rpc_action(:save_language_preference, :update_language_preference)
      rpc_action(:grant_pro_access, :grant_pro_access)
      rpc_action(:revoke_pro_access, :revoke_pro_access)
    end

    resource UserRole do
      rpc_action(:invite_user_role, :invite)
      rpc_action(:accept_role_invitation, :accept)
      rpc_action(:decline_role_invitation, :decline)
      rpc_action(:revoke_user_role, :revoke)
    end

    resource WidgetConfig do
      rpc_action(:get_widget_config, :get_by_user_and_type)
      rpc_action(:list_widget_configs, :read)
      rpc_action(:save_widget_config, :create)
    end

    resource StreamingAccount do
      rpc_action(:list_streaming_accounts, :read)
      rpc_action(:refresh_streaming_account_stats, :refresh_stats)
      rpc_action(:disconnect_streaming_account, :destroy)
    end

    resource SmartCanvasLayout do
      rpc_action(:get_smart_canvas_layout, :get_by_user)
      rpc_action(:save_smart_canvas_layout, :create)
    end
  end

  resources do
    resource Streampai.Accounts.Token
    resource User
    resource Streampai.Accounts.UserPremiumGrant
    resource StreamingAccount
    resource WidgetConfig
    resource SmartCanvasLayout
    resource Streampai.Accounts.NewsletterEmail
    resource UserRole
  end
end
