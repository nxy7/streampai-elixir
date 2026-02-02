defmodule StreampaiWeb.PaddleCallbackController do
  @moduledoc """
  Handles redirect callback after Paddle checkout.

  When a user completes payment on Paddle, they're redirected here.
  We verify the transaction/subscription status via Paddle API, grant pro
  access if active, then redirect to the frontend settings page.
  """
  use StreampaiWeb, :controller

  alias Streampai.Integrations.Paddle.SubscriptionVerifier
  alias Streampai.Jobs.PaddleSubscriptionPollJob

  require Logger

  def callback(conn, %{"_ptxn" => transaction_id}) do
    case SubscriptionVerifier.verify_transaction(transaction_id) do
      {:ok, :granted} ->
        redirect(conn, external: frontend_url(conn, "?payment=success"))

      {:ok, :not_ready} ->
        # Schedule a poll job to retry — payment may still be processing
        PaddleSubscriptionPollJob.schedule_for_transaction(transaction_id)
        redirect(conn, external: frontend_url(conn, "?payment=pending"))

      {:error, reason} ->
        Logger.error("Paddle callback verification failed: #{inspect(reason)}")
        redirect(conn, external: frontend_url(conn, "?payment=pending"))
    end
  end

  def callback(conn, _params) do
    redirect(conn, external: frontend_url(conn, ""))
  end

  defp frontend_url(conn, query) do
    origin =
      case conn |> get_req_header("referer") |> List.first() do
        nil ->
          # Use x-forwarded headers from Caddy, fall back to conn
          host =
            List.first(get_req_header(conn, "x-forwarded-host")) || "#{conn.host}:#{conn.port}"

          scheme = List.first(get_req_header(conn, "x-forwarded-proto")) || to_string(conn.scheme)
          "#{scheme}://#{host}"

        referer ->
          referer |> URI.parse() |> then(&"#{&1.scheme}://#{&1.authority}")
      end

    "#{origin}/dashboard/settings#{query}"
  end
end
