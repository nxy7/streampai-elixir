defmodule Streampai.Application do
  @moduledoc false
  require Logger

  use Application

  @impl true
  def start(_type, _args) do
    Logger.info("streampai startup")

    # Run migrations on startup if in production
    if System.get_env("PHX_SERVER") do
      run_migrations()
    end

    # Session storage is now handled by cookie store instead of ETS

    children = [
      StreampaiWeb.Telemetry,
      Streampai.Repo,
      # Streampai.Claude,
      {Phoenix.PubSub, name: Streampai.PubSub},
      # {Beacon, [sites: [Application.fetch_env!(:beacon, :cms)]]},

      # StreampaiWeb.CmsEndpoint,
      # {DNSCluster, query: Application.get_env(:streampai, :dns_cluster_query) || :ignore},
      Streampai.ButtonServer,
      Streampai.Double,
      StreampaiWeb.Presence,
      # Start the Finch HTTP client for sending emails
      # Start a worker by calling: Streampai.Worker.start_link(arg)
      # {Streampai.Worker, arg},
      # Start to serve requests, typically the last entry
      {Finch, name: Streampai.Finch},
      StreampaiWeb.Endpoint,
      {AshAuthentication.Supervisor, [otp_app: :streampai]},
      StreampaiWeb.ProxyEndpoint
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

  defp run_migrations do
    Logger.info("Running migrations...")

    try do
      Streampai.Release.migrate()
      Logger.info("Migrations completed successfully")
    rescue
      error ->
        Logger.error("Migration failed: #{inspect(error)}")
        # Don't crash the application if migrations fail
        :ok
    end
  end
end
