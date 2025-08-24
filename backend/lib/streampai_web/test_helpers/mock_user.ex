defmodule StreampaiWeb.TestHelpers.MockUser do
  @moduledoc """
  Mock user injection system for tests and development.

  This module provides utilities to inject mock users for testing different scenarios:
  - Different user types (admin, regular user, unconfirmed, etc.)
  - Impersonation scenarios
  - Various user states and plans
  - Bypass authentication in tests
  """

  # import Phoenix.ConnTest
  # import Phoenix.LiveViewTest

  @doc """
  Creates a mock user with various options.

  ## Options
  - `:email` - User email (default: "mock@example.com")
  - `:confirmed` - Whether user is confirmed (default: true)
  - `:admin` - Whether user is admin (default: false)
  - `:plan` - User plan (:free or :pro, default: :free)
  - `:id` - Specific user ID (default: generates UUID)

  ## Examples

      # Basic user
      user = MockUser.create_mock_user()

      # Admin user
      admin = MockUser.create_mock_user(admin: true, email: "admin@example.com")

      # Unconfirmed user
      unconfirmed = MockUser.create_mock_user(confirmed: false)

      # Pro plan user
      pro_user = MockUser.create_mock_user(plan: :pro)
  """
  def create_mock_user(opts \\ []) do
    id = Keyword.get(opts, :id, Ecto.UUID.generate())
    email = Keyword.get(opts, :email, "mock@example.com")
    confirmed = Keyword.get(opts, :confirmed, true)
    admin = Keyword.get(opts, :admin, false)
    plan = Keyword.get(opts, :plan, :free)

    confirmed_at = if confirmed, do: DateTime.utc_now(), else: nil

    # Adjust email for admin users
    final_email = if admin and email == "mock@example.com" do
      "lolnoxy@gmail.com" # This email is recognized as admin in Dashboard.admin?/1
    else
      email
    end

    %Streampai.Accounts.User{
      id: id,
      email: final_email,
      confirmed_at: confirmed_at,
      __meta__: %Ecto.Schema.Metadata{state: :loaded, source: "users"}
    }
    |> maybe_add_plan_data(plan)
  end

  @doc """
  Creates a connection with a mock user session for testing.

  ## Examples

      # Basic authenticated connection
      conn = MockUser.mock_user_conn(build_conn())

      # Admin user connection
      conn = MockUser.mock_user_conn(build_conn(), admin: true)

      # Impersonation scenario
      conn = MockUser.mock_user_conn(build_conn(),
        user_opts: [email: "user@example.com"],
        impersonator_opts: [admin: true, email: "admin@example.com"]
      )
  """
  def mock_user_conn(conn, opts \\ []) do
    user_opts = Keyword.get(opts, :user_opts, [])
    impersonator_opts = Keyword.get(opts, :impersonator_opts, nil)

    user = create_mock_user(user_opts)
    impersonator = if impersonator_opts, do: create_mock_user(impersonator_opts), else: nil

    conn
    |> Plug.Test.init_test_session(%{})
    |> Plug.Conn.put_session("current_user_id", user.id)
    |> Plug.Conn.put_session("current_user_email", user.email)
    |> Plug.Conn.put_session("user_token", mock_token_for_user(user))
    |> Plug.Conn.put_session("live_socket_id", "users_socket:#{user.id}")
    |> maybe_add_impersonator_session(impersonator)
    |> Plug.Conn.assign(:current_user, user)
    |> maybe_assign_impersonator(impersonator)
  end

  @doc """
  Mounts a LiveView with mock user authentication.

  ## Examples

      # Mount dashboard as regular user
      {:ok, view, html} = MockUser.mock_live(conn, "/dashboard")

      # Mount as admin
      {:ok, view, html} = MockUser.mock_live(conn, "/dashboard", admin: true)

      # Mount with impersonation
      {:ok, view, html} = MockUser.mock_live(conn, "/dashboard",
        user_opts: [email: "user@example.com"],
        impersonator_opts: [admin: true]
      )
  """
  def mock_live(conn, path, opts \\ []) do
    conn
    |> mock_user_conn(opts)
    |> Phoenix.LiveViewTest.live(path)
  end

  @doc """
  Creates predefined user scenarios for common test cases.

  ## Available scenarios
  - `:regular_user` - Basic confirmed user
  - `:admin_user` - Admin user
  - `:unconfirmed_user` - User that hasn't confirmed email
  - `:pro_user` - User with pro plan
  - `:impersonation` - Regular user being impersonated by admin

  ## Examples

      conn = MockUser.user_scenario(build_conn(), :admin_user)
      conn = MockUser.user_scenario(build_conn(), :impersonation)
  """
  def user_scenario(conn, scenario) do
    case scenario do
      :regular_user ->
        mock_user_conn(conn, user_opts: [])

      :admin_user ->
        mock_user_conn(conn, user_opts: [admin: true])

      :unconfirmed_user ->
        mock_user_conn(conn, user_opts: [confirmed: false])

      :pro_user ->
        mock_user_conn(conn, user_opts: [plan: :pro])

      :impersonation ->
        mock_user_conn(conn,
          user_opts: [email: "user@example.com"],
          impersonator_opts: [admin: true, email: "admin@example.com"]
        )

      _ ->
        raise "Unknown user scenario: #{scenario}"
    end
  end

  # Helper to generate a mock token for testing
  defp mock_token_for_user(user) do
    # Create a simple mock token - in real tests this would be more sophisticated
    "mock_token_#{user.id}"
  end

  defp maybe_add_impersonator_session(conn, nil), do: conn
  defp maybe_add_impersonator_session(conn, impersonator) do
    conn
    |> Plug.Conn.put_session("impersonator_id", impersonator.id)
    |> Plug.Conn.put_session("impersonator_token", mock_token_for_user(impersonator))
  end

  defp maybe_assign_impersonator(conn, nil), do: conn
  defp maybe_assign_impersonator(conn, impersonator) do
    Plug.Conn.assign(conn, :impersonator, impersonator)
  end

  defp maybe_add_plan_data(user, :free), do: user
  defp maybe_add_plan_data(user, :pro) do
    # In a real implementation, you might have a separate plans table
    # For now, we'll just add a virtual field or metadata
    Map.put(user, :plan, :pro)
  end
end
