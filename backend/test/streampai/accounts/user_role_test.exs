defmodule Streampai.Accounts.UserRoleTest do
  use Streampai.DataCase, async: true

  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserRoleHelpers

  describe "user roles invitation system" do
    test "can invite, accept and check moderator permission" do
      # Create test users
      {:ok, streamer} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "streamer@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, moderator} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "mod@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Step 1: Invite moderator role
      {:ok, invitation} =
        UserRoleHelpers.invite_role(
          moderator.id,
          streamer.id,
          :moderator,
          streamer
        )

      assert invitation.user_id == moderator.id
      assert invitation.granter_id == streamer.id
      assert invitation.role_type == :moderator
      assert invitation.role_status == :pending
      assert invitation.granted_at
      assert is_nil(invitation.accepted_at)
      assert is_nil(invitation.revoked_at)

      # Permission should not be granted yet (still pending)
      refute UserRoleHelpers.has_permission?(moderator.id, streamer.id, :moderator)
      refute UserRoleHelpers.can_moderate?(moderator.id, streamer.id)

      # Check pending invitations
      pending_invitations = UserRoleHelpers.get_pending_invitations(moderator.id)
      assert length(pending_invitations) == 1
      assert hd(pending_invitations).id == invitation.id

      # Step 2: Accept the invitation
      {:ok, accepted_role} = UserRoleHelpers.accept_role_invitation(invitation, moderator)

      assert accepted_role.role_status == :accepted
      assert accepted_role.accepted_at

      # Now permission should be granted
      assert UserRoleHelpers.has_permission?(moderator.id, streamer.id, :moderator)
      assert UserRoleHelpers.can_moderate?(moderator.id, streamer.id)
      refute UserRoleHelpers.can_manage?(moderator.id, streamer.id)

      # Should no longer appear in pending invitations
      assert UserRoleHelpers.get_pending_invitations(moderator.id) == []
    end

    test "can decline role invitations" do
      # Create test users
      {:ok, streamer} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "streamer2@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, moderator} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "mod2@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Step 1: Invite moderator role
      {:ok, invitation} =
        UserRoleHelpers.invite_role(
          moderator.id,
          streamer.id,
          :moderator,
          streamer
        )

      # Step 2: Decline the invitation
      {:ok, declined_role} = UserRoleHelpers.decline_role_invitation(invitation, moderator)

      assert declined_role.role_status == :declined

      # Permission should not be granted
      refute UserRoleHelpers.has_permission?(moderator.id, streamer.id, :moderator)
      refute UserRoleHelpers.can_moderate?(moderator.id, streamer.id)

      # Should no longer appear in pending invitations
      assert UserRoleHelpers.get_pending_invitations(moderator.id) == []
    end

    test "can revoke permissions" do
      # Create test users  
      {:ok, streamer} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "streamer3@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, moderator} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "mod3@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Invite and accept moderator role
      {:ok, invitation} =
        UserRoleHelpers.invite_role(
          moderator.id,
          streamer.id,
          :moderator,
          streamer
        )

      {:ok, accepted_role} = UserRoleHelpers.accept_role_invitation(invitation, moderator)

      assert UserRoleHelpers.has_permission?(moderator.id, streamer.id, :moderator)

      # Revoke the role
      {:ok, revoked_role} = UserRoleHelpers.revoke_role(accepted_role, streamer)

      assert revoked_role.revoked_at
      refute UserRoleHelpers.has_permission?(moderator.id, streamer.id, :moderator)
    end

    test "can invite and accept manager permission" do
      # Create test users
      {:ok, streamer} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "streamer4@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, manager} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "manager@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Invite and accept manager role
      {:ok, invitation} =
        UserRoleHelpers.invite_role(
          manager.id,
          streamer.id,
          :manager,
          streamer
        )

      {:ok, accepted_role} = UserRoleHelpers.accept_role_invitation(invitation, manager)

      assert accepted_role.role_type == :manager
      assert accepted_role.role_status == :accepted
      assert UserRoleHelpers.can_manage?(manager.id, streamer.id)
      refute UserRoleHelpers.can_moderate?(manager.id, streamer.id)
    end

    test "allows multiple pending invitations but prevents duplicate accepted roles" do
      {:ok, streamer} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "streamer5@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, moderator} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "mod5@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Invite and accept first role
      {:ok, invitation1} =
        UserRoleHelpers.invite_role(
          moderator.id,
          streamer.id,
          :moderator,
          streamer
        )

      {:ok, _accepted_role} = UserRoleHelpers.accept_role_invitation(invitation1, moderator)

      # Try to invite same role again - should succeed (new invitation)
      {:ok, invitation2} =
        UserRoleHelpers.invite_role(
          moderator.id,
          streamer.id,
          :moderator,
          streamer
        )

      # But trying to accept it should fail due to unique constraint
      assert {:error, %Ash.Error.Invalid{}} =
               UserRoleHelpers.accept_role_invitation(invitation2, moderator)
    end

    test "can get user roles, granted roles and pending invitations" do
      {:ok, streamer} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "streamer6@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, moderator} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "mod6@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Invite and accept a role
      {:ok, invitation} =
        UserRoleHelpers.invite_role(
          moderator.id,
          streamer.id,
          :moderator,
          streamer
        )

      {:ok, _accepted_role} = UserRoleHelpers.accept_role_invitation(invitation, moderator)

      # Check moderator's accepted roles
      user_roles = UserRoleHelpers.get_user_roles(moderator.id)
      assert length(user_roles) == 1
      assert hd(user_roles).role_type == :moderator
      assert hd(user_roles).role_status == :accepted

      # Check streamer's granted roles
      granted_roles = UserRoleHelpers.get_granted_roles(streamer.id)
      assert length(granted_roles) == 1
      assert hd(granted_roles).role_type == :moderator

      # Check moderation channels
      moderation_channels = UserRoleHelpers.get_moderation_channels(moderator.id)
      assert streamer.id in moderation_channels

      # Test pending invitations with a new role
      {:ok, _manager_invitation} =
        UserRoleHelpers.invite_role(
          moderator.id,
          streamer.id,
          :manager,
          streamer
        )

      # Should have one pending invitation
      pending_invitations = UserRoleHelpers.get_pending_invitations(moderator.id)
      assert length(pending_invitations) == 1
      assert hd(pending_invitations).role_type == :manager
      assert hd(pending_invitations).role_status == :pending
    end

    test "can find user by username" do
      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "test_user@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Should find user by username (using the actual generated name)
      assert {:ok, found_user} = UserRoleHelpers.find_user_by_username(user.name)
      assert found_user.id == user.id

      # Should return not found for non-existent username
      assert {:error, :not_found} = UserRoleHelpers.find_user_by_username("nonexistent_user")
    end
  end
end
