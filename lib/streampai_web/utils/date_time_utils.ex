defmodule StreampaiWeb.Utils.DateTimeUtils do
  @moduledoc """
  Utility functions for date and time formatting across the application.
  Consolidates common date/time operations used in LiveViews and components.
  """

  @doc """
  Formats a duration in seconds into a human-readable string.

  ## Examples

      iex> format_duration(3661)
      "1h 1m"

      iex> format_duration(3600)
      "1h"

      iex> format_duration(150)
      "2m"

      iex> format_duration(0)
      "0m"
  """
  def format_duration(seconds) when is_integer(seconds) do
    hours = div(seconds, 3600)
    minutes = div(rem(seconds, 3600), 60)

    cond do
      hours > 0 and minutes > 0 -> "#{hours}h #{minutes}m"
      hours > 0 -> "#{hours}h"
      minutes > 0 -> "#{minutes}m"
      true -> "0m"
    end
  end

  def format_duration(nil), do: "0m"

  @doc """
  Formats a duration in minutes into a human-readable string with days support.

  ## Examples

      iex> format_duration_minutes(1500)
      "25h 0m"

      iex> format_duration_minutes(2880)
      "2d 0h"
  """
  def format_duration_minutes(minutes) when is_integer(minutes) do
    hours = div(minutes, 60)
    remaining_minutes = rem(minutes, 60)

    cond do
      hours > 24 -> "#{div(hours, 24)}d #{rem(hours, 24)}h"
      hours > 0 -> "#{hours}h #{remaining_minutes}m"
      true -> "#{remaining_minutes}m"
    end
  end

  @doc """
  Formats a DateTime relative to today.

  ## Examples

      iex> format_date(DateTime.utc_now())
      "Today"

      iex> format_date(DateTime.add(DateTime.utc_now(), -86400, :second))
      "Yesterday"
  """
  def format_date(%DateTime{} = datetime) do
    case DateTime.diff(DateTime.utc_now(), datetime, :day) do
      0 -> "Today"
      1 -> "Yesterday"
      days when days < 7 -> "#{days} days ago"
      _ -> Calendar.strftime(datetime, "%b %d, %Y")
    end
  end

  @doc """
  Formats relative time from a DateTime to now.

  ## Examples

      iex> format_relative_time(DateTime.add(DateTime.utc_now(), -30, :second))
      "30s ago"

      iex> format_relative_time(DateTime.add(DateTime.utc_now(), -3600, :second))
      "1h ago"
  """
  def format_relative_time(%DateTime{} = datetime) do
    now = DateTime.utc_now()
    diff_seconds = DateTime.diff(now, datetime)

    cond do
      diff_seconds < 60 -> "#{diff_seconds}s ago"
      diff_seconds < 3600 -> "#{div(diff_seconds, 60)}m ago"
      diff_seconds < 86_400 -> "#{div(diff_seconds, 3600)}h ago"
      true -> "#{div(diff_seconds, 86_400)}d ago"
    end
  end

  @doc """
  Formats a DateTime into a full datetime string.

  ## Examples

      iex> format_datetime(~U[2024-03-15 14:30:00Z])
      "Mar 15, 2024 at 02:30 PM"
  """
  def format_datetime(%DateTime{} = datetime) do
    Calendar.strftime(datetime, "%b %d, %Y at %I:%M %p")
  end

  def format_datetime(%NaiveDateTime{} = datetime) do
    datetime
    |> DateTime.from_naive!("Etc/UTC")
    |> format_datetime()
  end

  @doc """
  Formats a timeline time position for display (e.g., in video players).

  ## Examples

      iex> format_timeline_time(3661, 7200)
      "01:01:01"

      iex> format_timeline_time(150, 600)
      "02:30"
  """
  def format_timeline_time(position_seconds, total_seconds) do
    hours = div(position_seconds, 3600)
    minutes = div(rem(position_seconds, 3600), 60)
    seconds = rem(position_seconds, 60)

    # Include hours in format if total duration is over an hour
    if total_seconds >= 3600 do
      "~2..0B:~2..0B:~2..0B"
      |> :io_lib.format([hours, minutes, seconds])
      |> IO.iodata_to_binary()
    else
      "~2..0B:~2..0B"
      |> :io_lib.format([minutes, seconds])
      |> IO.iodata_to_binary()
    end
  end

  @doc """
  Formats a timeline time based on percentage position.

  ## Examples

      iex> format_timeline_position(%{duration_seconds: 3600}, 50)
      "30:00"
  """
  def format_timeline_position(%{duration_seconds: duration}, position_percentage) do
    seconds_elapsed = round(position_percentage / 100 * duration)
    format_timeline_time(seconds_elapsed, duration)
  end

  @doc """
  Gets a human-readable time period description.

  ## Examples

      iex> describe_time_period(3600)
      "1 hour"

      iex> describe_time_period(7200)
      "2 hours"

      iex> describe_time_period(90)
      "1 minute"
  """
  def describe_time_period(seconds) when seconds < 60, do: "less than a minute"
  def describe_time_period(seconds) when seconds < 120, do: "1 minute"
  def describe_time_period(seconds) when seconds < 3600, do: "#{div(seconds, 60)} minutes"
  def describe_time_period(seconds) when seconds < 7200, do: "1 hour"
  def describe_time_period(seconds), do: "#{div(seconds, 3600)} hours"
end
