defmodule StreampaiWeb.Plugs.CsrfProtectionTest do
  use StreampaiWeb.ConnCase, async: true

  alias StreampaiWeb.Plugs.CsrfProtection

  @cookie_name "_streampai_csrf"
  @header_name "x-csrf-token"

  # Helper to prepare conn with cookies fetched
  defp prepare_conn(conn) do
    Plug.Conn.fetch_cookies(conn)
  end

  describe "ensure_csrf_token/1" do
    test "does not set CSRF token for unauthenticated requests", %{conn: conn} do
      conn =
        conn
        |> prepare_conn()
        |> Plug.Test.init_test_session(%{})
        |> CsrfProtection.call([])

      # No session data means no CSRF token should be set
      refute get_session(conn, :csrf_token)
      refute conn.resp_cookies[@cookie_name]
    end

    test "sets CSRF token when session has authentication data", %{conn: conn} do
      conn =
        conn
        |> prepare_conn()
        |> Plug.Test.init_test_session(%{__ash_authentication__: %{some: "data"}})
        |> CsrfProtection.call([])

      # CSRF token should be set in session and cookie
      assert token = get_session(conn, :csrf_token)
      assert cookie = conn.resp_cookies[@cookie_name]
      assert cookie.value == token
      assert cookie.http_only == false
      assert cookie.same_site == "Strict"
    end

    test "preserves existing CSRF token across requests", %{conn: conn} do
      existing_token = "existing_token_12345"

      conn =
        conn
        |> put_req_cookie(@cookie_name, existing_token)
        |> prepare_conn()
        |> Plug.Test.init_test_session(%{
          __ash_authentication__: %{some: "data"},
          csrf_token: existing_token
        })
        |> CsrfProtection.call([])

      # Token should remain the same
      assert get_session(conn, :csrf_token) == existing_token
    end
  end

  describe "maybe_validate_csrf/1 for POST requests" do
    test "allows POST without CSRF for unauthenticated users", %{conn: conn} do
      conn =
        conn
        |> prepare_conn()
        |> Plug.Test.init_test_session(%{})
        |> Map.put(:method, "POST")
        |> CsrfProtection.call([])

      # Request should pass through (not halted)
      refute conn.halted
    end

    test "blocks POST without CSRF header for authenticated users", %{conn: conn} do
      csrf_token = "valid_csrf_token_123"

      conn =
        conn
        |> prepare_conn()
        |> Plug.Test.init_test_session(%{
          __ash_authentication__: %{some: "data"},
          csrf_token: csrf_token
        })
        |> Map.put(:method, "POST")
        |> CsrfProtection.call([])

      # Request should be blocked (missing header)
      assert conn.halted
      assert conn.status == 403

      body = Jason.decode!(conn.resp_body)
      assert body["error"] == "CSRF validation failed"
    end

    test "blocks POST with invalid CSRF token for authenticated users", %{conn: conn} do
      csrf_token = "valid_csrf_token_123"

      conn =
        conn
        |> prepare_conn()
        |> Plug.Test.init_test_session(%{
          __ash_authentication__: %{some: "data"},
          csrf_token: csrf_token
        })
        |> Map.put(:method, "POST")
        |> put_req_header(@header_name, "wrong_token")
        |> CsrfProtection.call([])

      # Request should be blocked (invalid token)
      assert conn.halted
      assert conn.status == 403
    end

    test "allows POST with valid CSRF token for authenticated users", %{conn: conn} do
      csrf_token = "valid_csrf_token_123"

      conn =
        conn
        |> prepare_conn()
        |> Plug.Test.init_test_session(%{
          __ash_authentication__: %{some: "data"},
          csrf_token: csrf_token
        })
        |> Map.put(:method, "POST")
        |> put_req_header(@header_name, csrf_token)
        |> CsrfProtection.call([])

      # Request should pass through
      refute conn.halted
    end
  end

  describe "maybe_validate_csrf/1 for GET requests" do
    test "allows GET without CSRF header for authenticated users", %{conn: conn} do
      csrf_token = "valid_csrf_token_123"

      conn =
        conn
        |> prepare_conn()
        |> Plug.Test.init_test_session(%{
          __ash_authentication__: %{some: "data"},
          csrf_token: csrf_token
        })
        |> Map.put(:method, "GET")
        |> CsrfProtection.call([])

      # GET requests don't need CSRF validation
      refute conn.halted
    end
  end

  describe "maybe_validate_csrf/1 for PUT/PATCH/DELETE requests" do
    for method <- ~w(PUT PATCH DELETE) do
      test "blocks #{method} without CSRF header for authenticated users", %{conn: conn} do
        csrf_token = "valid_csrf_token_123"

        conn =
          conn
          |> prepare_conn()
          |> Plug.Test.init_test_session(%{
            __ash_authentication__: %{some: "data"},
            csrf_token: csrf_token
          })
          |> Map.put(:method, unquote(method))
          |> CsrfProtection.call([])

        assert conn.halted
        assert conn.status == 403
      end

      test "allows #{method} with valid CSRF token for authenticated users", %{conn: conn} do
        csrf_token = "valid_csrf_token_123"

        conn =
          conn
          |> prepare_conn()
          |> Plug.Test.init_test_session(%{
            __ash_authentication__: %{some: "data"},
            csrf_token: csrf_token
          })
          |> Map.put(:method, unquote(method))
          |> put_req_header(@header_name, csrf_token)
          |> CsrfProtection.call([])

        refute conn.halted
      end
    end
  end
end
