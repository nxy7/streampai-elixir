defmodule Streampai.Jobs.PaddleSubscriptionPollJob do
  @moduledoc """
  Polls Paddle to verify subscription status as a safety net.

  Scheduled after checkout creation and on redirect if payment is still processing.
  Schedules follow-up jobs with exponential backoff until the subscription is active
  or max polls are reached.
  """

  use Oban.Worker,
    queue: :default,
    max_attempts: 3,
    tags: ["paddle", "subscription"]

  alias Streampai.Integrations.Paddle.SubscriptionVerifier

  require Logger

  # Max number of poll cycles before giving up.
  # With exponential backoff (15s, 30s, 60s, 120s, then 600s cap),
  # 20 polls ≈ ~2.5 hours of polling.
  @max_polls 20

  @doc "Schedule a poll job for a Paddle transaction."
  def schedule_for_transaction(transaction_id) do
    %{transaction_id: transaction_id, poll_count: 1}
    |> new(schedule_in: 15)
    |> Oban.insert()
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"transaction_id" => transaction_id} = args}) do
    poll_count = Map.get(args, "poll_count", 1)
    Logger.info("Polling Paddle transaction #{transaction_id} (attempt #{poll_count})")

    case SubscriptionVerifier.verify_transaction(transaction_id) do
      {:ok, :granted} ->
        Logger.info("Paddle subscription verified and pro granted for txn #{transaction_id}")
        :ok

      {:ok, :not_ready} when poll_count >= @max_polls ->
        Logger.warning("Paddle txn #{transaction_id} still not ready after #{poll_count} polls, giving up")

        :ok

      {:ok, :not_ready} ->
        schedule_next_poll(transaction_id, poll_count)

      {:error, reason} ->
        Logger.error("Paddle poll failed for txn #{transaction_id}: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp schedule_next_poll(transaction_id, current_poll_count) do
    next_poll = current_poll_count + 1
    # Exponential backoff: 15s, 30s, 60s, 120s, ... capped at 600s (10 min)
    delay_seconds = min(15 * Integer.pow(2, current_poll_count - 1), 600)

    Logger.info("Paddle txn #{transaction_id} not ready, retrying in #{delay_seconds}s")

    %{transaction_id: transaction_id, poll_count: next_poll}
    |> new(schedule_in: delay_seconds)
    |> Oban.insert()

    :ok
  end
end
