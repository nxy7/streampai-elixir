defmodule StreampaiWeb.Live.Helpers.RoleManagementHelpers do
  @moduledoc """
  Common helpers for LiveView modules that need role management functionality.

  This module provides consistent patterns for:
  - Loading role data
  - Handling role actions (accept, decline, revoke)
  - Role validation and invitation management
  """

  import Phoenix.Component, only: [assign: 3]
  import Phoenix.LiveView, only: [put_flash: 3]
  import StreampaiWeb.LiveHelpers.FlashHelpers

  alias Streampai.Accounts.UserRoleHelpers

  @doc """
  Loads all role-related data into the socket assigns.

  ## Examples

      socket = load_role_data(socket, current_user)
  """
  def load_role_data(socket, current_user) do
    pending_invitations = UserRoleHelpers.get_pending_invitations(current_user.id)
    granted_roles = UserRoleHelpers.get_granted_roles(current_user.id)
    user_roles = UserRoleHelpers.get_user_roles(current_user.id)
    sent_invitations = UserRoleHelpers.get_sent_invitations(current_user.id)

    socket
    |> assign(:pending_invitations, pending_invitations)
    |> assign(:granted_roles, granted_roles)
    |> assign(:user_roles, user_roles)
    |> assign(:sent_invitations, sent_invitations)
  end

  @doc """
  Generic role action handler that follows a consistent pattern.

  ## Examples

      handle_role_action(
        socket,
        role_id,
        &find_pending_invitation/2,
        &UserRoleHelpers.accept_role_invitation/2,
        "Role accepted successfully!",
        "Role invitation not found",
        "Failed to accept role"
      )
  """
  def handle_role_action(socket, role_id, finder_fn, action_fn, success_msg, not_found_msg, error_msg) do
    current_user = socket.assigns.current_user

    with role when not is_nil(role) <- finder_fn.(socket, role_id),
         {:ok, _result} <- action_fn.(role, current_user) do
      {:noreply, socket |> load_role_data(current_user) |> put_flash(:info, success_msg)}
    else
      nil -> {:noreply, flash_error(socket, not_found_msg)}
      {:error, _} -> {:noreply, flash_error(socket, error_msg)}
    end
  end

  @doc """
  Handles invitation requests with comprehensive validation.

  ## Examples

      handle_invitation_request(socket, username, "moderator", current_user)
  """
  def handle_invitation_request(socket, username, role_type, current_user) do
    socket = socket |> assign(:invite_error, nil) |> assign(:invite_success, nil)

    with {:ok, username} <- validate_username(username),
         {:ok, role_atom} <- validate_role_type(role_type),
         {:ok, user} <- UserRoleHelpers.find_user_by_username(username),
         :ok <- validate_not_self_invite(user, current_user),
         {:ok, _invitation} <-
           UserRoleHelpers.invite_role(user.id, current_user.id, role_atom, current_user) do
      {:noreply,
       socket
       |> load_role_data(current_user)
       |> reset_invite_form()
       |> set_invite_success(username, role_type)}
    else
      {:error, :invalid_username} ->
        {:noreply, assign(socket, :invite_error, "Username cannot be empty")}

      {:error, :invalid_role} ->
        {:noreply, assign(socket, :invite_error, "Invalid role type selected")}

      {:error, :not_found} ->
        {:noreply, assign(socket, :invite_error, "User '#{username}' not found")}

      {:error, :self_invite} ->
        {:noreply, assign(socket, :invite_error, "You cannot invite yourself")}

      {:error, _} ->
        {:noreply, assign(socket, :invite_error, "Failed to send invitation")}
    end
  end

  @doc """
  Role finder functions for different contexts.
  """
  def find_pending_invitation(socket, role_id) do
    Enum.find(socket.assigns.pending_invitations, &(&1.id == role_id))
  end

  def find_granted_role(socket, role_id) do
    Enum.find(socket.assigns.granted_roles, &(&1.id == role_id))
  end

  def find_sent_invitation(socket, role_id) do
    Enum.find(socket.assigns.sent_invitations, &(&1.id == role_id))
  end

  # Private helper functions

  defp validate_username(username) when is_binary(username) do
    case String.trim(username) do
      "" -> {:error, :invalid_username}
      trimmed -> {:ok, trimmed}
    end
  end

  defp validate_username(_), do: {:error, :invalid_username}

  defp validate_role_type(role_type) when role_type in ["moderator", "manager"] do
    {:ok, String.to_existing_atom(role_type)}
  end

  defp validate_role_type(_), do: {:error, :invalid_role}

  defp validate_not_self_invite(user, current_user) do
    if user.id == current_user.id do
      {:error, :self_invite}
    else
      :ok
    end
  end

  defp reset_invite_form(socket), do: assign(socket, :invite_username, "")

  defp set_invite_success(socket, username, role_type),
    do: assign(socket, :invite_success, "Invitation sent to #{username} for #{role_type} role!")
end
