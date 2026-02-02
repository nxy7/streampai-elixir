defmodule StreampaiWeb.Plugs.ErrorTracker do
  @moduledoc """
  Plug for tracking and logging errors in ETS.
  """
  @behaviour Plug

  import StreampaiWeb.Plugs.ConnHelpers, only: [get_client_ip: 1, get_header: 2]

  require Logger

  def init(opts), do: opts

  def call(conn, _opts) do
    start_time = System.monotonic_time(:millisecond)

    conn =
      Plug.Conn.register_before_send(conn, fn conn ->
        track_response(conn, start_time)
        conn
      end)

    try do
      conn
    rescue
      exception ->
        track_error(conn, exception, __STACKTRACE__, start_time)
        reraise exception, __STACKTRACE__
    catch
      kind, reason ->
        track_error(conn, reason, __STACKTRACE__, start_time, kind)
        :erlang.raise(kind, reason, __STACKTRACE__)
    end
  end

  defp track_response(conn, start_time) do
    duration = System.monotonic_time(:millisecond) - start_time

    if conn.status >= 400 do
      error_data = %{
        id: generate_error_id(),
        timestamp: DateTime.utc_now(),
        type: :http_error,
        status: conn.status,
        method: conn.method,
        path: conn.request_path,
        query_string: conn.query_string,
        user_agent: get_header(conn, "user-agent"),
        referer: get_header(conn, "referer"),
        user_id: get_current_user_id(conn),
        session_id: get_session_id(conn),
        ip_address: get_client_ip(conn),
        duration_ms: duration,
        response_body: get_response_body_sample(conn)
      }

      store_error(error_data)

      Logger.error("HTTP Error: #{conn.status} #{conn.method} #{conn.request_path}",
        error_id: error_data.id,
        user_id: error_data.user_id,
        duration: duration
      )
    end
  end

  defp track_error(conn, exception, stacktrace, start_time, kind \\ :error) do
    duration = System.monotonic_time(:millisecond) - start_time

    error_data = %{
      id: generate_error_id(),
      timestamp: DateTime.utc_now(),
      type: :application_error,
      kind: kind,
      exception: %{
        module: exception.__struct__,
        message: Exception.message(exception)
      },
      stacktrace: Exception.format_stacktrace(stacktrace),
      method: conn.method,
      path: conn.request_path,
      query_string: conn.query_string,
      user_agent: get_header(conn, "user-agent"),
      referer: get_header(conn, "referer"),
      user_id: get_current_user_id(conn),
      session_id: get_session_id(conn),
      ip_address: get_client_ip(conn),
      duration_ms: duration,
      request_body_sample: get_request_body_sample(conn)
    }

    store_error(error_data)

    # Log error for immediate visibility
    Logger.error("Application Error: #{inspect(exception)}",
      error_id: error_data.id,
      user_id: error_data.user_id,
      path: "#{conn.method} #{conn.request_path}"
    )
  end

  defp store_error(error_data) do
    # ETS table is now initialized at application startup
    current_count = :ets.info(:streampai_errors, :size) || 0

    if current_count >= 1000 do
      oldest_keys =
        :streampai_errors
        |> :ets.tab2list()
        |> Enum.sort_by(fn {_id, data} -> data.timestamp end)
        |> Enum.take(100)
        |> Enum.map(fn {id, _data} -> id end)

      Enum.each(oldest_keys, &:ets.delete(:streampai_errors, &1))
    end

    :ets.insert(:streampai_errors, {error_data.id, error_data})
  end

  defp generate_error_id do
    8 |> :crypto.strong_rand_bytes() |> Base.encode16() |> String.downcase()
  end

  defp get_current_user_id(conn) do
    case Map.get(conn.assigns, :current_user) do
      %{id: id} -> id
      _ -> nil
    end
  end

  defp get_session_id(conn) do
    Plug.Conn.get_session(conn, "_csrf_token") ||
      conn |> Plug.Conn.get_session("phoenix_flash") |> inspect() |> String.slice(0, 16)
  end

  defp get_response_body_sample(_conn) do
    nil
  end

  defp get_request_body_sample(conn) do
    if conn.method != "GET" and conn.body_params != %Plug.Conn.Unfetched{} do
      conn.body_params
      |> inspect()
      |> String.slice(0, 500)
    end
  end

  def list_errors(limit \\ 50) do
    case :ets.whereis(:streampai_errors) do
      :undefined ->
        []

      _ ->
        :streampai_errors
        |> :ets.tab2list()
        |> Enum.map(fn {_id, error} -> error end)
        |> Enum.sort_by(& &1.timestamp, {:desc, DateTime})
        |> Enum.take(limit)
    end
  end

  def get_error(error_id) do
    case :ets.whereis(:streampai_errors) do
      :undefined ->
        nil

      _ ->
        case :ets.lookup(:streampai_errors, error_id) do
          [{^error_id, error_data}] -> error_data
          [] -> nil
        end
    end
  end

  def error_count do
    case :ets.whereis(:streampai_errors) do
      :undefined -> 0
      _ -> :ets.info(:streampai_errors, :size)
    end
  end

  @doc """
  Gets error statistics for monitoring dashboard.
  """
  def get_error_stats do
    errors = list_errors(1000)
    now = DateTime.utc_now()
    one_hour_ago = DateTime.add(now, -3600, :second)
    twenty_four_hours_ago = DateTime.add(now, -86_400, :second)

    %{
      total_count: length(errors),
      last_hour_count: count_errors_since(errors, one_hour_ago),
      last_24h_count: count_errors_since(errors, twenty_four_hours_ago),
      error_rate_per_hour: calculate_hourly_rate(errors, now),
      top_error_paths: get_top_error_paths(errors, 10),
      top_error_types: get_top_error_types(errors, 10),
      most_affected_users: get_most_affected_users(errors, 10)
    }
  end

  @doc """
  Gets errors for a specific user for debugging.
  """
  def get_user_errors(user_id, limit \\ 20) do
    500
    |> list_errors()
    |> Enum.filter(&(&1.user_id == user_id))
    |> Enum.take(limit)
  end

  @doc """
  Clears old errors from ETS table.
  """
  def cleanup_old_errors(hours_to_keep \\ 48) do
    cutoff_time = DateTime.add(DateTime.utc_now(), -hours_to_keep * 3600, :second)

    case :ets.whereis(:streampai_errors) do
      :undefined ->
        0

      _ ->
        errors_to_delete =
          :streampai_errors
          |> :ets.tab2list()
          |> Enum.filter(fn {_id, data} ->
            DateTime.before?(data.timestamp, cutoff_time)
          end)
          |> Enum.map(fn {id, _data} -> id end)

        Enum.each(errors_to_delete, &:ets.delete(:streampai_errors, &1))
        length(errors_to_delete)
    end
  end

  defp count_errors_since(errors, since) do
    Enum.count(errors, fn error ->
      DateTime.compare(error.timestamp, since) != :lt
    end)
  end

  defp calculate_hourly_rate(errors, now) do
    one_hour_ago = DateTime.add(now, -3600, :second)
    recent_errors = count_errors_since(errors, one_hour_ago)
    Float.round(recent_errors / 1.0, 2)
  end

  defp get_top_error_paths(errors, limit) do
    errors
    |> Enum.group_by(& &1.path)
    |> Enum.map(fn {path, path_errors} -> {path, length(path_errors)} end)
    |> Enum.sort_by(fn {_path, count} -> count end, :desc)
    |> Enum.take(limit)
  end

  defp get_top_error_types(errors, limit) do
    errors
    |> Enum.group_by(fn error ->
      case error.type do
        :application_error -> error.exception.module
        :http_error -> "HTTP #{error.status}"
        other -> other
      end
    end)
    |> Enum.map(fn {type, type_errors} -> {type, length(type_errors)} end)
    |> Enum.sort_by(fn {_type, count} -> count end, :desc)
    |> Enum.take(limit)
  end

  defp get_most_affected_users(errors, limit) do
    errors
    |> Enum.filter(& &1.user_id)
    |> Enum.group_by(& &1.user_id)
    |> Enum.map(fn {user_id, user_errors} -> {user_id, length(user_errors)} end)
    |> Enum.sort_by(fn {_user_id, count} -> count end, :desc)
    |> Enum.take(limit)
  end
end
