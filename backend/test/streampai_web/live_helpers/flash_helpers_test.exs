defmodule StreampaiWeb.LiveHelpers.FlashHelpersTest do
  use ExUnit.Case, async: true

  alias StreampaiWeb.LiveHelpers.FlashHelpers

  @moduletag :skip

  describe "basic flash messages" do
    test "flash_success/2 sets info flash" do
      socket = MockSocket.new()
      result = FlashHelpers.flash_success(socket, "Success message")
      assert result.flash.info == "Success message"
    end

    test "flash_error/2 sets error flash" do
      socket = MockSocket.new()
      result = FlashHelpers.flash_error(socket, "Error message")
      assert result.flash.error == "Error message"
    end

    test "flash_warning/2 sets warning flash" do
      socket = MockSocket.new()
      result = FlashHelpers.flash_warning(socket, "Warning message")
      assert result.flash.warning == "Warning message"
    end
  end

  describe "result-based flash messages" do
    test "flash_result/3 with success" do
      socket = MockSocket.new()
      result = FlashHelpers.flash_result(socket, {:ok, %{}}, "Operation successful")
      assert result.flash.info == "Operation successful"
    end

    test "flash_result/3 with Ash error" do
      socket = MockSocket.new()
      ash_error = %Ash.Error.Invalid{errors: [%{message: "Validation failed"}]}
      result = FlashHelpers.flash_result(socket, {:error, ash_error}, "Success message")
      assert result.flash.error == "Validation failed"
    end
  end

  describe "platform flash messages" do
    test "flash_platform_connected/2" do
      socket = MockSocket.new()
      result = FlashHelpers.flash_platform_connected(socket, "twitch")
      assert result.flash.info == "Successfully connected Twitch account"
    end

    test "flash_platform_error/3" do
      socket = MockSocket.new()
      error = %{message: "Invalid credentials"}
      result = FlashHelpers.flash_platform_error(socket, "youtube", error)
      assert String.contains?(result.flash.error, "Failed to connect Youtube account")
    end
  end

  describe "operation flash messages" do
    test "flash_operation_success/3 with different operations" do
      socket = MockSocket.new()

      result = FlashHelpers.flash_operation_success(socket, :create, "user")
      assert result.flash.info == "User created successfully"

      result = FlashHelpers.flash_operation_success(socket, :update, "stream")
      assert result.flash.info == "Stream updated successfully"

      result = FlashHelpers.flash_operation_success(socket, :delete)
      assert result.flash.info == "Item deleted successfully"
    end

    test "flash_operation_error/4" do
      socket = MockSocket.new()
      error = %{message: "Database error"}
      result = FlashHelpers.flash_operation_error(socket, :create, error, "user")
      assert String.contains?(result.flash.error, "Failed to create user")
    end
  end

  describe "authentication flash messages" do
    test "flash_auth_required/1" do
      socket = MockSocket.new()
      result = FlashHelpers.flash_auth_required(socket)
      assert result.flash.error == "You must be logged in to access this feature"
    end

    test "flash_auth_insufficient/1" do
      socket = MockSocket.new()
      result = FlashHelpers.flash_auth_insufficient(socket)
      assert result.flash.error == "You don't have permission to access this feature"
    end

    test "flash_rate_limited/1" do
      socket = MockSocket.new()
      result = FlashHelpers.flash_rate_limited(socket)
      assert result.flash.error == "Too many requests. Please try again later."
    end
  end

  describe "maintenance flash messages" do
    test "flash_maintenance/2 with default feature" do
      socket = MockSocket.new()
      result = FlashHelpers.flash_maintenance(socket)
      assert result.flash.warning == "Feature is temporarily unavailable for maintenance"
    end

    test "flash_maintenance/2 with specific feature" do
      socket = MockSocket.new()
      result = FlashHelpers.flash_maintenance(socket, "streaming")
      assert result.flash.warning == "Streaming is temporarily unavailable for maintenance"
    end
  end
end
