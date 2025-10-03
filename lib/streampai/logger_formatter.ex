defmodule Streampai.LoggerFormatter do
  @moduledoc """
  Custom Logger formatter that includes component and user_id metadata.

  Format: [$level] [$component:$user_id]: $message

  - If both component and user_id are present: [info] [youtube_manager:user123]: Starting stream
  - If only component is present: [info] [youtube_manager]: Starting stream
  - If only user_id is present: [info] [user123]: Starting stream
  - If neither are present: [info] Starting stream

  Set LOG_LOCATION=true environment variable to include file and line number:
  - [info] [youtube_manager:user123] youtube_manager.ex:123: Starting stream
  """

  @log_location true

  def format(level, message, _timestamp, metadata) do
    _context = build_context(metadata)
    location = if @log_location, do: build_location(metadata), else: ""

    [
      "[",
      level_to_string(level),
      "]",
      location,
      # context,
      " ",
      message,
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
end
