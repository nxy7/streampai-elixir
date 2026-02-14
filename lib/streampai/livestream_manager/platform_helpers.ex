defmodule Streampai.LivestreamManager.PlatformHelpers do
  @moduledoc """
  Shared helper functions for platform managers.
  Consolidates duplicated logic across Twitch, YouTube, and Kick managers.
  """

  alias Streampai.LivestreamManager.StreamManager
  alias Streampai.Stream.CurrentStreamData

  require Logger

  @doc """
  Cleans up a relay output via the broadcast strategy.
  Safely handles nil broadcast_strategy or relay_output_handle.
  """
  def cleanup_relay_output(%{relay_output_handle: nil}), do: :ok
  def cleanup_relay_output(%{broadcast_strategy: nil}), do: :ok

  def cleanup_relay_output(state) do
    {mod, strategy_state} = state.broadcast_strategy
    Logger.info("Cleaning up relay output: #{state.relay_output_handle}")

    case mod.remove_output(strategy_state, state.relay_output_handle) do
      :ok ->
        Logger.info("Relay output deleted: #{state.relay_output_handle}")

      {:error, reason} ->
        Logger.warning("Failed to delete relay output: #{inspect(reason)}")
    end
  end

  @doc """
  Stores reconnection data for a platform.
  `fields` is a map of string keys to values to persist.
  """
  def store_reconnection_data(user_id, platform, fields) when is_atom(platform) do
    CurrentStreamData.update_platform_data_for_user(user_id, platform, fields)
  end

  @doc """
  Broadcasts a viewer count update via PubSub and updates the stream actor.
  """
  def broadcast_viewer_update(user_id, platform, viewer_count) do
    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      "viewer_counts:#{user_id}",
      {:viewer_update, platform, viewer_count}
    )

    StreamManager.update_stream_actor_viewers(user_id, platform, viewer_count)
  end
end
