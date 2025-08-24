defmodule StreampaiWeb.DashboardLiveTest do
  use StreampaiWeb.ConnCase
  use Mneme
  import Phoenix.LiveViewTest

  describe "Dashboard LiveView" do
    test "redirects to sign-in when not authenticated", %{conn: conn} do
      # Without proper authentication, should redirect to sign-in
      assert {:error, {:redirect, %{to: "/sign-in"}}} = live(conn, "/dashboard")
    end

    test "renders dashboard welcome message", %{conn: conn} do
      user = create_mock_user(email: "test@example.com")

      {:ok, _index_live, html} =
        conn
        |> mock_user_conn(user_opts: [email: "test@example.com"])
        |> live("/dashboard")

      # For inline snapshot testing, we'll snapshot key content
      content_snippets = %{
        has_welcome: html =~ "Welcome back, Test!",
        page_title: html =~ "Dashboard"
      }

      auto_assert(%{has_welcome: true, page_title: true} <- content_snippets)
    end

    test "renders account info card with user details", %{conn: conn} do
      user = create_mock_user(email: "test@example.com")

      {:ok, _index_live, html} =
        conn
        |> mock_user_conn(user_opts: [email: "test@example.com"])
        |> live("/dashboard")

      account_info = %{
        shows_email: html =~ user.email,
        shows_user_id: html =~ user.id,
        has_account_section: html =~ "Account Info"
      }

      auto_assert(
        %{has_account_section: true, shows_email: true, shows_user_id: false} <- account_info
      )
    end

    test "renders streaming status as offline by default", %{conn: conn} do
      {:ok, _index_live, html} =
        conn
        |> mock_user_conn(user_opts: [email: "test@example.com"])
        |> live("/dashboard")

      assert html =~ "Offline"
      assert html =~ "Connected Platforms"
      assert html =~ "0"

      streaming_status = %{
        is_offline: html =~ "Offline",
        shows_platforms: html =~ "Connected Platforms",
        platform_count: html =~ "0"
      }

      auto_assert(
        %{is_offline: true, platform_count: true, shows_platforms: true} <- streaming_status
      )
    end

    test "renders quick actions for platform connections", %{conn: conn} do
      {:ok, _index_live, html} =
        conn
        |> mock_user_conn(user_opts: [email: "test@example.com"])
        |> live("/dashboard")

      assert html =~ "Connect Twitch"
      assert html =~ "Connect YouTube"
      assert html =~ "/streaming/connect/twitch"
      assert html =~ "/streaming/connect/google"

      quick_actions = %{
        has_twitch: html =~ "Connect Twitch",
        has_youtube: html =~ "Connect YouTube",
        twitch_link: html =~ "/streaming/connect/twitch",
        google_link: html =~ "/streaming/connect/google"
      }

      auto_assert(
        %{google_link: true, has_twitch: true, has_youtube: true, twitch_link: true} <-
          quick_actions
      )
    end

    test "renders debug info in development", %{conn: conn} do
      {:ok, _index_live, html} =
        conn
        |> mock_user_conn(user_opts: [email: "test@example.com"])
        |> live("/dashboard")

      # Debug section should be present
      assert html =~ "Debug Info"

      debug_info = %{
        has_debug_section: html =~ "Debug Info"
      }

      auto_assert(^debug_info <- debug_info)
    end

    test "renders dashboard for admin user", %{conn: conn} do
      {:ok, _index_live, html} =
        conn
        |> mock_user_conn(user_opts: [admin: true, email: "admin@example.com"])
        |> live("/dashboard")

      assert html =~ "Welcome back, Admin!"
      assert html =~ "admin@example.com"
    end

    test "renders dashboard with impersonation", %{conn: conn} do
      {:ok, _index_live, html} =
        conn
        |> mock_user_conn(
          user_opts: [email: "user@example.com"],
          impersonator_opts: [admin: true, email: "admin@example.com"]
        )
        |> live("/dashboard")

      assert html =~ "Welcome back, User!"
      assert html =~ "user@example.com"
    end
  end
end
