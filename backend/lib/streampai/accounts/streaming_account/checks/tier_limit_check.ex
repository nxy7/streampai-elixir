defmodule Streampai.Accounts.StreamingAccount.Checks.TierLimitCheck do
  @moduledoc """
  Policy check to enforce tier-based limits on streaming account creation.

  Free tier users can only connect 1 streaming account.
  Pro tier users have unlimited connections.
  """
  use Ash.Policy.SimpleCheck

  @impl true
  def describe(_options) do
    "user is within tier limits for streaming account connections"
  end

  @impl true
  def match?(actor, %{changeset: %Ash.Changeset{} = changeset}, _options) do
    user_id = actor.id
    platform = Ash.Changeset.get_attribute(changeset, :platform)

    {:ok, user} = get_user_with_tier(actor, user_id)
    check_tier_limits(user, platform)
  end

  @impl true
  def match?(_actor, _context, _options), do: false

  # Private helper functions

  defp get_user_with_tier(actor, user_id) do
    if actor && Map.get(actor, :id) == user_id do
      # Load the user with tier information
      import Ash.Query

      case Streampai.Accounts.User
           |> for_read(:get, %{}, actor: actor)
           |> filter(id == ^user_id)
           |> Ash.read_one() do
        {:ok, user} when not is_nil(user) -> {:ok, user}
        _ -> {:error, :user_not_found}
      end
    else
      {:error, :unauthorized}
    end
  end

  defp check_tier_limits(user, _) do
    case user.tier do
      :pro ->
        true

      :free ->
        if user.connected_platforms >= 1 do
          false
        else
          true
        end

      _ ->
        if user.connected_platforms >= 1 do
          false
        else
          true
        end
    end
  end
end
