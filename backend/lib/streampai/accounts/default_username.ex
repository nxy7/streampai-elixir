defmodule Streampai.Accounts.DefaultUsername do
  use Ash.Resource.Change

  def change(changeset, _opts, _) do
    email = Ash.Changeset.get_attribute(changeset, :email)
    
    # Skip if email is nil (might happen during form building)
    if is_nil(email) do
      changeset
    else
      username = generate_username_from_email(email)

      # Check if the username already exists
      query =
        Streampai.Accounts.User
        |> Ash.Query.filter(name == ^username)

      case Ash.read(query) do
        {:ok, []} ->
          # Username is unique, set it
          Ash.Changeset.change_attribute(changeset, :name, username)

        {:ok, _} ->
          # Username exists, generate a unique one
          unique_username = generate_unique_username(username)
          Ash.Changeset.change_attribute(changeset, :name, unique_username)

        {:error, error} ->
          # Handle error case
          Ash.Changeset.add_error(
            changeset,
            :name,
            "Failed to generate username: #{inspect(error)}"
          )
      end
    end
  end

  defp generate_username_from_email(email) do
    email
    |> String.split("@")
    |> List.first()
    |> String.replace(~r/[^a-zA-Z0-9_]/, "_")  # Replace non-alphanumeric chars with underscore
    |> String.slice(0, 30)  # Limit length
  end

  defp generate_unique_username(username) do
    find_unique_username(username, 1)
  end

  defp find_unique_username(base_username, suffix) do
    candidate = "#{base_username}#{suffix}"
    
    query =
      Streampai.Accounts.User
      |> Ash.Query.filter(name == ^candidate)

    case Ash.read(query) do
      {:ok, []} -> candidate
      {:ok, _} -> find_unique_username(base_username, suffix + 1)
      {:error, _error} -> "#{base_username}#{:rand.uniform(9999)}"  # Fallback to random
    end
  end
end
