defmodule StreampaiWeb.Components.DashboardLayoutTest do
  use StreampaiWeb.ConnCase
  use Mneme
  import Phoenix.LiveViewTest
  import StreampaiWeb.Components.DashboardLayout

  describe "dashboard_layout/1" do
    test "renders basic dashboard layout" do
      assigns = %{
        current_user: %{id: "123", email: "test@example.com"},
        current_page: "dashboard",
        page_title: "Test Dashboard",
        inner_block: []
      }

      html = render_component(&dashboard_layout/1, assigns)

      auto_assert(^html <- html)
    end

    test "renders dashboard layout with action button" do
      assigns = %{
        current_user: %{id: "123", email: "test@example.com"},
        current_page: "stream",
        page_title: "Stream Management",
        show_action_button: true,
        action_button_text: "New Stream",
        action_button_class: "custom-class",
        inner_block: []
      }

      html = render_component(&dashboard_layout/1, assigns)

      auto_assert(^html <- html)
    end

    test "renders dashboard layout with impersonation notification" do
      assigns = %{
        current_user: %{id: "456", email: "user@example.com"},
        impersonator: %{id: "123", email: "lolnoxy@gmail.com"},
        current_page: "users",
        page_title: "User Management",
        inner_block: []
      }

      html = render_component(&dashboard_layout/1, assigns)

      auto_assert(^html <- html)
    end

    test "renders admin-only users menu for admin user" do
      assigns = %{
        current_user: %{id: "123", email: "lolnoxy@gmail.com"},
        current_page: "users",
        page_title: "User Management",
        inner_block: []
      }

      html = render_component(&dashboard_layout/1, assigns)

      # Should include the Users menu item
      assert html =~ "User Management"
      assert html =~ "/dashboard/admin/users"

      auto_assert(^html <- html)
    end

    test "does not render users menu for regular user" do
      assigns = %{
        current_user: %{id: "456", email: "regular@example.com"},
        current_page: "dashboard",
        page_title: "Dashboard",
        inner_block: []
      }

      html = render_component(&dashboard_layout/1, assigns)

      # Should not include the Users menu item
      refute html =~ "/dashboard/admin/users"

      auto_assert(^html <- html)
    end
  end
end
