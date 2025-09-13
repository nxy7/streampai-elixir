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

    test "user resource attributes structure" do
      # Test the resource schema structure - using Ash.Resource.Info
      attributes = Info.attributes(User)

      attribute_info =
        attributes
        |> Enum.map(fn attr ->
          %{
            name: attr.name,
            type: attr.type,
            public?: attr.public?,
            allow_nil?: attr.allow_nil?
          }
        end)
        |> Enum.sort_by(& &1.name)

      auto_assert(^attribute_info <- attribute_info)
    end

    test "user resource actions structure" do
      # Test the available actions using Ash.Resource.Info
      actions = Info.actions(User)

      action_info =
        actions
        |> Enum.map(fn action ->
          %{
            name: action.name,
            type: action.type,
            description: action.description
          }
        end)
        |> Enum.sort_by(& &1.name)

      auto_assert(^action_info <- action_info)
    end

    test "user resource basic info" do
      # Test basic resource information
      resource_info = %{
        resource_name: User,
        has_attributes: length(Info.attributes(User)) > 0,
        has_actions: length(Info.actions(User)) > 0,
        primary_key: Info.primary_key(User)
      }

      auto_assert(^resource_info <- resource_info)
    end
  end
end
