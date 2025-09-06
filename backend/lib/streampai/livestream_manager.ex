defmodule Streampai.LivestreamManager do
  @moduledoc """
  Main entry point for the livestream management system.
  Provides public API for managing user livestreams.
  """

  alias Streampai.LivestreamManager.UserStreamManager

  @doc """
  Starts livestream management for a user.
  Creates the full process tree for managing their stream.
  """
  def start_user_stream(user_id) when is_binary(user_id) do
    Streampai.LivestreamManager.UserSupervisor.start_user_stream(user_id)
  end

  @doc """
  Gets the current stream state for a user.
  """
  def get_stream_state(user_id) when is_binary(user_id) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:user_stream_manager, user_id}) do
      [{pid, _}] -> UserStreamManager.get_state(pid)
      [] -> {:error, :not_found}
    end
  end

  @doc """
  Sends a chat message to one or all platforms for a user.
  """
  def send_chat_message(user_id, message, platforms \\ :all) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:user_stream_manager, user_id}) do
      [{pid, _}] -> UserStreamManager.send_chat_message(pid, message, platforms)
      [] -> {:error, :not_found}
    end
  end

  @doc """
  Updates stream metadata (title, thumbnail) on specified platforms.
  """
  def update_stream_metadata(user_id, metadata, platforms \\ :all) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:user_stream_manager, user_id}) do
      [{pid, _}] -> UserStreamManager.update_stream_metadata(pid, metadata, platforms)
      [] -> {:error, :not_found}
    end
  end

  @doc """
  Configures which platforms should receive the stream output.
  """
  def configure_stream_outputs(user_id, platform_configs) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:user_stream_manager, user_id}) do
      [{pid, _}] -> UserStreamManager.configure_stream_outputs(pid, platform_configs)
      [] -> {:error, :not_found}
    end
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
