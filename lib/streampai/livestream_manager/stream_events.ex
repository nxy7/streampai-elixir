defmodule Streampai.LivestreamManager.StreamEvents do
  @moduledoc """
  Helper functions for emitting stream events to track stream history.
  """

  alias Streampai.Stream.StreamEvent

  require Logger

  @doc """
  Emits a platform_started event when a platform begins streaming.
  """
  def emit_platform_started(user_id, livestream_id, platform) do
    create_event(%{
      type: :platform_started,
      data: %{type: "platform_started", platform: platform},
      author_id: to_string(user_id),
      livestream_id: livestream_id,
      user_id: user_id,
      platform: platform
    })
  end

  @doc """
  Emits a platform_stopped event when a platform stops streaming.
  """
  def emit_platform_stopped(user_id, livestream_id, platform) do
    create_event(%{
      type: :platform_stopped,
      data: %{type: "platform_stopped", platform: platform},
      author_id: to_string(user_id),
      livestream_id: livestream_id,
      user_id: user_id,
      platform: platform
    })
  end

  @doc """
  Emits a stream_metadata_changed event when stream title or thumbnail changes.
  """
  def emit_metadata_changed(user_id, livestream_id, metadata) do
    create_event(%{
      type: :stream_metadata_changed,
      data: metadata,
      author_id: to_string(user_id),
      livestream_id: livestream_id,
      user_id: user_id,
      platform: :system
    })
  end

  defp create_event(attrs) do
    case StreamEvent.create(attrs, actor: Streampai.SystemActor.system()) do
      {:ok, event} ->
        Logger.debug("Created stream event: #{event.type}")
        {:ok, event}

      {:error, reason} ->
        Logger.warning("Failed to create stream event: #{inspect(reason)}")
        {:error, reason}
    end
  end
end
