defmodule StreampaiWeb.Plugs.ErrorTracker do
  @moduledoc """
  Plug for tracking and logging errors in ETS.
  """
  require Logger

  @behaviour Plug

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
    case :ets.whereis(:streampai_errors) do
      :undefined ->
        :ets.new(:streampai_errors, [:named_table, :public, :set, {:read_concurrency, true}])

      _ ->
        :ok
    end

    current_count = :ets.info(:streampai_errors, :size) || 0

    if current_count >= 1000 do
      oldest_keys =
        :ets.tab2list(:streampai_errors)
        |> Enum.sort_by(fn {_id, data} -> data.timestamp end)
        |> Enum.take(100)
        |> Enum.map(fn {id, _data} -> id end)

      Enum.each(oldest_keys, &:ets.delete(:streampai_errors, &1))
    end

    :ets.insert(:streampai_errors, {error_data.id, error_data})
  end

  defp generate_error_id do
    :crypto.strong_rand_bytes(8) |> Base.encode16() |> String.downcase()
  end

  defp get_header(conn, header_name) do
    case Plug.Conn.get_req_header(conn, header_name) do
      [value | _] -> value
      [] -> nil
    end
  end

  defp get_current_user_id(conn) do
    case conn.assigns.current_user do
      %{id: id} -> id
      _ -> nil
    end
  end

  defp get_session_id(conn) do
    Plug.Conn.get_session(conn, "_csrf_token") ||
      Plug.Conn.get_session(conn, "phoenix_flash") |> then(&inspect(&1)) |> String.slice(0, 16)
  end

  defp get_client_ip(conn) do
    case Plug.Conn.get_req_header(conn, "x-forwarded-for") do
      [forwarded_ip | _] ->
        forwarded_ip |> String.split(",") |> List.first() |> String.trim()

      [] ->
        conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end

  defp get_response_body_sample(_conn) do
    nil
  end

  defp get_request_body_sample(conn) do
    if conn.method != "GET" and conn.body_params != %Plug.Conn.Unfetched{} do
      conn.body_params
      |> inspect()
      |> String.slice(0, 500)
    else
      nil
    end
  end

  def list_errors(limit \\ 50) do
    case :ets.whereis(:streampai_errors) do
      :undefined ->
        []

      _ ->
        :ets.tab2list(:streampai_errors)
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
end
