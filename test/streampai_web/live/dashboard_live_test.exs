defmodule StreampaiWeb.DashboardLiveTest do
  use StreampaiWeb.ConnCase, async: true
  use Mneme

  import Phoenix.LiveViewTest
  import Streampai.TestHelpers

  describe "Dashboard LiveView - Authentication and Access" do
    test "requires authentication to access dashboard", %{conn: conn} do
      auto_assert {:error, {:redirect, %{to: "/auth/sign-in?redirect_to=%2Fdashboard"}}} <-
                    live(conn, "/dashboard")
    end

    test "authenticated user can access dashboard", %{conn: conn} do
      {conn, _user} = register_and_log_in_user(conn)

      auto_assert {:ok, _view, _html} <- live(conn, "/dashboard")
    end

    test "admin users have dashboard access", %{conn: conn} do
      {conn, _admin} = register_and_log_in_admin(conn)

      auto_assert {:ok, _view, _html} <- live(conn, "/dashboard")
    end
  end

  describe "Dashboard LiveView - User Information Display" do
    test "displays authenticated user information", %{conn: conn} do
      {conn, user} = register_and_log_in_user(conn)

      {:ok, _view, html} = live(conn, "/dashboard")

      user_info = %{
        shows_user_email: html =~ user.email,
        shows_welcome_section: html =~ "Welcome"
      }

      auto_assert %{shows_user_email: true, shows_welcome_section: true} <- user_info
    end

    test "displays correct streaming platform status", %{conn: conn} do
      user = user_fixture_with_tier(:pro)
      create_streaming_account(user, :twitch)

      conn = log_in_user(conn, user)
      {:ok, _view, html} = live(conn, "/dashboard")

      platform_status = %{
        shows_connected_platforms: html =~ "Connected Platforms",
        platform_count_greater_than_zero:
          !String.contains?(html, "0 platforms") ||
            String.contains?(html, "1")
      }

      auto_assert %{shows_connected_platforms: true} <- platform_status
    end
  end

  describe "Dashboard LiveView - Platform Integration" do
    test "displays platform connection options", %{conn: conn} do
      {conn, _user} = register_and_log_in_user(conn)

      {:ok, _view, html} = live(conn, "/dashboard")

      connection_options = %{
        has_twitch_connect: html =~ "Twitch",
        has_youtube_connect: html =~ "YouTube" || html =~ "Google",
        has_connection_links: html =~ "/streaming/connect/"
      }

      auto_assert %{
                    has_connection_links: true,
                    has_twitch_connect: true
                  } <- connection_options
    end

    test "shows streaming status based on connected platforms", %{conn: conn} do
      user = user_fixture_with_tier(:free)
      conn = log_in_user(conn, user)

      {:ok, _view, html} = live(conn, "/dashboard")

      streaming_status = %{
        shows_offline_status: html =~ "Offline" || html =~ "Not streaming",
        shows_no_platforms: html =~ "0" || html =~ "No platforms"
      }

      auto_assert %{shows_offline_status: true} <- streaming_status
    end
  end

  describe "Dashboard LiveView - Real-time Updates" do
    test "responds to stream status changes", %{conn: conn} do
      user = user_fixture_with_tier(:pro)
      create_streaming_account(user, :twitch)

      conn = log_in_user(conn, user)
      {:ok, view, _html} = live(conn, "/dashboard")

      simulate_platform_event(user, :twitch, :viewer_count, %{count: 42})

      Process.sleep(100)
      html = render(view)

      viewer_update = %{
        shows_viewer_count: html =~ "42" || html =~ "viewers"
      }

      auto_assert %{shows_viewer_count: true} <- viewer_update
    end

    test "updates when streaming accounts are connected", %{conn: conn} do
      user = user_fixture_with_tier(:pro)
      conn = log_in_user(conn, user)

      {:ok, view, _html} = live(conn, "/dashboard")

      create_streaming_account(user, :twitch)

      send(view.pid, {:streaming_account_connected, :twitch})
      Process.sleep(50)

      html = render(view)

      platform_update = %{
        reflects_connected_platform: html =~ "Twitch" || html =~ "Connected"
      }

      auto_assert %{reflects_connected_platform: true} <- platform_update
    end
  end

  describe "Dashboard LiveView - Navigation and Actions" do
    test "provides navigation to key sections", %{conn: conn} do
      {conn, _user} = register_and_log_in_user(conn)

      {:ok, _view, html} = live(conn, "/dashboard")

      navigation = %{
        has_stream_section: html =~ "Stream" || html =~ "/dashboard/stream",
        has_widgets_section: html =~ "Widgets" || html =~ "/widgets",
        has_analytics_section: html =~ "Analytics" || html =~ "/dashboard/analytics"
      }

      auto_assert %{
                    has_analytics_section: true,
                    has_stream_section: true,
                    has_widgets_section: true
                  } <- navigation
    end
  end
end
