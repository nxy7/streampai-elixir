defmodule Streampai.Accounts.Workers.RefreshStreamingStatsWorker do
  @moduledoc """
  Oban worker that refreshes streaming account statistics.

  This worker runs every 30 minutes and refreshes stats for accounts
  that haven't been updated in the last 6 hours. It handles individual
  account failures gracefully without stopping the entire job.

  ## Rate Limiting

  To avoid hitting platform API limits, accounts are processed sequentially
  with a small delay between each refresh. This can be adjusted when real
  API calls are implemented.
  """

  use Oban.Worker,
    queue: :maintenance,
    max_attempts: 3

  alias Streampai.Accounts.StreamingAccount

  require Logger

  @hours_threshold 6
  @delay_between_accounts_ms 100

  @impl Oban.Worker
  def perform(%Oban.Job{attempt: attempt}) do
    Logger.info("Starting streaming stats refresh job", attempt: attempt)

    case StreamingAccount.needs_stats_refresh(@hours_threshold, authorize?: false) do
      {:ok, accounts} ->
        refresh_accounts(accounts)

      {:error, reason} ->
        Logger.error("Failed to query accounts needing stats refresh",
          reason: inspect(reason),
          attempt: attempt
        )

        {:error, reason}
    end
  end

  defp refresh_accounts([]) do
    Logger.info("No accounts need stats refresh")
    :ok
  end

  defp refresh_accounts(accounts) do
    Logger.info("Refreshing stats for #{length(accounts)} accounts")

    results =
      Enum.map(accounts, fn account ->
        result = refresh_single_account(account)
        # Small delay between accounts to avoid rate limiting
        Process.sleep(@delay_between_accounts_ms)
        result
      end)

    successful = Enum.count(results, &(&1 == :ok))
    failed = Enum.count(results, &(&1 != :ok))

    Logger.info("Stats refresh completed",
      successful: successful,
      failed: failed,
      total: length(accounts)
    )

    # Return :ok even if some accounts failed - individual failures
    # shouldn't trigger a job retry for all accounts
    :ok
  end

  defp refresh_single_account(account) do
    Logger.debug("Refreshing stats for account",
      user_id: account.user_id,
      platform: account.platform
    )

    case StreamingAccount.refresh_stats(account, authorize?: false) do
      {:ok, _updated_account} ->
        Logger.debug("Successfully refreshed stats",
          user_id: account.user_id,
          platform: account.platform
        )

        :ok

      {:error, reason} ->
        Logger.warning("Failed to refresh stats for account",
          user_id: account.user_id,
          platform: account.platform,
          reason: inspect(reason)
        )

        {:error, reason}
    end
  end
end
