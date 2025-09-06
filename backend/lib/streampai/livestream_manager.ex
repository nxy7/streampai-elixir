defmodule Streampai.LivestreamManager do
  @moduledoc """
  Main entry point for the livestream management system.
  Provides public API for managing user livestreams.
  """

  alias Streampai.LivestreamManager.UserStreamManager

  @doc """
  Gets the existing user stream manager or creates it if it doesn't exist.
  Returns the PID of the UserStreamManager process.
  """
  def start_user_stream(user_id) when is_binary(user_id) do
    Streampai.LivestreamManager.UserSupervisor.get_user_stream(user_id)
  end

  @doc """
  Gets the current stream state for a user.
  Creates the user stream manager if it doesn't exist.
  """
  def get_stream_state(user_id) when is_binary(user_id) do
    with {:ok, pid} <- get_user_stream_pid(user_id) do
      UserStreamManager.get_state(pid)
    end
  end

  @doc """
  Sends a chat message to one or all platforms for a user.
  Creates the user stream manager if it doesn't exist.
  """
  def send_chat_message(user_id, message, platforms \\ :all) do
    with {:ok, pid} <- get_user_stream_pid(user_id) do
      UserStreamManager.send_chat_message(pid, message, platforms)
    end
  end

  @doc """
  Updates stream metadata (title, thumbnail) on specified platforms.
  Creates the user stream manager if it doesn't exist.
  """
  def update_stream_metadata(user_id, metadata, platforms \\ :all) do
    with {:ok, pid} <- get_user_stream_pid(user_id) do
      UserStreamManager.update_stream_metadata(pid, metadata, platforms)
    end
  end

  @doc """
  Configures which platforms should receive the stream output.
  Creates the user stream manager if it doesn't exist.
  """
  def configure_stream_outputs(user_id, platform_configs) do
    with {:ok, pid} <- get_user_stream_pid(user_id) do
      UserStreamManager.configure_stream_outputs(pid, platform_configs)
    end
  end

  defp get_user_stream_pid(user_id) do
    Streampai.LivestreamManager.UserSupervisor.get_user_stream(user_id)
  end

  @doc """
  Lists all currently managed user streams.
  """
  def list_active_streams do
    Registry.select(Streampai.LivestreamManager.Registry, [
      {{{:user_stream_manager, :"$1"}, :_, :_}, [], [:"$1"]}
    ])
  end
end
