defmodule Streampai.Accounts.User.Preparations.ExtendUserData do
  @moduledoc """
  Extends a user with additional data by performing a secondary query to load
  extended user information after the initial query is executed.
  """

  use Ash.Resource.Preparation
  alias Streampai.Accounts.User

  @impl true
  def prepare(query, _opts, _context) do
    Ash.Query.after_action(query, fn _query, [user] ->
      extended_user =
        User
        |> Ash.Query.for_read(:get_by_id, %{id: user.id}, actor: %{id: user.id})
        |> Ash.read_one!()

      {:ok, [extended_user]}
    end)
  end
end