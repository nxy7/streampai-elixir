defmodule Streampai.LivestreamManager.Platforms.KickManager do
  @moduledoc """
  Manages Kick platform integration for live streaming.
  Currently a stub implementation - to be implemented in the future.
  """
  use Streampai.LivestreamManager.Platforms.PlatformManagerBehaviour,
    platform: :kick,
    activity_interval: 1_000

  # Implementation of required callbacks

  @impl true
  @spec handle_start_streaming(map(), String.t()) :: {:ok, map()} | {:error, term()}
  def handle_start_streaming(state, stream_uuid) do
    if is_nil(stream_uuid) or stream_uuid == "" do
      {:error, :invalid_stream_uuid}
    else
      new_state = %{state | is_active: true}
      {:ok, new_state}
    end
  end

  @impl true
  @spec handle_stop_streaming(map()) :: {:ok, map()}
  def handle_stop_streaming(state) do
    new_state = %{state | is_active: false}
    {:ok, new_state}
  end

  @impl true
  @spec handle_send_chat_message(map(), String.t()) :: {:ok, map()} | {:error, term()}
  def handle_send_chat_message(state, message) do
    if is_nil(message) or message == "" do
      {:error, :empty_message}
    else
      {:ok, state}
    end
  end

  @impl true
  @spec handle_update_stream_metadata(map(), map()) :: {:ok, map()} | {:error, term()}
  def handle_update_stream_metadata(state, metadata) do
    if is_nil(metadata) do
      {:error, :invalid_metadata}
    else
      {:ok, state}
    end
  end
end
