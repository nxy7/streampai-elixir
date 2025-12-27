defmodule StreampaiWeb.LiveHelpers.FlashHelpers do
  @moduledoc """
  Helpers for setting flash messages in LiveView sockets.
  """

  import Phoenix.LiveView, only: [put_flash: 3]

  @doc """
  Sets a success flash message.
  """
  def flash_success(socket, message) do
    put_flash(socket, :info, message)
  end

  @doc """
  Sets an error flash message.
  """
  def flash_error(socket, message) do
    put_flash(socket, :error, message)
  end

  @doc """
  Sets a warning flash message.
  """
  def flash_warning(socket, message) do
    put_flash(socket, :warning, message)
  end

  @doc """
  Sets flash based on operation result.
  """
  def flash_result(socket, {:ok, _}, success_message) do
    flash_success(socket, success_message)
  end

  def flash_result(socket, {:error, %Ash.Error.Invalid{errors: errors}}, _success_message) do
    error_message = errors |> List.first() |> Map.get(:message, "An error occurred")
    flash_error(socket, error_message)
  end

  def flash_result(socket, {:error, error}, _success_message) when is_binary(error) do
    flash_error(socket, error)
  end

  def flash_result(socket, {:error, _error}, _success_message) do
    flash_error(socket, "An error occurred")
  end

  @doc """
  Sets flash for successful platform connection.
  """
  def flash_platform_connected(socket, platform) do
    platform_name = String.capitalize(platform)
    flash_success(socket, "Successfully connected #{platform_name} account")
  end

  @doc """
  Sets flash for platform connection error.
  """
  def flash_platform_error(socket, platform, error) do
    require Logger
    platform_name = String.capitalize(platform)
    message = "Failed to connect #{platform_name} account"
    Logger.error("Platform error: #{message} - #{inspect(error)}")
    flash_error(socket, message)
  end

  @doc """
  Sets flash for successful operation.
  """
  def flash_operation_success(socket, operation, item_name \\ "item") do
    operation_name = to_string(operation)
    flash_success(socket, "#{item_name} #{operation_name}d successfully")
  end

  @doc """
  Sets flash for failed operation.
  """
  def flash_operation_error(socket, operation, error, item_name \\ "item") do
    operation_name = to_string(operation)
    message = "Failed to #{operation_name} #{item_name}"

    error_detail = case error do
      %{message: msg} -> msg
      msg when is_binary(msg) -> msg
      _ -> "Unknown error"
    end

    flash_error(socket, "#{message}: #{error_detail}")
  end

  @doc """
  Sets flash for authentication requirement.
  """
  def flash_auth_required(socket) do
    flash_error(socket, "You must be logged in to access this feature")
  end

  @doc """
  Sets flash for insufficient permissions.
  """
  def flash_auth_insufficient(socket) do
    flash_error(socket, "You don't have permission to access this feature")
  end

  @doc """
  Sets flash for rate limiting.
  """
  def flash_rate_limited(socket) do
    flash_error(socket, "Too many requests. Please try again later.")
  end

  @doc """
  Sets flash for maintenance mode.
  """
  def flash_maintenance(socket, feature \\ nil) do
    message = if feature do
      "#{String.capitalize(feature)} is temporarily unavailable for maintenance"
    else
      "Feature is temporarily unavailable for maintenance"
    end

    flash_warning(socket, message)
  end
end
