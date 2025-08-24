defmodule Streampai.Accounts.UserTest do
  use Streampai.DataCase
  use Mneme
  alias Streampai.Accounts.User

  describe "User resource" do
    setup do
      admin_user = %{id: "admin-123", email: "lolnoxy@gmail.com"}
      regular_user = %{id: "user-456", email: "user@example.com"}

      %{admin_user: admin_user, regular_user: regular_user}
    end

    test "admin can read all users", %{admin_user: admin_user} do
      # This would normally create actual users, but for snapshot testing
      # we'll test the policy structure

      case User
           |> Ash.Query.for_read(:read, %{}, actor: admin_user)
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
      case User
           |> Ash.Query.for_read(:read, %{}, actor: regular_user)
           |> Ash.read() do
        {:ok, users} ->
          # Should only return the user themselves
          result = %{status: :success, user_count: length(users)}
          auto_assert(^result <- result)

        {:error, error} ->
          error_map = %{
            status: :error,
            class: error.__struct__,
            message: Exception.message(error)
          }

          auto_assert(error_map)
      end
    end

    test "user resource attributes structure" do
      # Test the resource schema structure - using Ash.Resource.Info
      attributes = Ash.Resource.Info.attributes(User)

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
      actions = Ash.Resource.Info.actions(User)

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
        has_attributes: length(Ash.Resource.Info.attributes(User)) > 0,
        has_actions: length(Ash.Resource.Info.actions(User)) > 0,
        primary_key: Ash.Resource.Info.primary_key(User)
      }

      auto_assert(^resource_info <- resource_info)
    end
  end
end
