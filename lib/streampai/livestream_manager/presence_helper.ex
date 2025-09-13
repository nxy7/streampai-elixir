defmodule Streampai.LivestreamManager.PresenceHelper do
  @moduledoc """
  Helper functions for debugging and monitoring the presence-based UserStreamManager system.

  The system works automatically - UserStreamManagers are started/stopped based on 
  Phoenix.Presence events. No manual intervention needed.
  """

  alias Streampai.LivestreamManager.PresenceManager

  @doc """
  Debug current presence and UserStreamManager state.
  Use this in IEx console while your app is running:

      iex> Streampai.LivestreamManager.PresenceHelper.debug()
  """
  def debug do
    PresenceManager.debug()
  end

  @doc """
  Get list of users with active UserStreamManagers.
  """
  def get_managed_users do
    PresenceManager.get_managed_users()
  end

  @doc """
  Get detailed metrics about active UserStreamManagers for monitoring.
  Includes memory usage, process counts, and system info.

      iex> Streampai.LivestreamManager.PresenceHelper.get_metrics()
      %{
        total_managers: 2,
        managers: [
          %{user_id: "user-1", memory_bytes: 2048, process_count: 3},
          %{user_id: "user-2", memory_bytes: 1024, process_count: 2}
        ],
        system_info: %{total_memory_bytes: 3072, total_processes: 5}
      }
  """
  def get_metrics do
    PresenceManager.get_metrics()
  end

  @doc """
  Get summary metrics suitable for graphing/plotting.

      iex> Streampai.LivestreamManager.PresenceHelper.get_summary_metrics()
      %{total_managers: 2, total_memory_kb: 3, active_users: 2, cleanup_timers: 0}
  """
  def get_summary_metrics do
    PresenceManager.get_summary_metrics()
  end
end
