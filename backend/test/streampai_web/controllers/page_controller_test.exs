defmodule StreampaiWeb.PageControllerTest do
  use StreampaiWeb.ConnCase

  test "GET /", %{conn: conn} do
    conn = get(conn, ~p"/")
    assert html_response(conn, 200) =~ "Multi-Platform Streaming Solution"
  end
end
