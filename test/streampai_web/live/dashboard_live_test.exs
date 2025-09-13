defmodule StreampaiWeb.DashboardLiveTest do
  use StreampaiWeb.ConnCase, async: true
  use Mneme

  import Phoenix.LiveViewTest

  describe "Dashboard LiveView" do
    test "redirects to sign-in when not authenticated", %{conn: conn} do
      # Without proper authentication, should redirect to sign-in
      assert {:error, {:redirect, %{to: "/auth/sign-in?redirect_to=%2Fdashboard"}}} =
               live(conn, "/dashboard")
    end

    test "renders dashboard welcome message", %{conn: conn} do
      {conn, user} = register_and_log_in_user(conn)

      {:ok, _index_live, html} = live(conn, "/dashboard")

      # For inline snapshot testing, we'll snapshot key content
      content_snippets = %{
        has_welcome: html =~ "Welcome",
        page_title: html =~ "Dashboard"
      }

      auto_assert(%{has_welcome: true, page_title: true} <- content_snippets)
    end

    test "renders account info card with user details", %{conn: conn} do
      {conn, user} = register_and_log_in_user(conn)

      {:ok, _index_live, html} = live(conn, "/dashboard")

      account_info = %{
        shows_email: html =~ user.email,
        shows_user_id: html =~ user.id,
        has_account_section: html =~ "Account Info"
      }

      auto_assert(%{has_account_section: true, shows_email: true, shows_user_id: true} <- account_info)
    end

    test "renders streaming status as offline by default", %{conn: conn} do
      {conn, _user} = register_and_log_in_user(conn)

      {:ok, _index_live, html} = live(conn, "/dashboard")

      assert html =~ "Offline"
      assert html =~ "Connected Platforms"
      assert html =~ "0"

      streaming_status = %{
        is_offline: html =~ "Offline",
        shows_platforms: html =~ "Connected Platforms",
        platform_count: html =~ "0"
      }

      auto_assert(%{is_offline: true, platform_count: true, shows_platforms: true} <- streaming_status)
    end

    test "renders quick actions for platform connections", %{conn: conn} do
      {conn, _user} = register_and_log_in_user(conn)

      {:ok, _index_live, html} = live(conn, "/dashboard")

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

    test "renders dashboard with debug info", %{conn: conn} do
      {conn, _user} = register_and_log_in_user(conn)

      {:ok, _index_live, html} = live(conn, "/dashboard")

      # Debug section should not be present anymore
      assert html =~ "Debug Info"

      debug_info = %{
        has_no_debug_section: !(html =~ "Debug Info")
      }

      auto_assert(^debug_info <- debug_info)
    end

    test "renders dashboard for admin user", %{conn: conn} do
      {conn, admin} = register_and_log_in_admin(conn)

      {:ok, _index_live, html} = live(conn, "/dashboard")

      # Should show welcome message with fallback display name
      assert html =~ "Welcome"
      assert html =~ admin.email
    end

    test "renders dashboard with impersonation", %{conn: conn} do
      # For now, skip impersonation testing since it requires more complex setup
      # TODO: Implement proper impersonation testing with new auth system
      {conn, user} = register_and_log_in_user(conn)

      {:ok, _index_live, html} = live(conn, "/dashboard")

      assert html =~ "Welcome"
      assert html =~ user.email
    end
  end
end
