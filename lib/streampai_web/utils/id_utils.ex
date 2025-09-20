defmodule StreampaiWeb.Utils.IdUtils do
  @moduledoc """
  Utilities for generating IDs across the application.
  Provides consistent ID generation patterns.
  """

  @doc """
  Generates a random event ID for widgets and alerts.

  ## Examples

      iex> generate_event_id()
      "a1b2c3d4e5f6g7h8"
  """
  def generate_event_id do
    8 |> :crypto.strong_rand_bytes() |> Base.encode16() |> String.downcase()
  end

  @doc """
  Generates a random UUID string.

  ## Examples

      iex> generate_uuid()
      "550e8400-e29b-41d4-a716-446655440000"
  """
  def generate_uuid do
    Ecto.UUID.generate()
  end

  @doc """
  Generates a short random ID for temporary use.

  ## Examples

      iex> generate_short_id()
      "abc123"

      iex> generate_short_id(10)
      "abc123def4"
  """
  def generate_short_id(length \\ 6) do
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"

    Enum.map_join(1..length, fn _ -> String.at(chars, :rand.uniform(String.length(chars)) - 1) end)
  end

  @doc """
  Generates a session-based ID with timestamp.

  ## Examples

      iex> generate_session_id()
      "session_1234567890_abc123"
  """
  def generate_session_id do
    timestamp = DateTime.to_unix(DateTime.utc_now())
    random_part = generate_short_id(6)
    "session_#{timestamp}_#{random_part}"
  end

  @doc """
  Generates a prefixed ID.

  ## Examples

      iex> generate_prefixed_id("widget")
      "widget_a1b2c3d4"

      iex> generate_prefixed_id("alert", 12)
      "alert_a1b2c3d4e5f6"
  """
  def generate_prefixed_id(prefix, length \\ 8) do
    suffix =
      length
      |> div(2)
      |> :crypto.strong_rand_bytes()
      |> Base.encode16()
      |> String.downcase()

    "#{prefix}_#{suffix}"
  end

  @doc """
  Validates if a string looks like a valid UUID.

  ## Examples

      iex> valid_uuid?("550e8400-e29b-41d4-a716-446655440000")
      true

      iex> valid_uuid?("invalid-uuid")
      false
  """
  def valid_uuid?(uuid) when is_binary(uuid) do
    case Ecto.UUID.cast(uuid) do
      {:ok, _} -> true
      :error -> false
    end
  end

  def valid_uuid?(_), do: false
end
