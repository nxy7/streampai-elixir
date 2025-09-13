defmodule Streampai.LivestreamManager.UserSupervisor do
  @moduledoc """
  Dynamic supervisor that manages user-specific livestream process trees.
  Each user gets their own supervised set of processes.
  """
  use DynamicSupervisor

  alias Streampai.LivestreamManager.UserStreamManager

  def start_link(init_arg) do
    DynamicSupervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  @doc """
  Gets the existing user stream manager or creates it if it doesn't exist.
  Returns the PID of the UserStreamManager process.
  """
  def get_user_stream(user_id) when is_binary(user_id) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:user_stream_manager, user_id}) do
      [{pid, _}] ->
        {:ok, pid}

      [] ->
        start_user_stream(user_id)
    end
  end

  defp start_user_stream(user_id) when is_binary(user_id) do
    child_spec = %{
      id: {:user_stream_manager, user_id},
      start: {UserStreamManager, :start_link, [user_id]},
      restart: :permanent,
      type: :supervisor
    }

    case DynamicSupervisor.start_child(__MODULE__, child_spec) do
      {:ok, pid} ->
        {:ok, pid}

      {:error, {:already_started, pid}} ->
        {:ok, pid}

      error ->
        error
    end
  end

  @doc """
  Stops livestream management for a user.
  """
  def stop_user_stream(user_id) when is_binary(user_id) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:user_stream_manager, user_id}) do
      [{pid, _}] ->
        DynamicSupervisor.terminate_child(__MODULE__, pid)

      [] ->
        {:error, :not_found}
    end
  end

  @doc """
  Lists all currently supervised user streams.
  """
  def list_children do
    DynamicSupervisor.which_children(__MODULE__)
  end
end
