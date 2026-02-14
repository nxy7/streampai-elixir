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
    require Logger

    Logger.info("Starting LivestreamManager.Supervisor...")

    children = [
      {Registry, keys: :unique, name: Streampai.LivestreamManager.Registry},
      {DynamicSupervisor, strategy: :one_for_one, name: Streampai.LivestreamManager.UserSupervisor}
    ]

    children =
      children ++
        if Application.get_env(:streampai, :env) == :test do
          []
        else
          [
            Streampai.LivestreamManager.PresenceManager,
            Streampai.LivestreamManager.MetricsCollector
          ] ++
            if Application.get_env(:streampai, :default_broadcast_strategy) == :membrane do
              [Streampai.LivestreamManager.BroadcastStrategy.Membrane.RTMPServer]
            else
              []
            end
        end

    Supervisor.init(children, strategy: :one_for_one)
  end
end
