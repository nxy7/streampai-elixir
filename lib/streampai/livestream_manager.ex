defmodule Streampai.LivestreamManager do
  @moduledoc """
  Main entry point for the livestream management system.
  Provides public API for managing user livestreams.
  """

  alias Streampai.LivestreamManager.StreamManager

  @doc """
  Gets the existing user stream manager or creates it if it doesn't exist.
  Returns the PID of the StreamManager process.
  """
  def start_user_stream(user_id) when is_binary(user_id) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:stream_manager, user_id}) do
      [{pid, _}] ->
        {:ok, pid}

      [] ->
        child_spec = %{
          id: {:stream_manager, user_id},
          start: {StreamManager, :start_link, [user_id]},
          restart: :permanent,
          type: :worker
        }

        case DynamicSupervisor.start_child(Streampai.LivestreamManager.UserSupervisor, child_spec) do
          {:ok, pid} -> {:ok, pid}
          {:error, {:already_started, pid}} -> {:ok, pid}
          error -> error
        end
    end
  end

  @doc """
  Gets the current stream state for a user.
  """
  def get_stream_state(user_id) when is_binary(user_id) do
    ensure_started(user_id)
    StreamManager.get_state(user_id)
  end

  @doc """
  Sends a chat message to one or all platforms for a user.
  """
  def send_chat_message(user_id, message, platforms \\ :all) do
    ensure_started(user_id)
    StreamManager.send_chat_message(user_id, message, platforms)
  end

  @doc """
  Updates stream metadata (title, thumbnail) on specified platforms.
  """
  def update_stream_metadata(user_id, metadata, platforms \\ :all) do
    ensure_started(user_id)
    StreamManager.update_stream_metadata(user_id, metadata, platforms)
  end

  @doc """
  Lists all currently managed user streams.
  """
  def list_active_streams do
    Registry.select(Streampai.LivestreamManager.Registry, [
      {{{:stream_manager, :"$1"}, :_, :_}, [], [:"$1"]}
    ])
  end

  defp ensure_started(user_id) do
    start_user_stream(user_id)
  end
end
