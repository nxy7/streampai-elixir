defmodule StreampaiWeb.MonitoringController do
  @moduledoc """
  Controller for monitoring endpoints with IP-based access control.
  """
  use StreampaiWeb, :controller

  alias StreampaiWeb.Plugs.ErrorTracker

  def system_info(conn, _params) do
    metrics = collect_system_metrics()

    conn
    |> put_resp_content_type("application/json")
    |> json(metrics)
  end

  def health_check(conn, _params) do
    uptime_ms = :erlang.statistics(:wall_clock) |> elem(0)

    health_status = %{
      status: "ok",
      timestamp: DateTime.utc_now(),
      uptime: uptime_ms,
      uptime_human: format_uptime(uptime_ms),
      node: Node.self(),
      version: Application.spec(:streampai, :vsn) |> to_string(),
      git_sha: System.get_env("GIT_SHA", "unknown")
    }

    conn
    |> put_resp_content_type("application/json")
    |> json(health_status)
  end

  def metrics(conn, _params) do
    metrics = %{
      system: collect_system_metrics(),
      application: collect_application_metrics(),
      database: collect_database_metrics(),
      errors: collect_error_metrics()
    }

    conn
    |> put_resp_content_type("application/json")
    |> json(metrics)
  end

  def errors(conn, params) do
    limit = String.to_integer(params["limit"] || "50")
    errors = ErrorTracker.list_errors(limit)

    conn
    |> put_resp_content_type("application/json")
    |> json(%{
      errors: errors,
      total_count: ErrorTracker.error_count()
    })
  end

  def error_detail(conn, %{"id" => error_id}) do
    case ErrorTracker.get_error(error_id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Error not found"})

      error_data ->
        conn
        |> put_resp_content_type("application/json")
        |> json(error_data)
    end
  end

  defp collect_system_metrics do
    memory = :erlang.memory()
    {wall_clock_time, _} = :erlang.statistics(:wall_clock)
    {reductions, _} = :erlang.statistics(:reductions)
    {run_queue, _} = :erlang.statistics(:run_queue)

    %{
      timestamp: DateTime.utc_now(),
      node: Node.self(),
      uptime_ms: wall_clock_time,
      memory: %{
        total: memory[:total],
        processes: memory[:processes],
        processes_used: memory[:processes_used],
        system: memory[:system],
        atom: memory[:atom],
        atom_used: memory[:atom_used],
        binary: memory[:binary],
        code: memory[:code],
        ets: memory[:ets]
      },
      system: %{
        process_count: :erlang.system_info(:process_count),
        port_count: :erlang.system_info(:port_count),
        atom_count: :erlang.system_info(:atom_count),
        run_queue_length: run_queue,
        reductions: reductions,
        schedulers: :erlang.system_info(:schedulers),
        schedulers_online: :erlang.system_info(:schedulers_online)
      }
    }
  end

  defp collect_application_metrics do
    %{
      processes: length(Process.list()),
      registered_names: length(:erlang.registered()),
      applications: length(Application.loaded_applications())
    }
  end

  defp collect_database_metrics do
    pool_size = Streampai.Repo.config()[:pool_size] || 0

    %{
      pool_size: pool_size,
      status: "connected"
    }
  rescue
    _ -> %{status: "unavailable"}
  end

  defp collect_error_metrics do
    errors = ErrorTracker.list_errors(100)

    recent_errors =
      Enum.filter(errors, fn error ->
        DateTime.diff(DateTime.utc_now(), error.timestamp, :minute) <= 60
      end)

    %{
      total_errors: ErrorTracker.error_count(),
      recent_errors_1h: length(recent_errors),
      error_types: Enum.frequencies_by(recent_errors, & &1.type),
      status_codes: Enum.frequencies_by(recent_errors, & &1[:status])
    }
  end

  defp format_uptime(uptime_ms) do
    seconds = div(uptime_ms, 1000)
    minutes = div(seconds, 60)
    hours = div(minutes, 60)
    days = div(hours, 24)

    remaining_hours = rem(hours, 24)
    remaining_minutes = rem(minutes, 60)
    remaining_seconds = rem(seconds, 60)

    cond do
      days > 0 -> "#{days}d #{remaining_hours}h #{remaining_minutes}m"
      hours > 0 -> "#{hours}h #{remaining_minutes}m"
      minutes > 0 -> "#{minutes}m #{remaining_seconds}s"
      true -> "#{seconds}s"
    end
  end
end
