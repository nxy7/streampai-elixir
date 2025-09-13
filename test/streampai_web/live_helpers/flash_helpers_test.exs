defmodule StreampaiWeb.LiveHelpers.FlashHelpersTest do
  use StreampaiWeb.ConnCase, async: true

  alias StreampaiWeb.LiveHelpers.FlashHelpers

  # Helper to create a properly initialized socket for testing
  defp test_socket do
    %Phoenix.LiveView.Socket{
      assigns: %{flash: %{}, __changed__: %{}},
      private: %{flash: %{}, live_temp: %{}}
    }
  end

  describe "basic flash messages" do
    test "flash_success/2 sets info flash" do
      socket = test_socket()
      result = FlashHelpers.flash_success(socket, "Success message")
      assert result.assigns.flash["info"] == "Success message"
    end

    test "flash_error/2 sets error flash" do
      socket = test_socket()
      result = FlashHelpers.flash_error(socket, "Error message")
      assert result.assigns.flash["error"] == "Error message"
    end

    test "flash_warning/2 sets warning flash" do
      socket = test_socket()
      result = FlashHelpers.flash_warning(socket, "Warning message")
      assert result.assigns.flash["warning"] == "Warning message"
    end
  end

  describe "result-based flash messages" do
    test "flash_result/3 with success" do
      socket = test_socket()
      result = FlashHelpers.flash_result(socket, {:ok, %{}}, "Operation successful")
      assert result.assigns.flash["info"] == "Operation successful"
    end

    test "flash_result/3 with Ash error" do
      socket = test_socket()
      ash_error = %Ash.Error.Invalid{errors: [%{message: "Validation failed"}]}
      result = FlashHelpers.flash_result(socket, {:error, ash_error}, "Success message")
      assert result.assigns.flash["error"] == "Validation failed"
    end
  end

  describe "platform flash messages" do
    test "flash_platform_connected/2" do
      socket = test_socket()
      result = FlashHelpers.flash_platform_connected(socket, "twitch")
      assert result.assigns.flash["info"] == "Successfully connected Twitch account"
    end

    test "flash_platform_error/3" do
      socket = test_socket()
      error = %{message: "Invalid credentials"}
      result = FlashHelpers.flash_platform_error(socket, "youtube", error)
      assert String.contains?(result.assigns.flash["error"], "Failed to connect Youtube account")
    end
  end

  describe "operation flash messages" do
    test "flash_operation_success/3 with different operations" do
      socket = test_socket()

      result = FlashHelpers.flash_operation_success(socket, :create, "user")
      assert result.assigns.flash["info"] == "user created successfully"

      result = FlashHelpers.flash_operation_success(socket, :update, "stream")
      assert result.assigns.flash["info"] == "stream updated successfully"

      result = FlashHelpers.flash_operation_success(socket, :delete)
      assert result.assigns.flash["info"] == "item deleted successfully"
    end

    test "flash_operation_error/4" do
      socket = test_socket()
      error = %{message: "Database error"}
      result = FlashHelpers.flash_operation_error(socket, :create, error, "user")
      assert String.contains?(result.assigns.flash["error"], "Failed to create user")
    end
  end

  describe "authentication flash messages" do
    test "flash_auth_required/1" do
      socket = test_socket()
      result = FlashHelpers.flash_auth_required(socket)
      assert result.assigns.flash["error"] == "You must be logged in to access this feature"
    end

    test "flash_auth_insufficient/1" do
      socket = test_socket()
      result = FlashHelpers.flash_auth_insufficient(socket)
      assert result.assigns.flash["error"] == "You don't have permission to access this feature"
    end

    test "flash_rate_limited/1" do
      socket = test_socket()
      result = FlashHelpers.flash_rate_limited(socket)
      assert result.assigns.flash["error"] == "Too many requests. Please try again later."
    end
  end

  describe "maintenance flash messages" do
    test "flash_maintenance/2 with default feature" do
      socket = test_socket()
      result = FlashHelpers.flash_maintenance(socket)

      assert result.assigns.flash["warning"] ==
               "Feature is temporarily unavailable for maintenance"
    end

    test "flash_maintenance/2 with specific feature" do
      socket = test_socket()
      result = FlashHelpers.flash_maintenance(socket, "streaming")

      assert result.assigns.flash["warning"] ==
               "Streaming is temporarily unavailable for maintenance"
    end
  end
end
