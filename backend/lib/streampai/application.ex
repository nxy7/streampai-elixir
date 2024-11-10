defmodule Streampai.Application do
  @moduledoc false
  require Logger

  use Application

  @impl true
  def start(_type, _args) do
    Logger.info("streampai startup")

    children = [
      {NodeJS.Supervisor, [path: LiveSvelte.SSR.NodeJS.server_path(), pool_size: 4]},
      StreampaiWeb.Telemetry,
      Streampai.Repo,
      # Streampai.Claude,
      {Phoenix.PubSub, name: Streampai.PubSub},
      Streampai.ButtonServer,
      Streampai.Double,
      # {DNSCluster, query: Application.get_env(:streampai, :dns_cluster_query) || :ignore},
      StreampaiWeb.Presence,
      # Start the Finch HTTP client for sending emails
      {Finch, name: Streampai.Finch},
      # Start a worker by calling: Streampai.Worker.start_link(arg)
      # {Streampai.Worker, arg},
      # Start to serve requests, typically the last entry
      StreampaiWeb.Endpoint,
      {AshAuthentication.Supervisor, [otp_app: :streampai]}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Streampai.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    StreampaiWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
