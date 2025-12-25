defmodule Streampai.Accounts.UserPolicy do
  @moduledoc """
  Centralized authorization logic for user permissions and roles.

  This module consolidates all user authorization decisions that were
  previously scattered across different LiveViews and contexts.
  """

  @doc """
  Checks if a user is an administrator.

  ## Examples

      iex> user = %User{role: :admin}
      iex> UserPolicy.admin?(user)
      true

      iex> user = %User{role: :regular}
      iex> UserPolicy.admin?(user)
      false
  """
  def admin?(%{role: :admin}), do: true
  def admin?(_), do: false

  @doc """
  Determines if a user can impersonate (general permission).
  Currently only admins can impersonate other users.
  """
  def can_impersonate?(%{role: :admin}), do: true
  def can_impersonate?(_), do: false

  @doc """
  Checks if a user can impersonate a specific target user.
  Admins can impersonate anyone except other admins.
  """
  def can_impersonate_user?(%{role: :admin}, %{role: :regular}), do: true
  def can_impersonate_user?(_, _), do: false

  @doc """
  Gets all admin emails for reference.

  This is useful for testing or administrative purposes.
  """
  def admin_emails, do: Streampai.Constants.admin_emails()

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
