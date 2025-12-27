defmodule StreampaiWeb.Plugs.RpcLogger do
  @moduledoc """
  Plug for logging detailed Ash RPC request information.

  Instead of just logging "POST /api/rpc/run", this plug extracts and logs
  the actual action name, resource, and other relevant details from RPC requests.

  Example output:
    [info] RPC User.get_current_user (read) by user:abc123 in 5ms
    [info] RPC Notification.mark_all_read (action) by user:def456 in 12ms
  """
  @behaviour Plug

  require Logger

  def init(opts), do: opts

  def call(conn, _opts) do
    start_time = System.monotonic_time(:millisecond)

    Plug.Conn.register_before_send(conn, fn conn ->
      log_rpc_request(conn, start_time)
      conn
    end)
  end

  defp log_rpc_request(conn, start_time) do
    duration = System.monotonic_time(:millisecond) - start_time

    # Only log for RPC endpoints
    if rpc_endpoint?(conn.request_path) do
      action_info = extract_action_info(conn)
      user_info = format_user_info(conn)

      log_message = format_log_message(conn.request_path, action_info, user_info, duration)
      metadata = build_metadata(conn, action_info, duration)

      if conn.status >= 400 do
        Logger.warning(log_message, metadata)
      else
        Logger.info(log_message, metadata)
      end
    end
  end

  defp rpc_endpoint?(path) do
    String.starts_with?(path, "/api/rpc/run") or
      String.starts_with?(path, "/api/rpc/validate")
  end

  defp extract_action_info(conn) do
    params = conn.body_params

    cond do
      # Regular RPC action
      is_binary(params["action"]) ->
        %{
          action: params["action"],
          type: "action",
          typed_query: false
        }

      # Typed query action
      is_binary(params["typed_query_action"]) ->
        %{
          action: params["typed_query_action"],
          type: "typed_query",
          typed_query: true
        }

      true ->
        %{
          action: "unknown",
          type: "unknown",
          typed_query: false
        }
    end
  end

  defp format_user_info(conn) do
    case conn.assigns[:current_user] do
      %{id: id, email: email} ->
        # Show first part of email for context, truncated ID for brevity
        email_prefix = email |> String.split("@") |> List.first()
        short_id = String.slice(to_string(id), 0, 8)
        "#{email_prefix}(#{short_id})"

      %{id: id} ->
        short_id = String.slice(to_string(id), 0, 8)
        "user:#{short_id}"

      _ ->
        "anonymous"
    end
  end

  defp format_log_message(path, action_info, user_info, duration) do
    endpoint_type = if String.contains?(path, "validate"), do: "validate", else: "run"

    action_display =
      if action_info.typed_query do
        "#{action_info.action} (typed_query)"
      else
        action_info.action
      end

    "RPC #{endpoint_type} #{action_display} by #{user_info} in #{duration}ms"
  end

  defp build_metadata(conn, action_info, duration) do
    user_id =
      case conn.assigns[:current_user] do
        %{id: id} -> id
        _ -> nil
      end

    [
      rpc_action: action_info.action,
      rpc_type: action_info.type,
      user_id: user_id,
      duration_ms: duration,
      status: conn.status
    ]
  end
end
