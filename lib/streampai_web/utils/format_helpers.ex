defmodule StreampaiWeb.Utils.FormatHelpers do
  @moduledoc """
  Formatting utilities for displaying numbers, dates, and other data types
  consistently across the application.
  """

  @doc """
  Formats a number with thousand separators.

  ## Examples

      iex> format_number(1000)
      "1,000"

      iex> format_number(1234567)
      "1,234,567"

      iex> format_number(123.45)
      "123"
  """
  def format_number(number) when is_integer(number) do
    number
    |> Integer.to_string()
    |> String.graphemes()
    |> Enum.reverse()
    |> Enum.chunk_every(3)
    |> Enum.join(",")
    |> String.reverse()
  end

  def format_number(number) when is_float(number) do
    format_number(round(number))
  end

  def format_number(number), do: to_string(number)

  @doc """
  Formats a value based on the specified format type.

  ## Examples

      iex> format_value(1000, :currency)
      "$1,000"

      iex> format_value(45.5, :percentage)
      "45.5%"

      iex> format_value(30, :duration)
      "30 min"
  """
  def format_value(value, format) do
    case format do
      :currency ->
        "$#{format_number(Float.round(value, 2))}"

      :percentage ->
        "#{Float.round(value, 1)}%"

      :duration ->
        "#{value} min"

      _ ->
        if is_float(value) do
          format_number(Float.round(value, 0))
        else
          format_number(value)
        end
    end
  end

  @doc """
  Formats a DateTime for chart display.

  ## Examples

      iex> format_chart_date(~U[2023-09-15 10:30:00Z])
      "Sep 15"
  """
  def format_chart_date(datetime) do
    Calendar.strftime(datetime, "%b %d")
  end

  @doc """
  Formats a datetime relative to now (e.g., "2 days ago", "Yesterday").

  ## Examples

      iex> format_date_relative(~N[2023-01-01 12:00:00])
      # Would return something like "3 months ago" depending on current date

  """
  def format_date_relative(datetime) when is_struct(datetime, NaiveDateTime) do
    case NaiveDateTime.diff(NaiveDateTime.utc_now(), datetime, :day) do
      0 -> "Today"
      1 -> "Yesterday"
      days when days < 7 -> "#{days} days ago"
      days when days < 30 -> "#{div(days, 7)} weeks ago"
      days -> "#{div(days, 30)} months ago"
    end
  end

  @doc """
  Formats file size in bytes to human-readable format.

  ## Examples

      iex> format_file_size(1024)
      "1.0 KB"

      iex> format_file_size(1048576)
      "1.0 MB"

      iex> format_file_size(500)
      "500 B"
  """
  def format_file_size(bytes) when bytes < 1024, do: "#{bytes} B"
  def format_file_size(bytes) when bytes < 1024 * 1024, do: "#{Float.round(bytes / 1024, 1)} KB"
  def format_file_size(bytes), do: "#{Float.round(bytes / (1024 * 1024), 1)} MB"

  @doc """
  Formats uptime in milliseconds to human-readable format.

  ## Examples

      iex> format_uptime(3661000)
      "1h 1m 1s"

      iex> format_uptime(60000)
      "1m 0s"
  """
  def format_uptime(uptime_ms) do
    seconds = div(uptime_ms, 1000)
    minutes = div(seconds, 60)
    hours = div(minutes, 60)

    remaining_seconds = rem(seconds, 60)
    remaining_minutes = rem(minutes, 60)

    cond do
      hours > 0 -> "#{hours}h #{remaining_minutes}m #{remaining_seconds}s"
      minutes > 0 -> "#{remaining_minutes}m #{remaining_seconds}s"
      true -> "#{remaining_seconds}s"
    end
  end

  @doc """
  Formats changeset errors into a readable string.

  ## Examples

      iex> format_changeset_errors(%Ecto.Changeset{errors: [name: {"can't be blank", []}]})
      "name: can't be blank"
  """
  def format_changeset_errors(%Ecto.Changeset{errors: errors}) do
    case Enum.map_join(errors, ", ", fn {field, {message, _}} -> "#{field}: #{message}" end) do
      "" -> "Invalid data provided"
      formatted -> formatted
    end
  end
end
