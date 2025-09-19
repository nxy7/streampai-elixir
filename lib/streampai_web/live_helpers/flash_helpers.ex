defmodule StreampaiWeb.LiveHelpers.FlashHelpers do
  @moduledoc """
  Reusable helpers for consistent flash message handling across LiveViews.

  Provides standardized flash message patterns, formatting, and error handling
  to ensure consistent user feedback throughout the application.
  """

  import Phoenix.LiveView, only: [put_flash: 3]

  alias Ash.Error.Invalid

  @doc """
  Shows a success flash message with consistent formatting.
  """
  def flash_success(socket, message) when is_binary(message) do
    put_flash(socket, :info, message)
  end

  @doc """
  Shows an error flash message with consistent formatting.
  """
  def flash_error(socket, message) when is_binary(message) do
    put_flash(socket, :error, message)
  end

  @doc """
  Shows an error flash from an Ash error with proper formatting.
  """
  def flash_ash_error(socket, error) do
    message = format_ash_error(error)
    put_flash(socket, :error, message)
  end

  @doc """
  Shows a warning flash message.
  """
  def flash_warning(socket, message) when is_binary(message) do
    put_flash(socket, :warning, message)
  end

  @doc """
  Shows a conditional flash message based on a result.
  """
  def flash_result(socket, {:ok, _}, success_message) do
    flash_success(socket, success_message)
  end

  def flash_result(socket, {:error, error}, _success_message) do
    flash_ash_error(socket, error)
  end

  @doc """
  Shows platform-specific connection success messages.
  """
  def flash_platform_connected(socket, platform) when is_binary(platform) do
    message = "Successfully connected #{String.capitalize(platform)} account"
    flash_success(socket, message)
  end

  @doc """
  Shows platform-specific connection error messages.
  """
  def flash_platform_error(socket, platform, error) when is_binary(platform) do
    base_message = "Failed to connect #{String.capitalize(platform)} account"
    full_message = format_platform_error(base_message, error)
    flash_error(socket, full_message)
  end

  @doc """
  Shows operation success with dynamic messaging.
  """
  def flash_operation_success(socket, operation, resource \\ nil) do
    message = format_operation_message(operation, resource, :success)
    flash_success(socket, message)
  end

  @doc """
  Shows operation error with dynamic messaging.
  """
  def flash_operation_error(socket, operation, error, resource \\ nil) do
    base_message = format_operation_message(operation, resource, :error)
    full_message = format_operation_error(base_message, error)
    flash_error(socket, full_message)
  end

  @doc """
  Shows authentication-related flash messages.
  """
  def flash_auth_required(socket) do
    flash_error(socket, "You must be logged in to access this feature")
  end

  def flash_auth_insufficient(socket) do
    flash_error(socket, "You don't have permission to access this feature")
  end

  @doc """
  Shows rate limiting flash message.
  """
  def flash_rate_limited(socket) do
    flash_error(socket, "Too many requests. Please try again later.")
  end

  @doc """
  Shows temporary maintenance message.
  """
  def flash_maintenance(socket, feature \\ "feature") do
    flash_warning(
      socket,
      "#{String.capitalize(feature)} is temporarily unavailable for maintenance"
    )
  end

  # Private helper functions

  defp format_ash_error(%Invalid{errors: errors}) do
    error_messages = Enum.map_join(errors, ", ", &format_individual_error/1)

    if String.length(error_messages) > 100 do
      "Multiple validation errors occurred. Please check your input and try again."
    else
      error_messages
    end
  end

  defp format_ash_error(%{message: message}) when is_binary(message) do
    message
  end

  defp format_ash_error(error) do
    require Logger

    Logger.error("Ash error occurred: #{inspect(error)}")
    "An error occurred. Please try again later."
  end

  defp format_individual_error(%{message: message}) when is_binary(message) do
    message
  end

  defp format_individual_error(%{field: field, message: message}) when is_binary(message) do
    "#{humanize_field(field)}: #{message}"
  end

  defp format_individual_error(error) do
    require Logger

    Logger.error("Individual error formatting fallback: #{inspect(error)}")
    "An error occurred. Please try again."
  end

  defp format_platform_error(base_message, %Invalid{} = error) do
    error_details = format_ash_error(error)
    "#{base_message}: #{error_details}"
  end

  defp format_platform_error(base_message, error) do
    require Logger

    Logger.error("Platform error: #{base_message} - #{inspect(error)}")
    "#{base_message}. Please try again later."
  end

  defp format_operation_message(operation, resource, result_type) do
    resource_name = humanize_resource(resource)

    case {operation, result_type} do
      {op, :success}
      when op in [:create, :update, :delete, :save, :connect, :disconnect, :start, :stop] ->
        "#{resource_name} #{past_tense(op)} successfully"

      {_op, :success} ->
        "Operation completed successfully"

      {op, :error}
      when op in [:create, :update, :delete, :save, :connect, :disconnect, :start, :stop] ->
        "Failed to #{op} #{resource_name}"

      {_op, :error} ->
        "Operation failed"
    end
  end

  defp past_tense(:create), do: "created"
  defp past_tense(:update), do: "updated"
  defp past_tense(:delete), do: "deleted"
  defp past_tense(:save), do: "saved"
  defp past_tense(:connect), do: "connected"
  defp past_tense(:disconnect), do: "disconnected"
  defp past_tense(:start), do: "started"
  defp past_tense(:stop), do: "stopped"

  defp format_operation_error(base_message, error) do
    error_details = format_ash_error(error)
    "#{base_message}: #{error_details}"
  end

  defp humanize_field(field) when is_atom(field) do
    field
    |> Atom.to_string()
    |> String.replace("_", " ")
    |> String.capitalize()
  end

  defp humanize_field(field), do: to_string(field)

  defp humanize_resource(nil), do: "item"

  defp humanize_resource(resource) when is_atom(resource) do
    resource
    |> Atom.to_string()
    |> String.replace("_", " ")
  end

  defp humanize_resource(resource), do: to_string(resource)
end
