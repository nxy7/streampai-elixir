defmodule Streampai.Accounts.StreamingAccountTest do
  use Streampai.DataCase, async: true
  use Mneme

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.Accounts.User
  alias Streampai.Accounts.UserPremiumGrant

  describe "StreamingAccount tier checks" do
    setup do
      # Create a free tier user (no premium grants)
      {:ok, free_user} =
        User
        |> Ash.Changeset.for_create(
          :register_with_password,
          %{
            email: "free@example.com",
            password: "password123",
            password_confirmation: "password123"
          }
        )
        |> Ash.create()

      # Create a pro tier user with premium grant
      {:ok, pro_user} =
        User
        |> Ash.Changeset.for_create(
          :register_with_password,
          %{
            email: "pro@example.com",
            password: "password123",
            password_confirmation: "password123"
          }
        )
        |> Ash.create()

      # Add premium grant to make user pro
      {:ok, _grant} =
        UserPremiumGrant.create_grant(
          pro_user.id,
          pro_user.id,
          DateTime.add(DateTime.utc_now(), 30, :day),
          DateTime.utc_now(),
          "test_grant",
          actor: :system
        )

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
        |> Ash.Changeset.for_create(:create, account_params)
        |> Ash.create(actor: free_user)

      auto_assert true <- account.platform == :twitch
      auto_assert true <- account.user_id == free_user.id
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
        |> Ash.Changeset.for_create(:create, first_params)
        |> Ash.create(actor: pro_user)

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
        |> Ash.Changeset.for_create(:create, second_params)
        |> Ash.create(actor: pro_user)

      auto_assert true <- second_account.platform == :youtube
      auto_assert true <- second_account.user_id == pro_user.id
    end
  end
end
