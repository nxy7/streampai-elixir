defmodule Streampai.Accounts.User.Changes.ValidateAndCheckNameUniqueness do
  @moduledoc """
  Validates user name format and checks for uniqueness.
  """

  use Ash.Resource.Change

  alias Streampai.Accounts.User

  @impl true
  def change(changeset, _opts, _context) do
    name = Ash.Changeset.get_attribute(changeset, :name)

    if name do
      changeset
      |> validate_name_format(name)
      |> check_name_uniqueness(name)
    else
      changeset
    end
  end

  defp validate_name_format(changeset, name) do
    # Convert CiString to plain string for validation
    name_str = to_string(name)

    cond do
      String.length(name_str) < Streampai.Constants.username_min_length() ->
        Ash.Changeset.add_error(
          changeset,
          field: :name,
          message: "Name must be at least #{Streampai.Constants.username_min_length()} characters"
        )

      String.length(name_str) > Streampai.Constants.username_max_length() ->
        Ash.Changeset.add_error(
          changeset,
          field: :name,
          message: "Name must be no more than #{Streampai.Constants.username_max_length()} characters"
        )

      !Regex.match?(~r/^[a-zA-Z0-9_]+$/, name_str) ->
        Ash.Changeset.add_error(
          changeset,
          field: :name,
          message: "Name can only contain letters, numbers, and underscores"
        )

      true ->
        changeset
    end
  end

  defp check_name_uniqueness(changeset, name) do
    if changeset.valid? do
      import Ash.Query

      case User
           |> filter(name == ^name and id != ^changeset.data.id)
           |> for_read(:get)
           |> select([:id])
           |> limit(1)
           |> Ash.read() do
        {:ok, []} ->
          changeset

        {:ok, [_user]} ->
          Ash.Changeset.add_error(changeset, field: :name, message: "This name is already taken")

        {:ok, _users} ->
          Ash.Changeset.add_error(changeset, field: :name, message: "This name is already taken")

        {:error, error} ->
          require Logger

          Logger.error("Failed to validate name availability: #{inspect(error)}")

          Ash.Changeset.add_error(
            changeset,
            field: :name,
            message: "Unable to validate name availability. Please try again."
          )
      end
    else
      changeset
    end
  end
end
