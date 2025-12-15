defmodule Streampai.Accounts.User.Changes.RevokeProAccess do
  @moduledoc """
  Change module for revoking PRO access from a user.

  Finds all active UserPremiumGrant records for the user and sets their revoked_at timestamp.
  """
  use Ash.Resource.Change

  alias Streampai.Accounts.UserPremiumGrant

  @impl true
  def change(changeset, _opts, context) do
    actor = context.actor

    if actor do
      user_id = changeset.data.id

      Ash.Changeset.after_action(changeset, fn _changeset, _user ->
        # Find all active grants for this user
        case UserPremiumGrant
             |> Ash.Query.for_read(:read)
             |> Ash.Query.filter(user_id == ^user_id and is_nil(revoked_at))
             |> Ash.read() do
          {:ok, grants} ->
            # Revoke all active grants
            results =
              Enum.map(grants, fn grant ->
                Ash.update(grant, %{revoked_at: DateTime.utc_now()}, action: :revoke)
              end)

            if Enum.all?(results, &match?({:ok, _}, &1)) do
              # Reload user with tier calculation
              case Streampai.Accounts.User.get_by_id(user_id, actor: actor) do
                {:ok, updated_user} -> {:ok, updated_user}
                {:error, error} -> {:error, error}
              end
            else
              {:error, "Failed to revoke all PRO grants"}
            end

          {:error, error} ->
            {:error, error}
        end
      end)
    else
      Ash.Changeset.add_error(changeset, "Actor is required to revoke PRO access")
    end
  end
end
