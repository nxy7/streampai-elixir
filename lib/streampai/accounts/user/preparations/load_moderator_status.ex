defmodule Streampai.Accounts.User.Preparations.LoadModeratorStatus do
  @moduledoc """
  Loads the is_moderator status by checking granted_roles after the user is loaded.
  This works around Ash reference resolution issues with the calculation.
  """

  use Ash.Resource.Preparation

  require Logger

  def prepare(query, _opts, _context) do
    Ash.Query.after_action(query, fn _query, results ->
      results_with_moderator = Enum.map(results, &load_moderator_status/1)
      {:ok, results_with_moderator}
    end)
  end

  defp load_moderator_status(user) do
    is_moderator = get_moderator_status(user.granted_roles, user)
    Map.put(user, :is_moderator, is_moderator)
  end

  defp get_moderator_status(%Ash.NotLoaded{}, user) do
    case Ash.load(user, :granted_roles, authorize?: true, actor: user) do
      {:ok, loaded_user} -> check_moderator_status(loaded_user.granted_roles)
      _error -> false
    end
  end

  defp get_moderator_status(roles, _user), do: check_moderator_status(roles)

  defp check_moderator_status(roles) when is_list(roles) do
    Enum.any?(roles, fn role ->
      role.role_type == :moderator &&
        role.role_status == :accepted &&
        is_nil(role.revoked_at)
    end)
  end

  defp check_moderator_status(_), do: false
end
