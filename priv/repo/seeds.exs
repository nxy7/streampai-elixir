# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Streampai.Repo.insert!(%Streampai.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

require Logger

# Create test user for development environment only
if Mix.env() == :dev do
  alias Streampai.Accounts.User

  test_email = "test@test.com"

  # Check if test user already exists
  existing_users =
    User
    |> Ash.Query.filter(email == ^test_email)
    |> Ash.read!(actor: nil)

  case existing_users do
    [_user | _] ->
      Logger.info("Test user already exists: #{test_email}")

    [] ->
      Logger.info("Creating test user: #{test_email}")

      case User.register_with_password(
             %{email: test_email},
             %{password: "test", password_confirmation: "test"},
             actor: nil,
             upsert?: true
           ) do
        {:ok, user} ->
          Logger.info("Test user created successfully: #{user.email}")

          # Confirm the user immediately so they can sign in
          case Ash.update(user, %{confirmed_at: DateTime.utc_now()}, actor: nil) do
            {:ok, _confirmed_user} ->
              Logger.info("Test user confirmed successfully")

            {:error, error} ->
              Logger.warning("Failed to confirm test user: #{inspect(error)}")
          end

        {:error, error} ->
          Logger.error("Failed to create test user: #{inspect(error)}")
      end
  end
end
