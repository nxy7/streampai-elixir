defmodule Streampai.Accounts.NameValidator do
  @moduledoc """
  Centralized name validation logic for user display names.

  This module handles all business rules around user name validation,
  availability checking, and formatting requirements.
  """

  alias Streampai.Accounts.User

  @name_regex ~r/^[a-zA-Z0-9_]+$/
  @min_length 3
  @max_length 30

  @doc """
  Validates name availability for a given user.

  ## Parameters
  - name: The name to check
  - current_user: The user requesting the name change

  ## Returns
  - {:ok, :available, message} if name is available
  - {:ok, :current_name, message} if it's the user's current name
  - {:error, reason, message} if name is invalid or taken
  """
  def validate_availability(name, current_user) do
    with :ok <- validate_format(name),
         :ok <- validate_length(name),
         :ok <- validate_uniqueness(name, current_user) do
      if name == current_user.name do
        {:ok, :current_name, "This is your current name"}
      else
        {:ok, :available, "Name is available"}
      end
    else
      {:error, reason} -> {:error, reason, format_error_message(reason)}
    end
  end

  @doc """
  Validates just the format and length of a name without checking availability.

  Useful for client-side validation before making server requests.
  """
  def validate_format_and_length(name) do
    with :ok <- validate_format(name),
         :ok <- validate_length(name) do
      :ok
    else
      {:error, reason} -> {:error, reason, format_error_message(reason)}
    end
  end

  @doc """
  Gets the validation rules as a map for client-side reference.
  """
  def validation_rules do
    %{
      min_length: @min_length,
      max_length: @max_length,
      pattern: @name_regex,
      allowed_chars: "letters, numbers, and underscores"
    }
  end

  # Private validation functions

  defp validate_format(name) when is_binary(name) do
    if Regex.match?(@name_regex, name) do
      :ok
    else
      {:error, :invalid_format}
    end
  end

  defp validate_format(_), do: {:error, :invalid_format}

  defp validate_length(name) when is_binary(name) do
    length = String.length(name)

    cond do
      length < @min_length -> {:error, :too_short}
      length > @max_length -> {:error, :too_long}
      true -> :ok
    end
  end

  defp validate_uniqueness(name, current_user) do
    import Ash.Query
    query = User |> for_read(:read) |> filter(name == ^name)

    case Ash.read(query) do
      {:ok, users} ->
        taken =
          Enum.any?(users, fn user ->
            user.name == name && user.id != current_user.id
          end)

        if taken do
          {:error, :name_taken}
        else
          :ok
        end

      {:error, error} ->
        error |> dbg
        {:error, :validation_error}
    end
  end

  defp format_error_message(:too_short), do: "Name must be at least #{@min_length} characters"
  defp format_error_message(:too_long), do: "Name must be no more than #{@max_length} characters"

  defp format_error_message(:invalid_format),
    do: "Name can only contain letters, numbers, and underscores"

  defp format_error_message(:name_taken), do: "This name is already taken"
  defp format_error_message(:validation_error), do: "Error checking name availability"
  defp format_error_message(_), do: "Invalid name"

  @doc """
  Sanitizes a name by removing invalid characters and trimming to valid length.

  This is useful for generating names from other sources (like email addresses).
  """
  def sanitize_name(input) when is_binary(input) do
    input
    |> String.trim()
    |> String.replace(~r/[^a-zA-Z0-9_]/, "_")
    |> String.slice(0, @max_length)
    |> ensure_minimum_length()
  end

  def sanitize_name(_), do: "user"

  defp ensure_minimum_length(name) when byte_size(name) >= @min_length, do: name
  defp ensure_minimum_length(_), do: "user"

  @doc """
  Generates a help text string for name validation rules.
  """
  def validation_help_text do
    "Name must be #{@min_length}-#{@max_length} characters and contain only letters, numbers, and underscores"
  end
end
