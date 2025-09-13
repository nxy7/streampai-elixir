defmodule Streampai.Accounts.UserPolicy do
  @moduledoc """
  Centralized authorization logic for user permissions and roles.

  This module consolidates all user authorization decisions that were
  previously scattered across different LiveViews and contexts.
  """

  @admin_emails [Streampai.Constants.admin_email()]

  @doc """
  Checks if a user is an administrator.

  ## Examples

      iex> user = %User{email: Streampai.Constants.admin_email()}
      iex> UserPolicy.admin?(user)
      true

      iex> user = %User{email: "regular@example.com"}
      iex> UserPolicy.admin?(user)
      false
  """
  def admin?(%{role: :admin}), do: true
  def admin?(_), do: false

  @doc """
  Determines if a user can impersonate (general permission).

  Currently only admins can impersonate other users.
  """
  def can_impersonate?(user) do
    user.role == :admin
  end

  @doc """
  Checks if a user can impersonate a specific target user.

  Admins can impersonate anyone except other admins.
  Regular users cannot impersonate anyone.
  """
  def can_impersonate_user?(user, target_user) do
    case {user.role, target_user.role} do
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
