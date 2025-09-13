defmodule StreampaiWeb.LiveHelpers.FormHelpers do
  @moduledoc """
  Shared helper functions for form validation and parsing across LiveViews.
  """

  @doc """
  Parses a donation amount from various input formats.
  Handles both string and number inputs, with proper validation.
  """
  def parse_donation_amount(nil), do: nil
  def parse_donation_amount(""), do: nil

  def parse_donation_amount(amount) when is_binary(amount) do
    case Float.parse(amount) do
      {parsed_amount, ""} -> Float.round(parsed_amount, 2)
      {parsed_amount, "."} -> Float.round(parsed_amount, 2)
      _ -> nil
    end
  end

  def parse_donation_amount(amount) when is_number(amount) and amount > 0 do
    Float.round(amount, 2)
  end

  def parse_donation_amount(_), do: nil

  @doc """
  Validates a donation amount against user preferences.
  Returns {:ok, amount} or {:error, message}.
  """
  def validate_donation_amount(nil, _preferences) do
    {:error, "Please select or enter a valid donation amount"}
  end

  def validate_donation_amount(amount, _preferences) when amount <= 0 do
    {:error, "Donation amount must be greater than 0"}
  end

  def validate_donation_amount(amount, preferences) do
    min_amount = Map.get(preferences, :min_donation_amount)
    max_amount = Map.get(preferences, :max_donation_amount)
    currency = Map.get(preferences, :donation_currency, "USD")

    cond do
      min_amount && amount < min_amount ->
        {:error, "Minimum donation amount is #{currency} #{min_amount}"}

      max_amount && amount > max_amount ->
        {:error, "Maximum donation amount is #{currency} #{max_amount}"}

      true ->
        {:ok, amount}
    end
  end

  @doc """
  Filters preset amounts based on user preferences.
  """
  def filter_preset_amounts(base_amounts \\ [5, 10, 25, 50], preferences) do
    min_amount = Map.get(preferences, :min_donation_amount)
    max_amount = Map.get(preferences, :max_donation_amount)

    Enum.filter(base_amounts, fn amount ->
      (is_nil(min_amount) || amount >= min_amount) &&
        (is_nil(max_amount) || amount <= max_amount)
    end)
  end

  @doc """
  Gets the final donation amount from socket assigns, handling both selected and custom amounts.
  """
  def get_donation_amount(%{selected_amount: amount}) when not is_nil(amount), do: amount

  def get_donation_amount(%{custom_amount: custom}) when custom != "", do: parse_donation_amount(custom)

  def get_donation_amount(_assigns), do: nil

  @doc """
  Parses numeric settings with validation.
  """
  def parse_numeric_setting(value, opts \\ [])

  def parse_numeric_setting(value, opts) when is_binary(value) do
    case Integer.parse(value) do
      {num, ""} -> validate_numeric_range(num, opts)
      _ -> Keyword.get(opts, :default, 0)
    end
  end

  def parse_numeric_setting(value, opts) when is_integer(value) do
    validate_numeric_range(value, opts)
  end

  def parse_numeric_setting(_, opts), do: Keyword.get(opts, :default, 0)

  defp validate_numeric_range(value, opts) do
    min = Keyword.get(opts, :min)
    max = Keyword.get(opts, :max)
    default = Keyword.get(opts, :default, value)

    cond do
      min && value < min -> default
      max && value > max -> default
      true -> value
    end
  end
end
