defmodule StreampaiWeb.PromEx do
  @moduledoc false
  use PromEx, otp_app: :streampai

  @impl true
  def plugins do
    [
      PromEx.Plugins.Application,
      PromEx.Plugins.Beam,
      {PromEx.Plugins.Phoenix, router: StreampaiWeb.Router, endpoint: StreampaiWeb.Endpoint},
      {PromEx.Plugins.Ecto, repos: [Streampai.Repo]},
      {PromEx.Plugins.Oban, oban_supervisors: [Oban]}
    ]
  end

  @impl true
  def dashboard_assigns do
    [
      datasource_id: "prometheus",
      default_selected_interval: "30s"
    ]
  end

  @impl true
  def dashboards do
    [
      {:prom_ex, "application.json"},
      {:prom_ex, "beam.json"},
      {:prom_ex, "phoenix.json"},
      {:prom_ex, "ecto.json"},
      {:prom_ex, "oban.json"}
    ]
  end
end
