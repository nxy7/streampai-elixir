defmodule StreampaiWeb.GraphQL.Resolvers.UserResolver do
  @moduledoc """
  GraphQL resolver for user operations.
  """

  alias Streampai.Accounts.User

  def update_name(_parent, %{name: name}, resolution) do
    actor = resolution.context[:actor]

    if actor do
      case User.update_name(actor, %{name: name}, actor: actor) do
        {:ok, updated_user} ->
          {:ok, %{id: updated_user.id, name: updated_user.name}}

        {:error, %Ash.Error.Invalid{} = error} ->
          message =
            Enum.map_join(error.errors, ", ", fn e -> e.message end)

          {:error, message}

        {:error, error} ->
          {:error, inspect(error)}
      end
    else
      {:error, "Not authenticated"}
    end
  end
end
