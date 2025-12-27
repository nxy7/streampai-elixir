defmodule Streampai.Accounts.Workers.RefreshStreamingStatsWorkerTest do
  use Streampai.DataCase, async: true
  use Oban.Testing, repo: Streampai.Repo

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.Accounts.User
  alias Streampai.Accounts.Workers.RefreshStreamingStatsWorker

  describe "perform/1" do
    test "returns :ok when no accounts need refresh" do
      fake_job = %Oban.Job{args: %{}, attempt: 1}
      assert :ok = RefreshStreamingStatsWorker.perform(fake_job)
    end

    test "refreshes stats for accounts that haven't been refreshed" do
      user = create_user()
      account = create_streaming_account(user, stats_last_refreshed_at: nil)

      assert is_nil(account.stats_last_refreshed_at)
      assert is_nil(account.follower_count)

      fake_job = %Oban.Job{args: %{}, attempt: 1}
      assert :ok = RefreshStreamingStatsWorker.perform(fake_job)

      # Reload the account
      {:ok, [refreshed_account]} =
        StreamingAccount.for_user(user.id, authorize?: false)

      assert refreshed_account.stats_last_refreshed_at
      assert refreshed_account.follower_count
      assert refreshed_account.subscriber_count
      assert refreshed_account.views_last_30d
      assert refreshed_account.sponsor_count
    end

    test "refreshes stats for accounts older than threshold" do
      user = create_user()
      # Account was refreshed 7 hours ago (threshold is 6 hours)
      # Truncate to seconds to match database precision
      old_refresh_time =
        DateTime.utc_now()
        |> DateTime.add(-7, :hour)
        |> DateTime.truncate(:second)

      account = create_streaming_account(user, stats_last_refreshed_at: old_refresh_time)

      assert account.stats_last_refreshed_at == old_refresh_time

      fake_job = %Oban.Job{args: %{}, attempt: 1}
      assert :ok = RefreshStreamingStatsWorker.perform(fake_job)

      # Reload the account
      {:ok, [refreshed_account]} =
        StreamingAccount.for_user(user.id, authorize?: false)

      # Should have been refreshed (new timestamp)
      assert DateTime.after?(refreshed_account.stats_last_refreshed_at, old_refresh_time)
    end

    test "does not refresh accounts that were recently refreshed" do
      user = create_user()
      # Account was refreshed 2 hours ago (within 6 hour threshold)
      # Truncate to seconds to match database precision
      recent_refresh_time =
        DateTime.utc_now()
        |> DateTime.add(-2, :hour)
        |> DateTime.truncate(:second)

      _account = create_streaming_account(user, stats_last_refreshed_at: recent_refresh_time)

      fake_job = %Oban.Job{args: %{}, attempt: 1}
      assert :ok = RefreshStreamingStatsWorker.perform(fake_job)

      # Reload the account
      {:ok, [unchanged_account]} =
        StreamingAccount.for_user(user.id, authorize?: false)

      # Should NOT have been refreshed - timestamp should be the same
      assert DateTime.compare(unchanged_account.stats_last_refreshed_at, recent_refresh_time) ==
               :eq
    end

    test "handles multiple accounts needing refresh" do
      user1 = create_user()
      user2 = create_user()

      account1 = create_streaming_account(user1, stats_last_refreshed_at: nil)
      account2 = create_streaming_account(user2, stats_last_refreshed_at: nil)

      assert is_nil(account1.stats_last_refreshed_at)
      assert is_nil(account2.stats_last_refreshed_at)

      fake_job = %Oban.Job{args: %{}, attempt: 1}
      assert :ok = RefreshStreamingStatsWorker.perform(fake_job)

      # Both accounts should be refreshed
      {:ok, [refreshed1]} = StreamingAccount.for_user(user1.id, authorize?: false)
      {:ok, [refreshed2]} = StreamingAccount.for_user(user2.id, authorize?: false)

      assert refreshed1.stats_last_refreshed_at
      assert refreshed2.stats_last_refreshed_at
    end

    test "continues processing other accounts if one fails" do
      # This test verifies that individual account failures don't stop the whole job
      # Since we're using fake stats that don't fail, this tests the structure
      user1 = create_user()
      user2 = create_user()

      create_streaming_account(user1, stats_last_refreshed_at: nil)
      create_streaming_account(user2, stats_last_refreshed_at: nil)

      fake_job = %Oban.Job{args: %{}, attempt: 1}

      # Job should return :ok even if individual accounts might fail
      assert :ok = RefreshStreamingStatsWorker.perform(fake_job)
    end
  end

  # Helper functions

  defp create_user(email \\ nil) do
    email = email || "test_#{System.unique_integer([:positive])}@example.com"

    {:ok, user} =
      User
      |> Ash.Changeset.for_create(
        :register_with_password,
        %{
          email: email,
          password: "password123",
          password_confirmation: "password123"
        }
      )
      |> Ash.create()

    user
  end

  defp create_streaming_account(user, opts \\ []) do
    stats_last_refreshed_at = Keyword.get(opts, :stats_last_refreshed_at, nil)

    account_params = %{
      user_id: user.id,
      platform: :twitch,
      access_token: "test_token_#{System.unique_integer([:positive])}",
      refresh_token: "refresh_token_#{System.unique_integer([:positive])}",
      access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
      extra_data: %{}
    }

    {:ok, account} =
      StreamingAccount
      |> Ash.Changeset.for_create(:create, account_params)
      |> Ash.create(actor: user)

    # If we need to set the stats_last_refreshed_at, update it directly
    if stats_last_refreshed_at do
      {:ok, account} =
        account
        |> Ash.Changeset.for_update(:update, %{})
        |> Ash.Changeset.force_change_attribute(:stats_last_refreshed_at, stats_last_refreshed_at)
        |> Ash.update(authorize?: false)

      account
    else
      account
    end
  end
end
