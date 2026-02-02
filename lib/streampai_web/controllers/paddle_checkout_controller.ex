defmodule StreampaiWeb.PaddleCheckoutController do
  @moduledoc """
  Creates Paddle checkout sessions for subscriptions.

  The frontend calls this endpoint with a plan (monthly/yearly),
  and receives a checkout URL to redirect the user to.
  """
  use StreampaiWeb, :controller

  alias Streampai.Integrations.Paddle.Transactions

  require Logger

  def create(conn, %{"plan" => plan}) when plan in ["monthly", "yearly"] do
    user = conn.assigns[:current_user]

    if user do
      price_id = price_id_for_plan(plan)

      attrs = %{
        items: [%{price_id: price_id, quantity: 1}],
        custom_data: %{user_id: user.id, plan: plan},
        customer_email: user.email
      }

      case Transactions.create(attrs) do
        {:ok, %{"data" => %{"checkout" => %{"url" => checkout_url}}}}
        when is_binary(checkout_url) ->
          json(conn, %{checkout_url: checkout_url})

        {:error, error} ->
          Logger.error("Failed to create Paddle checkout: #{inspect(error)}")
          conn |> put_status(500) |> json(%{error: "Failed to create checkout"})
      end
    else
      conn |> put_status(401) |> json(%{error: "Not authenticated"})
    end
  end

  def create(conn, _params) do
    conn |> put_status(400) |> json(%{error: "Invalid plan. Use 'monthly' or 'yearly'"})
  end

  defp price_id_for_plan("monthly") do
    Application.get_env(:streampai, :paddle)[:price_pro_monthly] ||
      raise "PADDLE_PRICE_PRO_MONTHLY not configured"
  end

  defp price_id_for_plan("yearly") do
    Application.get_env(:streampai, :paddle)[:price_pro_yearly] ||
      raise "PADDLE_PRICE_PRO_YEARLY not configured"
  end
end
