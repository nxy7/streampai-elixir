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
      {Registry, keys: :unique, name: Streampai.LivestreamManager.Registry},
      {DynamicSupervisor,
       strategy: :one_for_one, name: Streampai.LivestreamManager.UserSupervisor},
      Streampai.LivestreamManager.DynamicSupervisor
    ]

    children =
      children ++
        if Application.get_env(:streampai, :env) != :test do
          [
            Streampai.LivestreamManager.PresenceManager,
            Streampai.LivestreamManager.MetricsCollector
          ]
        else
          []
        end

    Supervisor.init(children, strategy: :one_for_one)
  end
end
