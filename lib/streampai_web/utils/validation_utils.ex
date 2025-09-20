defmodule StreampaiWeb.Utils.ValidationUtils do
  @moduledoc """
  Common validation utilities for form inputs and settings.
  Provides consistent validation rules across the application.
  """

  @doc """
  Parses a numeric value from a string input with optional constraints.

  ## Examples

      iex> parse_numeric_setting("10", min: 1, max: 100)
      10

      iex> parse_numeric_setting("200", min: 1, max: 100)
      100

      iex> parse_numeric_setting("invalid", min: 1, max: 100, default: 5)
      5
  """
  def parse_numeric_setting(value, opts \\ []) do
    min = Keyword.get(opts, :min)
    max = Keyword.get(opts, :max)
    default = Keyword.get(opts, :default)

    case parse_number(value) do
      {:ok, num} ->
        num
        |> apply_min(min)
        |> apply_max(max)

      :error ->
        default || min || 0
    end
  end

  defp parse_number(value) when is_integer(value), do: {:ok, value}
  defp parse_number(value) when is_float(value), do: {:ok, round(value)}

  defp parse_number(value) when is_binary(value) do
    case Integer.parse(value) do
      {num, ""} -> {:ok, num}
      _ -> :error
    end
  end

  defp parse_number(_), do: :error

  defp apply_min(num, nil), do: num
  defp apply_min(num, min) when num < min, do: min
  defp apply_min(num, _min), do: num

  defp apply_max(num, nil), do: num
  defp apply_max(num, max) when num > max, do: max
  defp apply_max(num, _max), do: num

  @doc """
  Validates and sanitizes a hex color value.

  ## Examples

      iex> validate_hex_color("#ff0000")
      "#ff0000"

      iex> validate_hex_color("invalid", "#000000")
      "#000000"

      iex> validate_hex_color("#abc")
      "#aabbcc"
  """
  def validate_hex_color(value, default \\ "#000000") do
    cond do
      # Valid 6-digit hex
      String.match?(value, ~r/^#[0-9A-Fa-f]{6}$/) ->
        value

      # Valid 3-digit hex (expand to 6)
      String.match?(value, ~r/^#[0-9A-Fa-f]{3}$/) ->
        expand_short_hex(value)

      # Missing # but valid hex
      String.match?(value, ~r/^[0-9A-Fa-f]{6}$/) ->
        "#" <> value

      true ->
        default
    end
  end

  defp expand_short_hex("#" <> hex) when byte_size(hex) == 3 do
    <<r::binary-1, g::binary-1, b::binary-1>> = hex
    "#" <> r <> r <> g <> g <> b <> b
  end

  @doc """
  Validates a value against a list of allowed values.

  ## Examples

      iex> validate_enum_value("option1", ["option1", "option2"], "default")
      "option1"

      iex> validate_enum_value("invalid", ["option1", "option2"], "default")
      "default"
  """
  def validate_enum_value(value, allowed_values, default) do
    if value in allowed_values, do: value, else: default
  end

  @doc """
  Validates and truncates a string to a maximum length.

  ## Examples

      iex> validate_string_length("hello world", 5)
      "hello"

      iex> validate_string_length("hi", 10)
      "hi"
  """
  def validate_string_length(value, max_length) when is_binary(value) do
    String.slice(value, 0, max_length)
  end

  def validate_string_length(_, _), do: ""

  @doc """
  Validates a URL format.

  ## Examples

      iex> validate_url("https://example.com")
      {:ok, "https://example.com"}

      iex> validate_url("invalid-url")
      {:error, "Invalid URL format"}
  """
  def validate_url(url) when is_binary(url) do
    case URI.parse(url) do
      %URI{scheme: scheme, host: host} when scheme in ["http", "https"] and is_binary(host) ->
        {:ok, url}

      _ ->
        {:error, "Invalid URL format"}
    end
  end

  def validate_url(_), do: {:error, "URL must be a string"}

  @doc """
  Validates an email address format.

  ## Examples

      iex> validate_email("user@example.com")
      {:ok, "user@example.com"}

      iex> validate_email("invalid-email")
      {:error, "Invalid email format"}
  """
  def validate_email(email) when is_binary(email) do
    if String.match?(email, ~r/^[^\s@]+@[^\s@]+\.[^\s@]+$/) do
      {:ok, email}
    else
      {:error, "Invalid email format"}
    end
  end

  def validate_email(_), do: {:error, "Email must be a string"}

  @doc """
  Validates a percentage value (0-100).

  ## Examples

      iex> validate_percentage("50")
      50

      iex> validate_percentage("150")
      100

      iex> validate_percentage("-10")
      0
  """
  def validate_percentage(value) do
    parse_numeric_setting(value, min: 0, max: 100, default: 0)
  end

  @doc """
  Validates a currency symbol.

  ## Examples

      iex> validate_currency("$")
      "$"

      iex> validate_currency("invalid")
      "$"
  """
  def validate_currency(value) do
    valid_currencies = ["$", "€", "£", "¥", "₹", "₽", "¢", "₱", "₹", "₨"]
    if value in valid_currencies, do: value, else: "$"
  end

  @doc """
  Parses multiple setting values based on field type.

  ## Examples

      iex> parse_setting_value("max_messages", "10")
      10

      iex> parse_setting_value("some_field", "value")
      "value"
  """
  def parse_setting_value(field, value)
      when field in ["max_messages", "message_fade_time", "display_duration", "animation_duration"] do
    parse_numeric_setting(value, min: 0)
  end

  def parse_setting_value(_field, value), do: value

  @doc """
  Filters preset amounts based on user preferences.

  ## Examples

      iex> filter_preset_amounts([5, 10, 25], %{min_amount: 10})
      [10, 25]
  """
  def filter_preset_amounts(amounts, %{min_amount: min} = _preferences) when is_number(min) do
    Enum.filter(amounts, &(&1 >= min))
  end

  def filter_preset_amounts(amounts, _preferences), do: amounts
end
