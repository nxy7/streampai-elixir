defmodule Streampai.Accounts.User.Changes.GrantProAccess do
  @moduledoc """
  Change module for granting PRO access to a user.

  Creates a UserPremiumGrant record with the specified duration and reason.
  The grant is created by the current actor (admin).
  """
  use Ash.Resource.Change

  alias Streampai.Accounts.UserPremiumGrant

  @impl true
  def change(changeset, _opts, context) do
    actor = context.actor

    if actor do
      duration_days = Ash.Changeset.get_argument(changeset, :duration_days)
      reason = Ash.Changeset.get_argument(changeset, :reason)
      user_id = changeset.data.id

      expires_at = DateTime.add(DateTime.utc_now(), duration_days, :day)
      granted_at = DateTime.utc_now()

      Ash.Changeset.after_action(changeset, fn _changeset, _user ->
        case UserPremiumGrant.create_grant(
               user_id,
               actor.id,
               expires_at,
               granted_at,
               reason
             ) do
          {:ok, _grant} ->
            # Reload user with tier calculation
            case Streampai.Accounts.User.get_by_id(user_id, actor: actor) do
              {:ok, updated_user} -> {:ok, updated_user}
              {:error, error} -> {:error, error}
            end

          {:error, error} ->
            {:error, error}
        end
      end)
    else
      Ash.Changeset.add_error(changeset, "Actor is required to grant PRO access")
    end
  end
end
