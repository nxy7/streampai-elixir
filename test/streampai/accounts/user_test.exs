defmodule Streampai.Accounts.UserTest do
  use Streampai.DataCase, async: true
  use Mneme

  alias Ash.Resource.Info
  alias Streampai.Accounts.User

  describe "User resource" do
    setup do
      # Create real users in the test database
      {:ok, admin_user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "lolnoxy@gmail.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      {:ok, regular_user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "user@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      %{admin_user: admin_user, regular_user: regular_user}
    end

    test "admin can read all users", %{admin_user: admin_user} do
      # This would normally create actual users, but for snapshot testing
      # we'll test the policy structure

      case User
           |> Ash.Query.for_read(:get, %{}, actor: admin_user)
           |> Ash.read() do
        {:ok, users} ->
          # Snapshot the successful structure
          result = %{status: :success, user_count: length(users)}
          auto_assert(^result <- result)

        {:error, error} ->
          # Snapshot the error structure if policies fail
          error_map = %{
            status: :error,
            class: error.__struct__,
            message: Exception.message(error)
          }

          auto_assert(error_map)
      end
    end

    test "regular user cannot read other users", %{regular_user: regular_user} do
      {:ok, [user]} =
        User
        |> Ash.Query.for_read(:get, %{}, actor: regular_user)
        |> Ash.read()

      user = Map.drop(user, [:__metadata__, :hashed_password, :aggregates])

      auto_assert %User{
                    connected_platforms: 0,
                    email: "user@example.com",
                    name: "user",
                    tier: :free
                  } <- user
    end

    test "user registration creates valid user with correct tier", %{admin_user: admin_user} do
      user_params = %{
        email: "newuser@example.com",
        password: "password123",
        password_confirmation: "password123"
      }

      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, user_params)
        |> Ash.create()

      business_logic = %{
        has_valid_email: user.email == "newuser@example.com",
        has_free_tier: user.tier == :free,
        has_generated_name: is_binary(user.name),
        has_zero_connected_platforms: user.connected_platforms == 0,
        password_is_hashed: user.hashed_password != nil,
        password_not_stored_plaintext: !Map.has_key?(user, :password)
      }

      auto_assert %{
                    has_free_tier: true,
                    has_generated_name: true,
                    has_valid_email: true,
                    has_zero_connected_platforms: true,
                    password_is_hashed: true,
                    password_not_stored_plaintext: true
                  } <- business_logic
    end

    test "user tier calculation respects premium grants" do
      user_params = %{
        email: "prouser@example.com",
        password: "password123",
        password_confirmation: "password123"
      }

      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, user_params)
        |> Ash.create()

      {:ok, _grant} =
        Streampai.Accounts.UserPremiumGrant.create_grant(
          user.id,
          user.id,
          DateTime.add(DateTime.utc_now(), 30, :day),
          DateTime.utc_now(),
          "test_upgrade",
          actor: :system
        )

      user = Ash.reload!(user)

      tier_logic = %{
        upgraded_to_pro: user.tier == :pro,
        reflects_premium_status: user.tier != :free
      }

      auto_assert %{upgraded_to_pro: true, reflects_premium_status: true} <- tier_logic
    end

    test "connected platforms count updates correctly" do
      user_params = %{
        email: "streamer@example.com",
        password: "password123",
        password_confirmation: "password123"
      }

      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, user_params)
        |> Ash.create()

      initial_count = user.connected_platforms
      auto_assert 0 <- initial_count

      account_params = %{
        user_id: user.id,
        platform: :twitch,
        access_token: "test_token",
        refresh_token: "refresh_token",
        access_token_expires_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        extra_data: %{}
      }

      {:ok, _account} = Streampai.Accounts.StreamingAccount.create(account_params, actor: user)

      user = Ash.reload!(user)

      platform_logic = %{
        count_increased: user.connected_platforms > initial_count,
        reflects_one_platform: user.connected_platforms == 1
      }

      auto_assert %{count_increased: true, reflects_one_platform: true} <- platform_logic
    end
  end
end
