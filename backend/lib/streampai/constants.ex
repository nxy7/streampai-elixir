defmodule Streampai.Constants do
  @moduledoc """
  Application-wide constants including billing limits, validation rules, and configuration values.
  """
  # Billing & Limits
  @free_tier_hour_limit 7
  @free_tier_data_retention_days 3
  @money_back_guarantee_days 30

  # User Validation
  @username_min_length 3
  @username_max_length 30
  @password_min_length 8

  # Database Field Limits
  @chat_message_max_length 500
  @username_field_max_length 100
  @short_text_max_length 100
  @description_max_length 500
  @url_max_length 255
  @currency_code_max_length 3

  # Admin Configuration
  @admin_email "lolnoxy@gmail.com"

  # Timeout Values (milliseconds)
  @default_timeout 10_000

  # Public getters
  def free_tier_hour_limit, do: @free_tier_hour_limit
  def free_tier_data_retention_days, do: @free_tier_data_retention_days
  def money_back_guarantee_days, do: @money_back_guarantee_days

  def username_min_length, do: @username_min_length
  def username_max_length, do: @username_max_length
  def password_min_length, do: @password_min_length

  def chat_message_max_length, do: @chat_message_max_length
  def username_field_max_length, do: @username_field_max_length
  def short_text_max_length, do: @short_text_max_length
  def description_max_length, do: @description_max_length
  def url_max_length, do: @url_max_length
  def currency_code_max_length, do: @currency_code_max_length

  def admin_email, do: @admin_email
  def default_timeout, do: @default_timeout
end
