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
end
