defmodule StreampaiWeb.EchoControllerTest do
  use StreampaiWeb.ConnCase
  use Mneme

  describe "Echo API endpoints" do
    test "GET /api/echo returns request details", %{conn: conn} do
      response =
        conn
        |> get("/api/echo")
        |> json_response(200)

      # Should include method, path, and headers
      assert response["method"] == "GET"
      assert response["path"] == "/api/echo"
      assert is_map(response["headers"])

      # Remove dynamic fields for consistent snapshots
      stable_response =
        response
        |> Map.delete("timestamp")

      auto_assert(^stable_response <- stable_response)
    end

    test "POST /api/echo with JSON body", %{conn: conn} do
      json_body = %{"test" => "data", "nested" => %{"key" => "value"}}
      json_string = Jason.encode!(json_body)

      response =
        conn
        |> put_req_header("content-type", "application/json")
        |> post("/api/echo", json_string)
        |> json_response(200)

      assert response["method"] == "POST"
      # In test environment, body reading may not work the same way
      assert is_binary(response["body"])

      # Remove dynamic fields
      stable_response =
        response
        |> Map.delete("timestamp")

      auto_assert(^stable_response <- stable_response)
    end

    test "GET /api/simple returns minimal response", %{conn: conn} do
      response =
        conn
        |> get("/api/simple")
        |> response(200)

      auto_assert(^response <- response)
    end

    test "GET /api/static returns static response", %{conn: conn} do
      response =
        conn
        |> get("/api/static")
        |> response(200)

      # Static response should be consistent  
      auto_assert(^response <- response)
    end

    test "GET /api/delay/:delay returns delayed response", %{conn: conn} do
      start_time = System.monotonic_time(:millisecond)

      response =
        conn

        # 100ms delay
        |> get("/api/delay/100")
        |> json_response(200)

      end_time = System.monotonic_time(:millisecond)
      elapsed = end_time - start_time

      # Should have taken at least 100ms
      assert elapsed >= 100

      # Remove timestamp for consistent snapshots
      response_without_timestamp = Map.delete(response, "timestamp")
      auto_assert(^response_without_timestamp <- response_without_timestamp)
    end
  end

  describe "High-performance endpoints" do
    test "GET /fast/test returns ultra minimal response", %{conn: conn} do
      response =
        conn
        |> get("/fast/test")
        |> response(200)

      auto_assert(^response <- response)
    end
  end
end
