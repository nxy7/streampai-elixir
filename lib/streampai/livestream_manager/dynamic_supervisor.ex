defmodule Streampai.LivestreamManager.DynamicSupervisor do
  @moduledoc """
  Dynamic supervisor for managing UserStreamManager processes.
  """
  use DynamicSupervisor

  def start_link(init_arg \\ []) do
    DynamicSupervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  def start_user_manager(user_id) do
    DynamicSupervisor.start_child(
      __MODULE__,
      {Streampai.LivestreamManager.UserStreamManager, user_id}
    )
  end

  def stop_user_manager(user_id) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:user_stream_manager, user_id}) do
      [{pid, _}] ->
        DynamicSupervisor.terminate_child(__MODULE__, pid)

      [] ->
        {:error, :not_found}
    end
  end

  def list_children do
    DynamicSupervisor.which_children(__MODULE__)
  end

  def start_alert_queue(user_id) do
    DynamicSupervisor.start_child(
      __MODULE__,
      {Streampai.LivestreamManager.AlertQueue, user_id}
    )
  end

  def stop_alert_queue(user_id) do
    case Registry.lookup(Streampai.LivestreamManager.Registry, {:alert_queue, user_id}) do
      [{pid, _}] ->
        DynamicSupervisor.terminate_child(__MODULE__, pid)

      [] ->
        {:error, :not_found}
    end
  end
end
