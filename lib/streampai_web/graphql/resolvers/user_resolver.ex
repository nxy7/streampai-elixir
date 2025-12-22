defmodule StreampaiWeb.GraphQL.Resolvers.UserResolver do
  @moduledoc """
  GraphQL resolver for user operations.
  """

  alias Streampai.Accounts.User

  def update_name(_parent, %{name: name}, resolution) do
    actor = resolution.context[:actor]

    unless actor do
      {:error, "Not authenticated"}
    else
      case User.update_name(actor, %{name: name}, actor: actor) do
        {:ok, updated_user} ->
          {:ok, %{id: updated_user.id, name: updated_user.name}}

        {:error, %Ash.Error.Invalid{} = error} ->
          message =
            error.errors
            |> Enum.map(fn e -> e.message end)
            |> Enum.join(", ")

          {:error, message}

        {:error, error} ->
          {:error, inspect(error)}
      end
    end
  end
end
