defmodule Streampai.LivestreamManager.PlatformHelpers do
  @moduledoc """
  Shared helper functions for platform managers.
  Consolidates duplicated logic across Twitch, YouTube, and Kick managers.
  """

  alias Streampai.Cloudflare.APIClient
  alias Streampai.LivestreamManager.StreamManager
  alias Streampai.Stream.CurrentStreamData

  require Logger

  @doc """
  Cleans up a Cloudflare output by deleting it.
  Safely handles nil cloudflare_output_id or cloudflare_input_id.
  """
  def cleanup_cloudflare_output(%{cloudflare_output_id: nil}), do: :ok
  def cleanup_cloudflare_output(%{cloudflare_input_id: nil}), do: :ok

  def cleanup_cloudflare_output(state) do
    Logger.info("Cleaning up Cloudflare output: #{state.cloudflare_output_id}")

    case APIClient.delete_live_output(state.cloudflare_input_id, state.cloudflare_output_id) do
      :ok ->
        Logger.info("Cloudflare output deleted: #{state.cloudflare_output_id}")

      {:error, _error_type, message} ->
        Logger.warning("Failed to delete Cloudflare output: #{message}")
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
