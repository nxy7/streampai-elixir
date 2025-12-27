defmodule Streampai.Accounts.StreamingAccount.RefreshStatsTest do
  use Streampai.DataCase, async: true
  use Oban.Testing, repo: Streampai.Repo

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.Accounts.User

  describe "refresh_stats action" do
    test "updates stats for an account" do
      user = create_user()
      account = create_streaming_account(user, stats_last_refreshed_at: nil)

      assert is_nil(account.stats_last_refreshed_at)
      assert is_nil(account.follower_count)

      # Call refresh_stats directly
      {:ok, refreshed_account} = StreamingAccount.refresh_stats(account, authorize?: false)

      assert refreshed_account.stats_last_refreshed_at
      assert refreshed_account.follower_count
      assert refreshed_account.subscriber_count
      assert refreshed_account.views_last_30d
      assert refreshed_account.sponsor_count
    end
  end

  describe "AshOban trigger filter (needs_stats_refresh)" do
    test "includes accounts that have never been refreshed" do
      user = create_user()
      account = create_streaming_account(user, stats_last_refreshed_at: nil)

      # Query accounts needing refresh using the same filter as the AshOban trigger
      accounts_needing_refresh = query_accounts_needing_refresh()

      assert Enum.any?(accounts_needing_refresh, &(&1.user_id == account.user_id))
    end

    test "includes accounts older than 6 hours threshold" do
      user = create_user()
      # Account was refreshed 7 hours ago (threshold is 6 hours)
      old_refresh_time =
        DateTime.utc_now()
        |> DateTime.add(-7, :hour)
        |> DateTime.truncate(:second)

      account = create_streaming_account(user, stats_last_refreshed_at: old_refresh_time)

      accounts_needing_refresh = query_accounts_needing_refresh()

      assert Enum.any?(accounts_needing_refresh, &(&1.user_id == account.user_id))
    end

    test "excludes accounts that were recently refreshed" do
      user = create_user()
      # Account was refreshed 2 hours ago (within 6 hour threshold)
      recent_refresh_time =
        DateTime.utc_now()
        |> DateTime.add(-2, :hour)
        |> DateTime.truncate(:second)

      account = create_streaming_account(user, stats_last_refreshed_at: recent_refresh_time)

      accounts_needing_refresh = query_accounts_needing_refresh()

      refute Enum.any?(accounts_needing_refresh, &(&1.user_id == account.user_id))
    end

    test "correctly filters mixed accounts" do
      user1 = create_user()
      user2 = create_user()
      user3 = create_user()

      # User 1: never refreshed - should be included
      account1 = create_streaming_account(user1, stats_last_refreshed_at: nil)

      # User 2: refreshed 7 hours ago - should be included
      old_time =
        DateTime.utc_now()
        |> DateTime.add(-7, :hour)
        |> DateTime.truncate(:second)

      account2 = create_streaming_account(user2, stats_last_refreshed_at: old_time)

      # User 3: refreshed 2 hours ago - should be excluded
      recent_time =
        DateTime.utc_now()
        |> DateTime.add(-2, :hour)
        |> DateTime.truncate(:second)

      account3 = create_streaming_account(user3, stats_last_refreshed_at: recent_time)

      accounts_needing_refresh = query_accounts_needing_refresh()

      assert Enum.any?(accounts_needing_refresh, &(&1.user_id == account1.user_id))
      assert Enum.any?(accounts_needing_refresh, &(&1.user_id == account2.user_id))
      refute Enum.any?(accounts_needing_refresh, &(&1.user_id == account3.user_id))
    end
  end

  describe "AshOban trigger configuration" do
    test "trigger is properly configured on StreamingAccount" do
      # Verify the AshOban trigger exists and has correct configuration
      triggers = AshOban.Info.oban_triggers(StreamingAccount)

      assert length(triggers) == 1
      [trigger] = triggers

      assert trigger.name == :refresh_stats_periodically
      assert trigger.action == :refresh_stats
      assert trigger.scheduler_cron == "*/30 * * * *"
      assert trigger.queue == :maintenance
      assert trigger.max_attempts == 3
    end
  end

  # Helper functions

  defp create_user do
    email = "test_#{System.unique_integer([:positive])}@example.com"

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

  defp create_streaming_account(user, opts) do
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

  defp query_accounts_needing_refresh do
    # Query using the same filter as the AshOban trigger's `where` clause
    require Ash.Query

    StreamingAccount
    |> Ash.Query.filter(
      is_nil(stats_last_refreshed_at) or
        stats_last_refreshed_at < ago(6, :hour)
    )
    |> Ash.read!(authorize?: false)
  end
end
