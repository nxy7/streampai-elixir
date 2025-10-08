defmodule Streampai.Accounts.User.Preparations.LoadModeratorStatus do
  @moduledoc """
  Loads the is_moderator status by checking granted_roles after the user is loaded.
  This works around Ash reference resolution issues with the calculation.
  """

  use Ash.Resource.Preparation

  require Logger

  def prepare(query, _opts, _context) do
    IO.puts("LoadModeratorStatus: prepare/3 called")

    Ash.Query.after_action(query, fn _query, results ->
      IO.puts("LoadModeratorStatus: after_action callback executing for #{length(results)} users")

      results_with_moderator =
        Enum.map(results, fn user ->
          IO.puts("LoadModeratorStatus: Processing user #{user.id}")

          is_moderator =
            case user.granted_roles do
              %Ash.NotLoaded{} ->
                IO.puts("LoadModeratorStatus: granted_roles not loaded for user #{user.id}, loading...")

                # If granted_roles not loaded, load them
                # We use authorize?: false because the user should be able to see their own roles
                # The parent action (get_by_id) already did authorization
                case Ash.load(user, :granted_roles, authorize?: false) do
                  {:ok, loaded_user} ->
                    IO.puts("LoadModeratorStatus: loaded #{length(loaded_user.granted_roles)} roles")

                    check_moderator_status(loaded_user.granted_roles)

                  error ->
                    IO.puts("LoadModeratorStatus: Failed to load granted_roles: #{inspect(error)}")

                    false
                end

              roles ->
                IO.puts("LoadModeratorStatus: granted_roles already loaded, checking #{length(roles)} roles")

                check_moderator_status(roles)
            end

          IO.puts("LoadModeratorStatus: user #{user.id} is_moderator=#{is_moderator}")
          Map.put(user, :is_moderator, is_moderator)
        end)

      {:ok, results_with_moderator}
    end)
  end

  defp check_moderator_status(roles) when is_list(roles) do
    IO.puts("LoadModeratorStatus: check_moderator_status called with #{length(roles)} roles")

    result =
      Enum.any?(roles, fn role ->
        is_moderator =
          role.role_type == :moderator &&
            role.role_status == :accepted &&
            is_nil(role.revoked_at)

        IO.puts(
          "LoadModeratorStatus: checking role - type: #{role.role_type}, status: #{role.role_status}, revoked: #{!is_nil(role.revoked_at)}, is_moderator: #{is_moderator}"
        )

        is_moderator
      end)

    IO.puts("LoadModeratorStatus: check_moderator_status result: #{result}")
    result
  end

  defp check_moderator_status(_), do: false
end
