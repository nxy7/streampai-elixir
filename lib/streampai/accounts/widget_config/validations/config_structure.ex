defmodule Streampai.Accounts.WidgetConfig.Validations.ConfigStructure do
  @moduledoc """
  Validates widget configuration structure based on widget type.
  """

  use Ash.Resource.Validation

  @impl true
  def validate(changeset, _opts, _context) do
    case {Ash.Changeset.get_attribute(changeset, :type), Ash.Changeset.get_attribute(changeset, :config)} do
      {:chat_widget, config} -> validate_chat_widget_config(config, changeset)
      {:alertbox_widget, config} -> validate_alertbox_widget_config(config, changeset)
      {:eventlist_widget, config} -> validate_eventlist_widget_config(config, changeset)
      {nil, _} -> :ok
      {_, nil} -> :ok
      {_, config} when is_map(config) -> :ok
      _ -> {:error, field: :config, message: "Config must be a map"}
    end
  end

  defp validate_chat_widget_config(config, _changeset) do
    required_keys = [:max_messages, :show_badges, :show_emotes]
    missing_keys = required_keys -- Map.keys(config)

    if missing_keys == [] do
      with :ok <- validate_max_messages(config) do
        validate_boolean_fields(config, [:show_badges, :show_emotes])
      end
    else
      {:error, field: :config, message: "Missing required chat widget config keys: #{inspect(missing_keys)}"}
    end
  end

  defp validate_alertbox_widget_config(config, _changeset) do
    required_keys = [:display_duration, :animation_type, :sound_enabled]
    missing_keys = required_keys -- Map.keys(config)

    if missing_keys == [] do
      with :ok <- validate_display_duration(config),
           :ok <- validate_animation_type(config) do
        validate_sound_enabled(config)
      end
    else
      {:error, field: :config, message: "Missing required alertbox widget config keys: #{inspect(missing_keys)}"}
    end
  end

  defp validate_eventlist_widget_config(config, _changeset) do
    required_keys = [:max_events, :animation_type, :event_types, :font_size]
    missing_keys = required_keys -- Map.keys(config)

    if missing_keys == [] do
      with :ok <- validate_max_events(config),
           :ok <- validate_animation_type(config),
           :ok <- validate_event_types(config),
           :ok <- validate_font_size(config) do
        validate_boolean_fields(config, [
          :show_timestamps,
          :show_platform,
          :show_amounts,
          :compact_mode
        ])
      end
    else
      {:error, field: :config, message: "Missing required eventlist widget config keys: #{inspect(missing_keys)}"}
    end
  end

  defp validate_max_messages(config) do
    case Map.get(config, :max_messages) do
      n when is_integer(n) and n > 0 and n <= 100 ->
        :ok

      n when is_integer(n) and n <= 0 ->
        {:error, field: :config, message: "max_messages must be greater than 0"}

      n when is_integer(n) and n > 100 ->
        {:error, field: :config, message: "max_messages cannot exceed 100"}

      _ ->
        {:error, field: :config, message: "max_messages must be an integer"}
    end
  end

  defp validate_boolean_fields(config, keys) do
    Enum.find_value(keys, :ok, fn key ->
      case Map.get(config, key) do
        value when is_boolean(value) ->
          nil

        _ ->
          {:error, field: :config, message: "#{key} must be true or false"}
      end
    end)
  end

  defp validate_display_duration(config) do
    case Map.get(config, :display_duration) do
      n when is_integer(n) and n > 0 and n <= 30 ->
        :ok

      n when is_integer(n) and n <= 0 ->
        {:error, field: :config, message: "display_duration must be greater than 0 seconds"}

      n when is_integer(n) and n > 30 ->
        {:error, field: :config, message: "display_duration cannot exceed 30 seconds"}

      _ ->
        {:error, field: :config, message: "display_duration must be an integer"}
    end
  end

  defp validate_animation_type(config) do
    case Map.get(config, :animation_type) do
      type when type in ["fade", "slide", "bounce"] ->
        :ok

      type when is_binary(type) ->
        {:error, field: :config, message: "animation_type '#{type}' is invalid. Must be one of: fade, slide, bounce"}

      _ ->
        {:error, field: :config, message: "animation_type must be a string (one of: fade, slide, bounce)"}
    end
  end

  defp validate_sound_enabled(config) do
    case Map.get(config, :sound_enabled) do
      sound when is_boolean(sound) ->
        :ok

      _ ->
        {:error, field: :config, message: "sound_enabled must be true or false"}
    end
  end

  defp validate_max_events(config) do
    case Map.get(config, :max_events) do
      n when is_integer(n) and n > 0 and n <= 50 ->
        :ok

      n when is_integer(n) and n <= 0 ->
        {:error, field: :config, message: "max_events must be greater than 0"}

      n when is_integer(n) and n > 50 ->
        {:error, field: :config, message: "max_events cannot exceed 50"}

      _ ->
        {:error, field: :config, message: "max_events must be an integer"}
    end
  end

  defp validate_event_types(config) do
    valid_types = ["donation", "follow", "subscription", "raid", "chat_message"]

    case Map.get(config, :event_types) do
      types when is_list(types) ->
        if Enum.all?(types, &(&1 in valid_types)) do
          :ok
        else
          invalid_types = types -- valid_types

          {:error,
           field: :config,
           message: "Invalid event types: #{inspect(invalid_types)}. Must be one of: #{inspect(valid_types)}"}
        end

      _ ->
        {:error, field: :config, message: "event_types must be a list of strings"}
    end
  end

  defp validate_font_size(config) do
    case Map.get(config, :font_size) do
      size when size in ["small", "medium", "large"] ->
        :ok

      size when is_binary(size) ->
        {:error, field: :config, message: "font_size '#{size}' is invalid. Must be one of: small, medium, large"}

      _ ->
        {:error, field: :config, message: "font_size must be a string (one of: small, medium, large)"}
    end
  end
end
