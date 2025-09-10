defmodule StreampaiWeb.Utils.WidgetHelpers do
  @moduledoc """
  Common utilities and helpers for widget functionality.

  This module provides shared utilities for:
  - Parameter parsing and validation
  - Configuration merging and updating
  - URL generation for OBS browser sources
  - Common widget validation logic
  """

  @doc """
  Generates OBS browser source URL for a widget.

  This function should be used in templates/assigns where url/1 helper is available.
  For programmatic URL generation, use the Phoenix router helpers directly.

  ## Examples

      # In a template:
      url(~p"/widgets/chat/display?user_id=123")
  """
  def generate_browser_source_path(widget_type, user_id) do
    widget_path =
      case widget_type do
        :chat_widget -> "chat"
        :alertbox_widget -> "alertbox"
        _ -> raise ArgumentError, "Unsupported widget type: #{inspect(widget_type)}"
      end

    "/widgets/#{widget_path}/display?user_id=#{user_id}"
  end

  @doc """
  Parses and validates numeric settings from form parameters.

  ## Examples

      iex> parse_numeric_setting("5", min: 1, max: 10)
      5
      
      iex> parse_numeric_setting("15", min: 1, max: 10) 
      10
      
      iex> parse_numeric_setting("invalid", min: 1, max: 10, default: 5)
      5
  """
  def parse_numeric_setting(value, opts \\ [])

  def parse_numeric_setting(value, opts) when is_binary(value) do
    min_val = Keyword.get(opts, :min, 0)
    max_val = Keyword.get(opts, :max, 1000)
    default_val = Keyword.get(opts, :default, min_val)

    case Integer.parse(value) do
      {num, ""} -> max(min_val, min(max_val, num))
      _ -> default_val
    end
  end

  def parse_numeric_setting(value, opts) when is_integer(value) do
    min_val = Keyword.get(opts, :min, 0)
    max_val = Keyword.get(opts, :max, 1000)
    max(min_val, min(max_val, value))
  end

  def parse_numeric_setting(_, opts) do
    Keyword.get(opts, :default, 0)
  end

  @doc """
  Extracts setting key-value pairs from form parameters.

  Handles both direct setting/value pairs and target-based form updates.

  ## Examples

      iex> extract_setting_from_params(%{"setting" => "max_messages", "value" => "25"})
      {"max_messages", "25"}
      
      iex> extract_setting_from_params(%{"_target" => ["font_size"], "font_size" => "large"})
      {"font_size", "large"}
  """
  def extract_setting_from_params(params, default_setting \\ {"unknown", ""}) do
    case params do
      %{"setting" => setting, "value" => value} ->
        {setting, value}

      %{"_target" => [field]} = p when is_map_key(p, field) ->
        {field, Map.get(p, field)}

      _ ->
        default_setting
    end
  end

  @doc """
  Updates widget configuration with mixed settings from form parameters.

  This function handles both boolean toggles and other setting types in a unified way.
  Boolean fields are detected by checking if the value is "on" (checkbox pattern).
  Other fields are extracted and processed according to their key patterns.

  ## Examples

      iex> config = %{show_badges: true, max_messages: 25}
      iex> params = %{"show_badges" => "on", "max_messages" => "30"}
      iex> update_unified_settings(config, params)
      %{show_badges: true, max_messages: 30}
  """
  def update_unified_settings(config, params, opts \\ []) do
    # Extract boolean fields (those with "on" values indicating checkboxes)
    {boolean_params, other_params} =
      Enum.split_with(params, fn {_key, value} -> value == "on" end)

    # Process boolean settings
    config_with_booleans =
      Enum.reduce(boolean_params, config, fn {field_str, _value}, acc_config ->
        try do
          field_atom = String.to_existing_atom(field_str)
          Map.put(acc_config, field_atom, true)
        rescue
          # Skip invalid field names
          ArgumentError -> acc_config
        end
      end)

    # Add any boolean fields that weren't present (unchecked checkboxes)
    boolean_fields = Keyword.get(opts, :boolean_fields, [])

    config_with_all_booleans =
      Enum.reduce(boolean_fields, config_with_booleans, fn field, acc_config ->
        field_str = Atom.to_string(field)

        if Map.has_key?(params, field_str) do
          # Already processed above
          acc_config
        else
          # Checkbox was unchecked
          Map.put(acc_config, field, false)
        end
      end)

    # Process other settings
    converter_fn = Keyword.get(opts, :converter, fn _key, value -> value end)

    Enum.reduce(other_params, config_with_all_booleans, fn {field_str, value}, acc_config ->
      try do
        field_atom = String.to_existing_atom(field_str)
        converted_value = converter_fn.(field_atom, value)
        Map.put(acc_config, field_atom, converted_value)
      rescue
        # Skip invalid field names
        ArgumentError -> acc_config
      end
    end)
  end

  @doc """
  Updates configuration with boolean toggle settings from form parameters.

  Form checkboxes send "on" when checked, nothing when unchecked.
  This function is kept for backward compatibility.

  ## Examples

      iex> config = %{show_badges: true, hide_bots: false}
      iex> params = %{"show_badges" => "on"}
      iex> update_boolean_settings(config, params, [:show_badges, :hide_bots])
      %{show_badges: true, hide_bots: false}
  """
  def update_boolean_settings(config, params, boolean_fields) do
    Enum.reduce(boolean_fields, config, fn field, acc_config ->
      field_str = Atom.to_string(field)
      Map.put(acc_config, field, Map.get(params, field_str) == "on")
    end)
  end

  @doc """
  Validates widget configuration against allowed values.

  ## Examples

      iex> validate_config_value(:font_size, "large", ["small", "medium", "large"])
      "large"
      
      iex> validate_config_value(:font_size, "invalid", ["small", "medium", "large"], "medium")
      "medium"
  """
  def validate_config_value(setting, value, allowed_values, default \\ nil)

  def validate_config_value(_setting, value, allowed_values, default) when is_list(allowed_values) do
    if value in allowed_values do
      value
    else
      default || List.first(allowed_values)
    end
  end

  def validate_config_value(_setting, value, _allowed_values, _default) do
    value
  end

  @doc """
  Generates a standardized PubSub topic for widget configuration updates.

  ## Examples

      iex> widget_config_topic(:chat_widget, 123)
      "widget_config:chat_widget:123"
  """
  def widget_config_topic(widget_type, user_id) do
    "widget_config:#{widget_type}:#{user_id}"
  end

  @doc """
  Generates a standardized PubSub topic for widget events.

  ## Examples

      iex> widget_event_topic(:alertbox_widget, 123)
      "widget_events:alertbox_widget:123"
  """
  def widget_event_topic(widget_type, user_id) do
    "widget_events:#{widget_type}:#{user_id}"
  end

  @doc """
  Merges default widget configuration with user overrides.

  ## Examples

      iex> defaults = %{font_size: "medium", show_badges: true}
      iex> overrides = %{font_size: "large"}
      iex> merge_widget_config(defaults, overrides)
      %{font_size: "large", show_badges: true}
  """
  def merge_widget_config(defaults, overrides) when is_map(defaults) and is_map(overrides) do
    Map.merge(defaults, overrides)
  end

  def merge_widget_config(defaults, nil), do: defaults
  def merge_widget_config(nil, overrides), do: overrides || %{}

  @doc """
  Converts widget configuration to JSON-safe format for frontend consumption.
  """
  def config_to_json_safe(config) when is_map(config) do
    Map.new(config, fn {key, value} -> {to_string(key), value} end)
  end

  def config_to_json_safe(config), do: config
end
