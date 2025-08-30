defmodule Streampai.Accounts.UserPolicy do
  @moduledoc """
  Centralized authorization logic for user permissions and roles.

  This module consolidates all user authorization decisions that were
  previously scattered across different LiveViews and contexts.
  """

  @admin_emails ["lolnoxy@gmail.com"]

  @doc """
  Checks if a user is an administrator.

  ## Examples

      iex> user = %User{email: "lolnoxy@gmail.com"}
      iex> UserPolicy.admin?(user)
      true
      
      iex> user = %User{email: "regular@example.com"}
      iex> UserPolicy.admin?(user)
      false
  """
  def admin?(%{email: email}) when is_binary(email) do
    email in @admin_emails
  end

  def admin?(_), do: false

  @doc """
  Determines if a user can impersonate (general permission).

  Currently only admins can impersonate other users.
  """
  def can_impersonate?(user) do
    admin?(user)
  end

  @doc """
  Gets the role of a user as an atom.

  ## Returns
  - `:admin` for administrators
  - `:regular` for regular users
  """
  def user_role(user) do
    if admin?(user) do
      :admin
    else
      :regular
    end
  end

  @doc """
  Checks if a user can access admin features.

  This is currently the same as admin? but provides
  semantic clarity for admin feature access.
  """
  def can_access_admin?(user) do
    admin?(user)
  end

  @doc """
  Checks if a user can moderate chat or content.

  Currently only admins can moderate, but this could
  be expanded to include moderator roles in the future.
  """
  def can_moderate?(user) do
    admin?(user)
  end

  @doc """
  Checks if a user can impersonate a specific target user.

  Admins can impersonate anyone except other admins.
  Regular users cannot impersonate anyone.
  """
  def can_impersonate_user?(user, target_user) do
    case {user_role(user), user_role(target_user)} do
      {:admin, :regular} -> true
      # Admins cannot impersonate other admins
      {:admin, :admin} -> false
      # Regular users cannot impersonate anyone
      {:regular, _} -> false
    end
  end

  @doc """
  Gets all admin emails for reference.

  This is useful for testing or administrative purposes.
  """
  def admin_emails, do: @admin_emails

  @doc """
  Checks if a user can access a specific resource.

  This provides a more granular permission system that can be
  extended as the application grows.

  ## Examples

      UserPolicy.can_access?(user, :admin_dashboard)
      UserPolicy.can_access?(user, :impersonation_controls)
      UserPolicy.can_access?(user, :user_management)
  """
  def can_access?(user, resource) do
    case resource do
      :admin_dashboard -> admin?(user)
      :impersonation_controls -> admin?(user)
      :user_management -> admin?(user)
      # All users can manage their own accounts
      :streaming_account_management -> true
      # All users can access settings
      :settings -> true
      # Default deny
      _ -> false
    end
  end
end
