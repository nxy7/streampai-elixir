defmodule Streampai.Accounts.StreamingAccountTest do
  use Streampai.DataCase
  use Mneme
  alias Streampai.Accounts.{User, StreamingAccount, UserPremiumGrant}

  describe "StreamingAccount tier checks" do
    setup do
      # Create a free tier user (no premium grants)
      {:ok, free_user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "free@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Create a pro tier user with premium grant
      {:ok, pro_user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "pro@example.com", 
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Add premium grant to make user pro
      {:ok, _grant} =
        UserPremiumGrant
        |> Ash.Changeset.for_create(:grant_premium, %{
          user_id: pro_user.id,
          lock_in_amount: 0,
          type: :grant,
          granted_until: Date.add(Date.utc_today(), 30)
        })
        |> Ash.create()

      %{free_user: free_user, pro_user: pro_user}
    end

    test "free tier user can connect their first streaming account", %{free_user: free_user} do
      account_params = %{
        user_id: free_user.id,
        platform: :twitch,
        access_token: "test_token",
        refresh_token: "refresh_token",
        access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        extra_data: %{}
      }

      {:ok, account} =
        StreamingAccount
        |> Ash.Changeset.for_create(:connect_with_tier_check, account_params)
        |> Ash.create()

      auto_assert account.platform == :twitch
      auto_assert account.user_id == free_user.id
    end

    test "free tier user cannot connect a second streaming account", %{free_user: free_user} do
      # First account succeeds
      account_params = %{
        user_id: free_user.id,
        platform: :twitch,
        access_token: "test_token",
        refresh_token: "refresh_token",
        access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        extra_data: %{}
      }

      {:ok, _first_account} =
        StreamingAccount
        |> Ash.Changeset.for_create(:connect_with_tier_check, account_params)
        |> Ash.create()

      # Second account should fail
      second_account_params = %{
        user_id: free_user.id,
        platform: :youtube,
        access_token: "test_token_2",
        refresh_token: "refresh_token_2",
        access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        extra_data: %{}
      }

      {:error, error} =
        StreamingAccount
        |> Ash.Changeset.for_create(:connect_with_tier_check, second_account_params)
        |> Ash.create()

      auto_assert %Ash.Error.Invalid{
                    errors: [
                      %Ash.Error.Changes.InvalidChanges{
                        message:
                          "Free tier users can only connect 1 streaming account. Upgrade to Pro for unlimited connections."
                      }
                    ]
                  } <- error
    end

    test "free tier user can reconnect the same platform", %{free_user: free_user} do
      # First connection
      account_params = %{
        user_id: free_user.id,
        platform: :twitch,
        access_token: "test_token",
        refresh_token: "refresh_token",
        access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        extra_data: %{}
      }

      {:ok, _first_account} =
        StreamingAccount
        |> Ash.Changeset.for_create(:connect_with_tier_check, account_params)
        |> Ash.create()

      # Reconnect same platform (should succeed due to upsert)
      updated_params = %{
        user_id: free_user.id,
        platform: :twitch,
        access_token: "new_token",
        refresh_token: "new_refresh_token",
        access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        extra_data: %{updated: true}
      }

      {:ok, updated_account} =
        StreamingAccount
        |> Ash.Changeset.for_create(:connect_with_tier_check, updated_params, upsert?: true)
        |> Ash.create()

      auto_assert updated_account.access_token == "new_token"
      auto_assert updated_account.extra_data.updated == true
    end

    test "pro tier user can connect multiple streaming accounts", %{pro_user: pro_user} do
      # Connect first account
      first_params = %{
        user_id: pro_user.id,
        platform: :twitch,
        access_token: "twitch_token",
        refresh_token: "twitch_refresh",
        access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        extra_data: %{}
      }

      {:ok, _first_account} =
        StreamingAccount
        |> Ash.Changeset.for_create(:connect_with_tier_check, first_params)
        |> Ash.create()

      # Connect second account (should succeed for pro users)
      second_params = %{
        user_id: pro_user.id,
        platform: :youtube,
        access_token: "youtube_token",
        refresh_token: "youtube_refresh",
        access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        extra_data: %{}
      }

      {:ok, second_account} =
        StreamingAccount
        |> Ash.Changeset.for_create(:connect_with_tier_check, second_params)
        |> Ash.create()

      auto_assert second_account.platform == :youtube
      auto_assert second_account.user_id == pro_user.id
    end
  end
end
