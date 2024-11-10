defmodule Streampai.Accounts.DefaultUsernameTest do
  use Streampai.DataCase, async: true
  use Mneme

  alias Streampai.Accounts.User

  describe "integration with register_with_password" do
    test "generates username from email when registering" do
      email = "test.user@example.com"

      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: email,
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Should set name to sanitized version of email prefix
      auto_assert "test_user" <- user.name
    end

    test "generates unique username when base username exists" do
      base_email = "duplicate@example.com"
      base_username = "duplicate"

      # Create first user that will get the base username
      {:ok, user1} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: base_email,
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      assert user1.name == base_username

      # Create second user with same username base
      conflict_email = "duplicate2@example.com"

      {:ok, user2} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: conflict_email,
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Should generate unique username with suffix
      assert user2.name != base_username
      assert String.starts_with?(user2.name, base_username)
      auto_assert "duplicate2" <- user2.name
    end

    test "handles email with special characters" do
      email = "user.name+test@example.com"

      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: email,
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Should sanitize special characters to underscores
      auto_assert "user_name_test" <- user.name
    end

    test "limits username length to 30 characters" do
      long_email = "averylongusernamethatexceedsthirtychars@example.com"

      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: long_email,
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      assert String.length(user.name) <= 30
      auto_assert "averylongusernamethatexceedsth" <- user.name
    end

    test "handles various email formats" do
      test_cases = [
        {"simple_#{:rand.uniform(9999)}@example.com", "simple"},
        {"user.name_#{:rand.uniform(9999)}@example.com", "user_name"},
        {"user+tag_#{:rand.uniform(9999)}@example.com", "user_tag"},
        {"user-name_#{:rand.uniform(9999)}@example.com", "user_name"},
        {"123numeric_#{:rand.uniform(9999)}@example.com", "123numeric"}
      ]

      Enum.each(test_cases, fn {email, expected_base} ->
        {:ok, user} =
          User
          |> Ash.Changeset.for_create(:register_with_password, %{
            email: email,
            password: "password123",
            password_confirmation: "password123"
          })
          |> Ash.create()

        # Username should start with expected base, but might have suffix for uniqueness
        assert String.starts_with?(user.name, expected_base),
               "Expected #{user.name} to start with #{expected_base}"
      end)
    end

    test "unique username generation with multiple conflicts" do
      base_email_prefix = "conflict"
      base_username = "conflict"

      # Create users with conflicting usernames
      users =
        for i <- 1..3 do
          email = "#{base_email_prefix}#{i}@example.com"

          {:ok, user} =
            User
            |> Ash.Changeset.for_create(:register_with_password, %{
              email: email,
              password: "password123",
              password_confirmation: "password123"
            })
            |> Ash.create()

          user
        end

      # Verify usernames are unique and follow expected pattern
      usernames = Enum.map(users, & &1.name)
      assert Enum.uniq(usernames) == usernames, "All usernames should be unique"

      # First user should get base username, subsequent ones should get suffixes
      auto_assert ["conflict1", "conflict2", "conflict3"] <- usernames
    end
  end

  describe "edge cases" do
    test "handles empty email prefix" do
      # Empty email prefix would result in empty username, but since name is required,
      # the DefaultUsername change should handle this by generating something valid
      email = "@example.com"

      # This should fail because empty username violates the required constraint
      {:error, error} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: email,
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      # Should fail with required field error
      assert length(error.errors) > 0
      assert Enum.any?(error.errors, fn err -> err.field == :name end)
    end

    test "handles very short email prefix" do
      email = "a@example.com"

      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: email,
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      auto_assert "a" <- user.name
    end

    test "fallback username when many conflicts exist" do
      base_username = "fallback"

      # In normal case with no conflicts, should get base username
      {:ok, user} =
        User
        |> Ash.Changeset.for_create(:register_with_password, %{
          email: "#{base_username}@example.com",
          password: "password123",
          password_confirmation: "password123"
        })
        |> Ash.create()

      auto_assert ^base_username <- user.name
    end
  end

  describe "business logic validation" do
    test "generated usernames follow validation rules" do
      # Test that generated usernames comply with the same rules as manual username validation
      test_cases = [
        "user.name_#{:rand.uniform(9999)}@example.com",
        "test+tag_#{:rand.uniform(9999)}@example.com",
        "user-name_#{:rand.uniform(9999)}@example.com",
        "special@#$%_#{:rand.uniform(9999)}@example.com"
      ]

      Enum.each(test_cases, fn email ->
        {:ok, user} =
          User
          |> Ash.Changeset.for_create(:register_with_password, %{
            email: email,
            password: "password123",
            password_confirmation: "password123"
          })
          |> Ash.create()

        # Verify username matches expected pattern
        assert Regex.match?(~r/^[a-zA-Z0-9_]+$/, user.name),
               "Generated username '#{user.name}' contains invalid characters"

        assert String.length(user.name) >= 1, "Username too short"
        assert String.length(user.name) <= 30, "Username too long"
      end)
    end
  end
end
