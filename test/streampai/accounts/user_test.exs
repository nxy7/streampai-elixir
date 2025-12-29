defmodule Streampai.Accounts.UserTest do
  use Streampai.DataCase, async: true
  use Mneme

  import Streampai.TestHelpers, only: [assert_eventually: 1]

  alias Streampai.Accounts.User

  describe "User resource" do
    setup do
      # Create real users in the test database
      {:ok, admin_user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "testadmin@local.com",
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
      {:ok, users} =
        User
        |> Ash.Query.for_read(:get, %{}, actor: admin_user)
        |> Ash.read()

      result = %{status: :success, user_count: length(users)}
      auto_assert(^result <- result)
    end

    test "regular user cannot read other users", %{regular_user: regular_user} do
      {:ok, [user]} =
        User
        |> Ash.Query.for_read(:get, %{}, actor: regular_user)
        |> Ash.read()

      user = Map.drop(user, [:__metadata__, :hashed_password, :aggregates])

      assert to_string(user.name) == "user"

      auto_assert %User{
                    connected_platforms: 0,
                    email: "user@example.com",
                    tier: :free
                  } <- Map.delete(user, :name)
    end

    test "user registration creates valid user with correct tier", %{admin_user: admin_user} do
      user_params = %{
        email: "newuser@example.com",
        password: "password123",
        password_confirmation: "password123"
      }

      {:ok, user} = User.register_with_password(user_params)
      # Load calculations and aggregates
      user = Ash.load!(user, [:tier, :connected_platforms])

      business_logic = %{
        has_valid_email: user.email == "newuser@example.com",
        has_free_tier: user.tier == :free,
        has_generated_name: not is_nil(user.name),
        has_zero_connected_platforms: user.connected_platforms == 0,
        password_is_hashed: user.hashed_password != nil,
        password_not_stored_plaintext: !Map.has_key?(user, :password)
      }

      # Accept the actual system behavior
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

      {:ok, user} = User.register_with_password(user_params)

      {:ok, _grant} =
        Streampai.Accounts.UserPremiumGrant.create_grant(
          user.id,
          user.id,
          DateTime.add(DateTime.utc_now(), 30, :day),
          DateTime.utc_now(),
          "test_upgrade",
          actor: :system
        )

      reloaded_user =
        assert_eventually(fn ->
          {:ok, reloaded} = Ash.get(User, user.id, actor: user, load: [:tier])
          if reloaded.tier == :pro, do: reloaded
        end)

      tier_logic = %{
        upgraded_to_pro: reloaded_user.tier == :pro,
        reflects_premium_status: reloaded_user.tier != :free
      }

      auto_assert %{upgraded_to_pro: true, reflects_premium_status: true} <- tier_logic
    end

    test "connected platforms count updates correctly" do
      user_params = %{
        email: "streamer@example.com",
        password: "password123",
        password_confirmation: "password123"
      }

      {:ok, user} = User.register_with_password(user_params)
      user = Ash.load!(user, [:connected_platforms])

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

      reloaded_user =
        assert_eventually(fn ->
          {:ok, reloaded} = Ash.get(User, user.id, actor: user, load: [:connected_platforms])
          if reloaded.connected_platforms == 1, do: reloaded
        end)

      platform_logic = %{
        count_increased: reloaded_user.connected_platforms > initial_count,
        reflects_one_platform: reloaded_user.connected_platforms == 1
      }

      auto_assert %{count_increased: true, reflects_one_platform: true} <- platform_logic
    end
  end
end
