defmodule Streampai.LoggerFormatter do
  @moduledoc """
  Custom Logger formatter that includes component, user_id, and extra metadata.

  Format: [$level] filename.ex:line [$component user_id]: $message key=value key2=value2

  - With context and metadata: [info] generator.ex:93 [tts_service user123]: TTS generated voice=alloy hash=abc123
  - Without context: [info] generator.ex:93: TTS generated voice=alloy hash=abc123
  - Minimal: [info]: Starting stream

  All metadata passed to Logger calls (except internal keys like :file, :line, :module, etc.)
  will be displayed as key=value pairs after the message.

  Set @log_location to false in the module to disable file:line location display.
  """

  @log_location true

  def format(level, message, _timestamp, metadata) do
    context = build_context(metadata)
    location = if @log_location, do: build_location(metadata), else: ""
    extra_metadata = build_extra_metadata(metadata)

    [
      "[",
      level_to_string(level),
      "]",
      location,
      context,
      " ",
      message,
      extra_metadata,
      "\n"
    ]
  rescue
    _ -> "could not format: #{inspect({level, message, metadata})}\n"
  end

  defp build_context(metadata) do
    component = Keyword.get(metadata, :component)
    user_id = Keyword.get(metadata, :user_id)
    chat_id = Keyword.get(metadata, :chat_id)
    # platform = Keyword.get(metadata, :platform)

    # [component, platform, user_id, chat_id]
    parts =
      [component, user_id, chat_id]
      |> Enum.reject(&is_nil/1)
      |> Enum.join(" ")

    if parts == "" do
      ""
    else
      " [#{parts}]:"
    end
  end

  defp build_location(metadata) do
    file = Keyword.get(metadata, :file)
    line = Keyword.get(metadata, :line)

    case {file, line} do
      {nil, _} -> ""
      {file, nil} -> " #{Path.basename(file)}:"
      {file, line} -> " #{Path.basename(file)}:#{line}:"
    end
  end

  defp level_to_string(level) when is_atom(level), do: Atom.to_string(level)
  defp level_to_string(level), do: to_string(level)

  # Keys that are used internally by logger or displayed elsewhere in the format
  @excluded_keys [
    :file,
    :line,
    :module,
    :function,
    :component,
    :user_id,
    :chat_id,
    :mfa,
    :gl,
    :time,
    :pid,
    :application,
    :domain,
    :crash_reason,
    :initial_call,
    :registered_name,
    :request_id,
    :erl_level
  ]

  defp build_extra_metadata(metadata) do
    extra =
      metadata
      |> Enum.reject(fn {key, _value} -> key in @excluded_keys end)
      |> Enum.map(fn {key, value} -> "#{key}=#{inspect_value(value)}" end)

    case extra do
      [] -> ""
      list -> " " <> Enum.join(list, " ")
    end
  end

  defp inspect_value(value) when is_binary(value), do: value
  defp inspect_value(value) when is_number(value), do: to_string(value)
  defp inspect_value(value) when is_atom(value), do: to_string(value)
  defp inspect_value(value), do: inspect(value, limit: :infinity, printable_limit: :infinity)
end
