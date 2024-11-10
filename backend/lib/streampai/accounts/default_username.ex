defmodule Streampai.Accounts.DefaultUsername do
  @moduledoc """
  Ash resource change that generates a default username from an email address.
  """
  use Ash.Resource.Change

  def change(changeset, _opts, _) do
    # Only generate username if name is not already set
    case Ash.Changeset.get_attribute(changeset, :name) do
      nil ->
        case Ash.Changeset.get_attribute(changeset, :email) do
          nil -> changeset
          email -> set_username_from_email(changeset, email)
        end

      _existing_name ->
        changeset
    end
  end

  defp set_username_from_email(changeset, email) do
    username = generate_username_from_email(email)

    case ensure_unique_username(username) do
      {:ok, final_username} ->
        Ash.Changeset.change_attribute(changeset, :name, final_username)

      {:error, error} ->
        Ash.Changeset.add_error(
          changeset,
          %Ash.Error.Changes.InvalidAttribute{
            field: :name,
            message: "Failed to generate username: #{inspect(error)}"
          }
        )
    end
  end

  defp ensure_unique_username(username) do
    case username_available?(username) do
      {:ok, true} -> {:ok, username}
      {:ok, false} -> {:ok, generate_unique_username(username)}
      error -> error
    end
  end

  defp username_available?(username) do
    query =
      Streampai.Accounts.User
      |> Ash.Query.for_read(:get)
      |> Ash.Query.filter(name == ^username)

    case Ash.read(query) do
      {:ok, []} -> {:ok, true}
      {:ok, _users} -> {:ok, false}
      error -> error
    end
  end

  defp generate_username_from_email(email) do
    email
    |> String.split("@")
    |> List.first()
    # Replace non-alphanumeric chars with underscore
    |> String.replace(~r/[^a-zA-Z0-9_]/, "_")
    # Limit length
    |> String.slice(0, 30)
  end

  defp generate_unique_username(base_username) do
    find_unique_username(base_username, 1)
  end

  defp find_unique_username(base_username, suffix) when suffix <= 100 do
    candidate = "#{base_username}#{suffix}"

    case username_available?(candidate) do
      {:ok, true} -> candidate
      {:ok, false} -> find_unique_username(base_username, suffix + 1)
      {:error, _} -> fallback_username(base_username)
    end
  end

  defp find_unique_username(base_username, _suffix) do
    fallback_username(base_username)
  end

  defp fallback_username(base_username) do
    random_suffix = :rand.uniform(9999)
    "#{base_username}#{random_suffix}"
  end
end
