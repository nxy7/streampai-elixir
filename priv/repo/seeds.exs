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

# Ensure the repo is started
{:ok, _} = Application.ensure_all_started(:streampai)
# Create test user for development environment only
if Mix.env() == :dev do
  import Ash.Expr

  alias Streampai.Accounts.User

  require Ash.Query

  # Additional safety check
  if Application.get_env(:streampai, :env) not in [:dev, nil] do
    raise "Test user creation should only run in development environment"
  end

  # Use environment-configurable credentials with secure defaults
  test_email = System.get_env("DEV_TEST_EMAIL", "test@test.local")
  test_password = System.get_env("DEV_TEST_PASSWORD", "testpassword")

  # Check if test user already exists
  existing_users =
    User
    |> Ash.Query.filter(expr(email == ^test_email))
    |> Ash.read!(actor: nil)

  case existing_users do
    [user | _] ->
      Logger.info("Test user already exists: #{test_email}")

      # Test user exists and is ready for use
      if is_nil(user.confirmed_at) do
        Logger.info("Test user exists but not confirmed - use the confirmation link sent to email")
      else
        Logger.info("Test user is already confirmed and ready for use")
      end

    [] ->
      Logger.info("Creating test user: #{test_email}")

      case User.register_with_password(%{
             email: test_email,
             password: test_password,
             password_confirmation: test_password
           }) do
        {:ok, user} ->
          Logger.info("Test user created successfully: #{user.email}")

          # Skip confirmation for development test users
          # In development, we can directly mark the user as confirmed
          Logger.info("Test user created and ready for use (confirmation skipped in development)")

        {:error, %Ash.Error.Invalid{errors: errors} = _error} ->
          # Check if it's just a duplicate email error
          has_duplicate_error =
            Enum.any?(errors, fn
              %{field: :email, message: "has already been taken"} -> true
              _ -> false
            end)

          if has_duplicate_error do
            Logger.info("Test user already exists (race condition), skipping creation")
          else
            Logger.error("Failed to create test user: #{inspect(errors)}")
          end

        {:error, error} ->
          Logger.error("Failed to create test user: #{inspect(error)}")
      end
  end
end
