defmodule Streampai.LivestreamManager.Supervisor do
  @moduledoc """
  Top-level supervisor for the livestream management system.
  """
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  @impl true
  def init(:ok) do
    children = [
      # Registry for process discovery
      {Registry, keys: :unique, name: Streampai.LivestreamManager.Registry},
      
      # Dynamic supervisor for user-specific process trees
      {DynamicSupervisor, strategy: :one_for_one, name: Streampai.LivestreamManager.UserSupervisor},
      
      # Event broadcasting system
      Streampai.LivestreamManager.EventBroadcaster,
      
      # System-wide metrics collection
      Streampai.LivestreamManager.MetricsCollector,
      
      # Cloudflare API management
      Streampai.LivestreamManager.CloudflareSupervisor
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end