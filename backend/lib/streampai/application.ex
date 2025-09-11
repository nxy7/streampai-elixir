defmodule Streampai.Application do
  @moduledoc false
  use Application

  require Logger

  @impl true
  def start(_type, _args) do
    Logger.info("streampai startup")

    # Initialize ETS table for rate limiting
    :ets.new(:rate_limiter, [:set, :public, :named_table])

    if System.get_env("PHX_SERVER") do
      run_migrations()
    end

    children = [
      StreampaiWeb.Telemetry,
      Streampai.Repo,
      {Oban,
       AshOban.config(
         Application.fetch_env!(:streampai, :ash_domains),
         Application.fetch_env!(:streampai, Oban)
       )},
      {Phoenix.PubSub, name: Streampai.PubSub},
      StreampaiWeb.Presence,
      {Finch, name: Streampai.Finch},
      StreampaiWeb.Endpoint,
      {AshAuthentication.Supervisor, [otp_app: :streampai]},
      {Streampai.LivestreamManager.Supervisor, [name: Streampai.LivestreamManager.Supervisor]}
    ]

    opts = [strategy: :one_for_one, name: Streampai.Supervisor]
    Supervisor.start_link(children, opts)
  end

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
        :ok
    end
  end
end
