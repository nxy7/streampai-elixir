defmodule StreampaiWeb.TestHelpers.AuthHelper do
  @moduledoc """
  Authentication helper for tests following Ash Authentication testing recommendations.

  This module provides utilities to create and authenticate real users for tests,
  following the official Ash Authentication testing guide.
  """

  alias Streampai.Accounts.User
  alias AshAuthentication.Plug.Helpers

  @doc """
  Registers and logs in a user for testing.

  This follows the Ash Authentication testing pattern of creating a real user
  with hashed password and proper session storage.

  ## Options
  - `:email` - User email (default: generates unique email)
  - `:password` - User password (default: "password123")
  - `:confirmed` - Whether user is confirmed (default: true)
  - `:name` - User name (default: generates from email)

  ## Examples

      # Basic authenticated user
      user = register_and_log_in_user(%{})

      # Custom user
      user = register_and_log_in_user(%{email: "test@example.com"})
      
      # With connection
      {conn, user} = register_and_log_in_user(build_conn())
  """
  def register_and_log_in_user(conn_or_attrs \\ %{})

  def register_and_log_in_user(%Plug.Conn{} = conn) do
    user = user_fixture()
    {log_in_user(conn, user), user}
  end

  def register_and_log_in_user(attrs) when is_map(attrs) do
    user_fixture(attrs)
  end

  @doc """
  Creates a user fixture for testing with sensible defaults.
  """
  def user_fixture(attrs \\ %{}) do
    email = Map.get(attrs, :email, "test#{System.unique_integer([:positive])}@example.com")
    password = Map.get(attrs, :password, "password123")
    name = Map.get(attrs, :name, email |> String.split("@") |> hd() |> String.capitalize())

    user =
      User
      |> Ash.Changeset.for_create(:register_with_password, %{
        email: email,
        password: password,
        password_confirmation: password
      })
      |> Ash.create!()

    # Confirm user if needed (default true)
    confirmed = Map.get(attrs, :confirmed, true)
    user = if confirmed, do: confirm_user(user), else: user

    # Set name if provided
    user = if name, do: set_user_name(user, name), else: user

    user
  end

  @doc """
  Logs in a user by storing them in the connection session.
  """
  def log_in_user(conn, user) do
    conn
    |> Phoenix.ConnTest.init_test_session(%{})
    |> Helpers.store_in_session(user)
  end

  @doc """
  Creates an admin user for testing.
  Uses the hardcoded admin email from the User policies.
  """
  def admin_fixture(attrs \\ %{}) do
    # From User policies
    admin_attrs = Map.put(attrs, :email, Streampai.Constants.admin_email())
    user_fixture(admin_attrs)
  end

  @doc """
  Creates and logs in an admin user.
  """
  def register_and_log_in_admin(conn) do
    admin = admin_fixture()
    {log_in_user(conn, admin), admin}
  end

  # Private helpers

  defp confirm_user(user) do
    # For tests, manually set confirmed_at using direct database update
    # In production this would go through the confirmation flow
    confirmed_at = DateTime.utc_now()

    import Ecto.Query

    case Streampai.Repo.update_all(
           from(u in Streampai.Accounts.User, where: u.id == ^user.id),
           set: [confirmed_at: confirmed_at]
         ) do
      {1, _} -> %{user | confirmed_at: confirmed_at}
      # fallback with manual assignment
      _ -> %{user | confirmed_at: confirmed_at}
    end
  end

  defp set_user_name(user, name) when is_binary(name) do
    case user
         |> Ash.Changeset.for_update(:update_name, %{name: name})
         |> Ash.update() do
      {:ok, updated_user} -> updated_user
      # fallback to original user if name update fails
      _ -> user
    end
  end
end
