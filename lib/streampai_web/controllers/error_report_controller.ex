defmodule StreampaiWeb.ErrorReportController do
  use StreampaiWeb, :controller

  require Logger
  require OpenTelemetry.Tracer, as: Tracer

  @max_body_size 10_240
  @max_message_length 1_000
  @max_stack_length 5_000
  @rate_limit 10
  @rate_window_ms 60_000

  def report(conn, params) do
    with :ok <- check_rate_limit(conn),
         :ok <- check_body_size(conn),
         {:ok, error_data} <- validate_params(params) do
      record_error(error_data, conn)
      json(conn, %{ok: true})
    else
      {:error, :rate_limited} ->
        conn
        |> put_status(429)
        |> json(%{error: "rate_limited"})

      {:error, :body_too_large} ->
        conn
        |> put_status(413)
        |> json(%{error: "body_too_large"})

      {:error, :invalid_params} ->
        conn
        |> put_status(400)
        |> json(%{error: "invalid_params"})
    end
  end

  defp check_rate_limit(conn) do
    ip = conn.remote_ip |> :inet.ntoa() |> to_string()
    key = {:fe_error, ip}
    now = System.monotonic_time(:millisecond)

    case :ets.lookup(:rate_limiter, key) do
      [{^key, count, window_start}] when now - window_start < @rate_window_ms ->
        if count >= @rate_limit,
          do: {:error, :rate_limited},
          else: bump_counter(key, count, window_start)

      _ ->
        :ets.insert(:rate_limiter, {key, 1, now})
        :ok
    end
  end

  defp bump_counter(key, count, window_start) do
    :ets.insert(:rate_limiter, {key, count + 1, window_start})
    :ok
  end

  defp check_body_size(conn) do
    case Plug.Conn.get_req_header(conn, "content-length") do
      [size_str] ->
        case Integer.parse(size_str) do
          {size, _} when size > @max_body_size -> {:error, :body_too_large}
          _ -> :ok
        end

      _ ->
        :ok
    end
  end

  defp validate_params(%{"message" => message} = params) when is_binary(message) and message != "" do
    {:ok,
     %{
       message: String.slice(message, 0, @max_message_length),
       stack: params |> Map.get("stack", "") |> String.slice(0, @max_stack_length),
       url: params |> Map.get("url", "") |> String.slice(0, 2_000),
       timestamp: Map.get(params, "timestamp"),
       user_agent: Map.get(params, "userAgent", "")
     }}
  end

  defp validate_params(_), do: {:error, :invalid_params}

  defp record_error(error_data, conn) do
    Logger.warning("Frontend error: #{error_data.message}",
      error_type: :frontend,
      path: error_data.url,
      remote_ip: conn.remote_ip |> :inet.ntoa() |> to_string()
    )

    Tracer.with_span "frontend.error" do
      Tracer.set_attributes([
        {"error.message", error_data.message},
        {"error.url", error_data.url},
        {"error.source", "frontend"}
      ])

      Tracer.set_status(:error, error_data.message)
    end

    # Store in existing ETS error tracker
    error_id = 8 |> :crypto.strong_rand_bytes() |> Base.encode16(case: :lower)

    :ets.insert(
      :streampai_errors,
      {error_id,
       %{
         type: :frontend,
         message: error_data.message,
         stack: error_data.stack,
         url: error_data.url,
         timestamp: DateTime.utc_now()
       }}
    )
  end
end
