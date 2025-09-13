defmodule StreampaiWeb.Integration.WidgetSystemIntegrationTest do
  @moduledoc """
  Integration tests for the widget system functionality.

  Tests widget configuration, real-time updates, and OBS integration workflows.
  """
  use StreampaiWeb.ConnCase, async: false
  use Mneme

  import Phoenix.LiveViewTest
  import Streampai.TestHelpers

  describe "widget configuration workflow" do
    setup do
      user = user_fixture_with_tier(:pro)
      %{user: user}
    end

    test "user can create and configure widget", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)

      {:ok, view, _html} = live(conn, ~p"/widgets/chat")

      config_data = %{
        "config" => %{
          "max_messages" => "25",
          "show_badges" => "true",
          "animation_type" => "slide"
        }
      }

      view
      |> form("#widget-config-form", config_data)
      |> render_submit()

      html = render(view)
      assert html =~ "Configuration saved"

      user = Ash.reload!(user)
      widget_configs = Ash.load!(user, :widget_configs).widget_configs

      auto_assert [%{type: :chat_widget}] <- widget_configs
    end

    test "widget configuration broadcasts to display pages", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)

      with_live_subscription("widget_config:chat_widget:#{user.id}", fn ->
        {:ok, settings_view, _html} = live(conn, ~p"/widgets/chat")

        config_data = %{
          "config" => %{
            "max_messages" => "30",
            "show_badges" => "false"
          }
        }

        settings_view
        |> form("#widget-config-form", config_data)
        |> render_submit()

        assert_receive %Phoenix.Socket.Broadcast{
          topic: "widget_config:chat_widget:" <> _,
          event: "config_updated",
          payload: payload
        }

        auto_assert %{config: %{max_messages: 30, show_badges: false}} <- payload
      end)
    end
  end

  describe "widget display integration" do
    setup do
      user = user_fixture_with_tier(:pro)
      create_widget_config(user, :chat_widget, %{max_messages: 20})
      %{user: user}
    end

    test "widget display page loads configuration", %{conn: conn, user: user} do
      {:ok, view, _html} = live(conn, ~p"/widgets/chat/display?user_id=#{user.id}")

      html = render(view)
      assert html =~ "data-max-messages=\"20\""
    end

    test "widget responds to real-time configuration updates", %{conn: conn, user: user} do
      {:ok, view, _html} = live(conn, ~p"/widgets/chat/display?user_id=#{user.id}")

      Phoenix.PubSub.broadcast(
        Streampai.PubSub,
        "widget_config:chat_widget:#{user.id}",
        {:config_updated, %{config: %{max_messages: 50, show_badges: true}}}
      )

      html = render(view)
      assert html =~ "data-max-messages=\"50\""
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

      {:ok, view, _html} = live(conn, ~p"/dashboard/widgets")

      html = render(view)
      assert html =~ "Chat Widget"
      assert html =~ "Donation Widget"
      assert html =~ "/widgets/chat/display"
      assert html =~ "/widgets/donation/display"
    end
  end

  describe "OBS integration workflow" do
    setup do
      user = user_fixture_with_tier(:pro)
      %{user: user}
    end

    test "generates correct OBS browser source URLs", %{conn: conn, user: user} do
      conn = log_in_user(conn, user)

      {:ok, view, _html} = live(conn, ~p"/widgets/chat")

      html = render(view)
      expected_url = url(~p"/widgets/chat/display?user_id=#{user.id}")
      assert html =~ expected_url
    end

    test "widget display works in headless mode for OBS", %{conn: conn, user: user} do
      create_widget_config(user, :chat_widget, %{})

      conn = get(conn, ~p"/widgets/chat/display?user_id=#{user.id}")

      auto_assert %{status: 200} <- conn
      html = html_response(conn, 200)

      assert html =~ "transparent"
      refute html =~ "streampai-sidebar"
      refute html =~ "dashboard-header"
    end
  end
end
