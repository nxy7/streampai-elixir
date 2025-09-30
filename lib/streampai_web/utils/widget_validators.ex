defmodule StreampaiWeb.Utils.WidgetValidators do
  @moduledoc """
  Centralized validation functions for widget settings.
  Eliminates duplication across widget settings LiveView modules.
  """

  alias StreampaiWeb.Utils.WidgetHelpers

  @doc """
  Validates font size setting.
  """
  def validate_font_size(value) do
    validate_enum(value, ["small", "medium", "large"], "medium")
  end

  @doc """
  Validates animation type setting.
  """
  def validate_animation_type(value) do
    validate_enum(value, ["fade", "slide", "bounce"], "fade")
  end

  @doc """
  Validates display style setting.
  """
  def validate_display_style(value) do
    validate_enum(value, ["minimal", "detailed", "cards"], "detailed")
  end

  @doc """
  Validates alert position setting.
  """
  def validate_alert_position(value) do
    validate_enum(value, ["top", "center", "bottom"], "center")
  end

  @doc """
  Validates transition type setting.
  """
  def validate_transition_type(value) do
    validate_enum(value, ["fade", "slide", "zoom"], "fade")
  end

  @doc """
  Validates fit mode setting for images/media.
  """
  def validate_fit_mode(value) do
    validate_enum(value, ["contain", "cover", "fill"], "contain")
  end

  @doc """
  Generic enum validator.
  """
  def validate_enum(value, allowed_values, default) do
    if value in allowed_values, do: value, else: default
  end

  @doc """
  Validates a hex color value.
  """
  def validate_hex_color(value, default) do
    WidgetHelpers.validate_hex_color(value, default)
  end

  @doc """
  Validates a numeric setting within a range.
  """
  def validate_numeric(value, opts) do
    WidgetHelpers.parse_numeric_setting(value, opts)
  end
end
