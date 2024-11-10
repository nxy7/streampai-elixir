defmodule Streampai.Pricing do
  @moduledoc """
  Centralized pricing configuration for Streampai subscription plans.
  """

  @monthly_price_usd 49.99
  @yearly_price_usd Float.round(@monthly_price_usd * 10) - 0.01

  @doc """
  Returns the monthly subscription price in USD.
  """
  def monthly_price, do: @monthly_price_usd

  @doc """
  Returns the yearly subscription price in USD.
  """
  def yearly_price, do: @yearly_price_usd

  @doc """
  Returns the monthly price formatted as a string with dollar sign.
  """
  def monthly_price_formatted, do: "$#{:erlang.float_to_binary(@monthly_price_usd, decimals: 2)}"

  @doc """
  Returns the yearly price formatted as a string with dollar sign.
  """
  def yearly_price_formatted, do: "$#{:erlang.float_to_binary(@yearly_price_usd, decimals: 2)}"

  @doc """
  Calculates the yearly discount percentage compared to 12 monthly payments.
  """
  def yearly_discount_percentage do
    monthly_total = @monthly_price_usd * 12
    savings = monthly_total - @yearly_price_usd
    discount_percent = savings / monthly_total * 100
    Float.round(discount_percent, 1)
  end

  @doc """
  Returns formatted yearly discount percentage.
  """
  def yearly_discount_formatted, do: "#{yearly_discount_percentage()}%"

  @doc """
  Returns the monthly equivalent price when paying yearly.
  """
  def yearly_monthly_equivalent, do: @yearly_price_usd / 12

  @doc """
  Returns the monthly equivalent price when paying yearly, formatted.
  """
  def yearly_monthly_equivalent_formatted do
    "$#{:erlang.float_to_binary(yearly_monthly_equivalent(), decimals: 2)}"
  end
end
