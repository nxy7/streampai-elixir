defmodule StreampaiWeb.Integration.WidgetSystemIntegrationTest do
  @moduledoc """
  Integration tests for the widget system functionality.

  Tests widget configuration, real-time updates, and OBS integration workflows.

  NOTE: These tests are designed for LiveView routes that don't exist in the Phoenix router.
  The dashboard is a SolidJS SPA served by the frontend. These tests are currently skipped
  but preserved for when/if LiveView dashboard routes are added.
  """
  use StreampaiWeb.ConnCase, async: true
  use Mneme

  # Tests are excluded because they test frontend SPA routes, not Phoenix LiveView routes
  @moduletag :integration
  @moduletag :skip

  import Phoenix.LiveViewTest
  import Streampai.TestHelpers

  # Frontend SPA routes - not verified by Phoenix router
  @dashboard_widgets_chat "/dashboard/widgets/chat"
  @dashboard_widgets "/dashboard/widgets"
  @widgets_chat_display "/widgets/chat/display"

  describe "widget configuration workflow" do
    setup do
      user = user_fixture_with_tier(:pro)
      %{user: user}
    end

    test "user can create and configure widget", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)

      {:ok, view, _html} = live(conn, @dashboard_widgets_chat)

      config_data = %{
        "max_messages" => "25",
        "show_badges" => "on"
      }

      view
      |> form("#widget-config-form", config_data)
      |> render_change()

      html = render(view)

      # Configuration should be reflected in the form
      assert html =~ "value=\"25\""
    end

    test "widget configuration broadcasts to display pages", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)

      with_live_subscription("widget_config:chat_widget:#{user.id}", fn ->
        {:ok, settings_view, _html} = live(conn, @dashboard_widgets_chat)

        config_data = %{
          "max_messages" => "30"
        }

        settings_view
        |> form("#widget-config-form", config_data)
        |> render_change()

        assert_receive %{config: config, type: :chat_widget}
        # Verify the updated values are reflected
        assert config.max_messages == 30
      end)
    end
  end

  describe "multi-widget workflows" do
    setup do
      user = user_fixture_with_tier(:pro)
      create_widget_config(user, :chat_widget, %{})
      create_widget_config(user, :donation_widget, %{})
      %{user: user}
    end

    test "user can manage multiple widget types", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)

      {:ok, view, _html} = live(conn, @dashboard_widgets)

      html = render(view)
      assert html =~ "Live Chat Overlay"
      assert html =~ "Alertbox Widget"
      assert html =~ "/dashboard/widgets/chat"
      assert html =~ "/dashboard/widgets/alertbox"
    end
  end

  describe "OBS integration workflow" do
    setup do
      user = user_fixture_with_tier(:pro)
      %{user: user}
    end

    test "generates correct OBS browser source URLs", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)

      {:ok, view, _html} = live(conn, @dashboard_widgets_chat)

      html = render(view)
      expected_url = "#{@widgets_chat_display}?user_id=#{user.id}"
      assert html =~ expected_url
    end
  end
end
