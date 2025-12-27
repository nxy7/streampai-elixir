defmodule StreampaiWeb.PageControllerTest do
  use StreampaiWeb.ConnCase, async: true

  test "GET /api/home", %{conn: conn} do
    conn = get(conn, ~p"/api/home")
    assert html_response(conn, 200) =~ "Peace of mind from prototype to production"
  end
end
