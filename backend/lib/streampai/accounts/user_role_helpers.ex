defmodule Streampai.Accounts.UserRoleHelpers do
  @moduledoc """
  Helper functions for managing user roles and permissions.

  This module provides convenient functions for granting, revoking, and checking
  user permissions for moderator and manager roles.
  """

  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserRole

  @doc """
  Invites a user to accept a role (step 1 of 2-step process).

  ## Examples

      # Invite user to be a moderator
      {:ok, invitation} = invite_role(moderator_user_id, streamer_user_id, :moderator, streamer_user)
      
      # Invite user to be a manager  
      {:ok, invitation} = invite_role(manager_user_id, streamer_user_id, :manager, streamer_user)
  """
  def invite_role(user_id, granter_id, role_type, actor) do
    UserRole.invite_role(
      %{
        user_id: user_id,
        granter_id: granter_id,
        role_type: role_type
      },
      actor: actor
    )
  end

  @doc """
  Accepts a role invitation (step 2 of 2-step process).

  ## Examples

      {:ok, accepted_role} = accept_role_invitation(invitation, user)
  """
  def accept_role_invitation(user_role, actor) do
    UserRole.accept_role(user_role, actor: actor)
  end

  @doc """
  Declines a role invitation.

  ## Examples

      {:ok, declined_role} = decline_role_invitation(invitation, user)
  """
  def decline_role_invitation(user_role, actor) do
    UserRole.decline_role(user_role, actor: actor)
  end

  @doc """
  Finds a user by username to invite.

  ## Examples

      {:ok, user} = find_user_by_username("streamer123")
      {:error, :not_found} = find_user_by_username("nonexistent")
  """
  def find_user_by_username(username) when is_binary(username) and username != "" do
    User
    |> Ash.Query.new()
    |> Ash.Query.do_filter(name: username)
    |> Ash.read(authorize?: false)
    |> case do
      {:ok, [user]} -> {:ok, user}
      {:ok, []} -> {:error, :not_found}
      {:ok, _users} -> {:error, :multiple_found}
      {:error, _} -> {:error, :not_found}
    end
  rescue
    _ -> {:error, :not_found}
  end

  def find_user_by_username(_), do: {:error, :not_found}

  @doc """
  Revokes a user's role.

  ## Examples

      {:ok, revoked_role} = revoke_role(user_role, actor)
  """
  def revoke_role(user_role, actor) do
    UserRole.revoke_role(user_role, actor: actor)
  end

  @doc """
  Checks if a user has a specific permission for another user.

  ## Examples

      # Check if user can moderate for streamer
      true = has_permission?(moderator_id, streamer_id, :moderator)
      false = has_permission?(random_user_id, streamer_id, :moderator)
  """
  def has_permission?(user_id, granter_id, role_type)
      when is_binary(user_id) and is_binary(granter_id) and role_type in [:moderator, :manager] do
    %{user_id: user_id, granter_id: granter_id, role_type: role_type}
    |> UserRole.check_permission(actor: %{id: granter_id})
    |> case do
      {:ok, [_role | _]} -> true
      {:ok, []} -> false
      {:error, _} -> false
    end
  rescue
    _ -> false
  end

  def has_permission?(_, _, _), do: false

  @doc """
  Gets all active roles granted to a user.

  ## Examples

      roles = get_user_roles(user_id)
      # Returns list of UserRole structs where this user has been granted permissions
  """
  def get_user_roles(user_id) do
    %{user_id: user_id}
    |> UserRole.get_user_roles_for_user(actor: %{id: user_id})
    |> case do
      {:ok, roles} -> Ash.load!(roles, [:granter], authorize?: false)
      {:error, _} -> []
    end
  rescue
    _ -> []
  end

  @doc """
  Gets all pending role invitations for a user.

  ## Examples

      invitations = get_pending_invitations(user_id)
      # Returns list of UserRole structs with role_status == :pending
  """
  def get_pending_invitations(user_id) do
    case UserRole.get_pending_invitations(%{user_id: user_id}, actor: %{id: user_id}) do
      {:ok, invitations} ->
        try do
          Ash.load!(invitations, [:granter], authorize?: false)
        rescue
          _ -> invitations
        end

      {:error, _} ->
        []
    end
  rescue
    _ -> []
  end

  @doc """
  Gets all roles a user has granted to others.

  ## Examples

      granted_roles = get_granted_roles(granter_id)
      # Returns list of UserRole structs where this user granted permissions to others
  """
  def get_granted_roles(granter_id) do
    %{granter_id: granter_id}
    |> UserRole.get_user_roles_for_granter(actor: %{id: granter_id})
    |> case do
      {:ok, roles} -> Ash.load!(roles, [:user], authorize?: false)
      {:error, _} -> []
    end
  rescue
    _ -> []
  end

  @doc """
  Gets all role invitations sent by a user (both pending and responded to).

  ## Examples

      sent_invitations = get_sent_invitations(granter_id)
      # Returns list of all UserRole invitations sent by this user
  """
  def get_sent_invitations(granter_id) do
    # Use basic filtering approach that's known to work in this codebase
    case Ash.read(UserRole, authorize?: false) do
      {:ok, roles} ->
        roles
        |> Enum.filter(fn role ->
          role.granter_id == granter_id and is_nil(role.revoked_at)
        end)
        |> Ash.load!([:user], authorize?: false)

      {:error, _} ->
        []
    end
  rescue
    _ -> []
  end

  @doc """
  Gets all users who have a specific role for a granter.

  ## Examples

      moderators = get_users_with_role(streamer_id, :moderator)
      managers = get_users_with_role(streamer_id, :manager)
  """
  def get_users_with_role(granter_id, role_type) when is_binary(granter_id) and role_type in [:moderator, :manager] do
    granter_id
    |> get_granted_roles()
    |> Enum.filter(&(&1.role_type == role_type))
  end

  def get_users_with_role(_, _), do: []

  @doc """
  Checks if a user can moderate for another user.
  Convenience function for the common moderator permission check.
  """
  def can_moderate?(user_id, granter_id) when is_binary(user_id) and is_binary(granter_id) do
    has_permission?(user_id, granter_id, :moderator)
  end

  def can_moderate?(_, _), do: false

  @doc """
  Checks if a user can manage for another user.
  Convenience function for the common manager permission check.
  """
  def can_manage?(user_id, granter_id) when is_binary(user_id) and is_binary(granter_id) do
    has_permission?(user_id, granter_id, :manager)
  end

  def can_manage?(_, _), do: false

  @doc """
  Gets all channels/users a user can moderate for.
  """
  def get_moderation_channels(user_id) when is_binary(user_id) do
    user_id
    |> get_user_roles()
    |> Enum.filter(&(&1.role_type == :moderator))
    |> Enum.map(& &1.granter_id)
  end

  def get_moderation_channels(_), do: []

  @doc """
  Gets all channels/users a user can manage for.
  """
  def get_management_channels(user_id) when is_binary(user_id) do
    user_id
    |> get_user_roles()
    |> Enum.filter(&(&1.role_type == :manager))
    |> Enum.map(& &1.granter_id)
  end

  def get_management_channels(_), do: []
end
