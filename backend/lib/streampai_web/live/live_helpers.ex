defmodule StreampaiWeb.LiveHelpers do
  @moduledoc """
  Common helpers and patterns for LiveView modules.

  This module provides consistent patterns for:
  - Error handling
  - Flash message management  
  - Socket state management
  - Common LiveView operations
  """

  import Phoenix.LiveView
  import Phoenix.Component, only: [assign: 3]

  @doc """
  Handles errors consistently across LiveViews with user-friendly messages.

  ## Examples

      {:error, :not_found} -> handle_error(socket, :not_found, "Resource not found")
      {:error, changeset} -> handle_error(socket, changeset)
  """
  def handle_error(socket, error_type, custom_message \\ nil)

  def handle_error(socket, :not_found, custom_message) do
    message = custom_message || "The requested resource was not found."
    put_flash(socket, :error, message)
  end

  def handle_error(socket, :unauthorized, custom_message) do
    message = custom_message || "You don't have permission to perform this action."
    put_flash(socket, :error, message)
  end

  def handle_error(socket, :timeout, custom_message) do
    message = custom_message || "The request timed out. Please try again."
    put_flash(socket, :error, message)
  end

  def handle_error(socket, %Ecto.Changeset{} = changeset, custom_message) do
    message = custom_message || format_changeset_errors(changeset)
    put_flash(socket, :error, message)
  end

  def handle_error(socket, error, custom_message) when is_binary(error) do
    message = custom_message || error
    put_flash(socket, :error, message)
  end

  def handle_error(socket, _error, custom_message) do
    message = custom_message || "Something went wrong. Please try again."
    put_flash(socket, :error, message)
  end

  @doc """
  Shows a success message with consistent styling.
  """
  def show_success(socket, message) do
    put_flash(socket, :info, message)
  end

  @doc """
  Shows a warning message with consistent styling.
  """
  def show_warning(socket, message) do
    put_flash(socket, :warning, message)
  end

  @doc """
  Safely loads data with error handling.

  ## Examples

      safe_load(socket, fn -> Dashboard.get_dashboard_data(user) end, :dashboard_data)
  """
  def safe_load(socket, load_fn, assign_key, error_message \\ nil) do
    case load_fn.() do
      {:ok, data} ->
        assign(socket, assign_key, data)

      {:error, reason} ->
        handle_error(socket, reason, error_message)
        |> assign(assign_key, nil)

      data when not is_tuple(data) ->
        assign(socket, assign_key, data)
    end
  rescue
    exception ->
      error_msg = error_message || "Failed to load data: #{Exception.message(exception)}"

      socket
      |> handle_error(error_msg)
      |> assign(assign_key, nil)
  end

  @doc """
  Handles form submissions with consistent error handling.

  ## Examples

      handle_form_submit(socket, fn -> create_user(params) end, "User created successfully!")
  """
  def handle_form_submit(
        socket,
        submit_fn,
        success_message \\ "Operation completed successfully!"
      ) do
    case submit_fn.() do
      {:ok, _result} ->
        socket
        |> show_success(success_message)
        |> then(fn s -> {:noreply, s} end)

      {:error, %Ecto.Changeset{} = changeset} ->
        socket
        |> handle_error(changeset)
        |> assign(:changeset, changeset)
        |> then(fn s -> {:noreply, s} end)

      {:error, reason} ->
        socket
        |> handle_error(reason)
        |> then(fn s -> {:noreply, s} end)
    end
  rescue
    exception ->
      socket
      |> handle_error("Operation failed: #{Exception.message(exception)}")
      |> then(fn s -> {:noreply, s} end)
  end

  @doc """
  Validates required assigns are present in socket.

  ## Examples

      validate_assigns(socket, [:current_user, :dashboard_data])
  """
  def validate_assigns(socket, required_assigns) do
    missing =
      required_assigns
      |> Enum.reject(&Map.has_key?(socket.assigns, &1))

    case missing do
      [] ->
        {:ok, socket}

      missing_assigns ->
        error_msg = "Missing required data: #{Enum.join(missing_assigns, ", ")}"
        {:error, handle_error(socket, error_msg)}
    end
  end

  @doc """
  Standardized mount pattern for dashboard pages.
  """
  def mount_dashboard_page(socket, load_data_fn) do
    with {:ok, socket} <- validate_assigns(socket, [:current_user]),
         socket <- safe_load(socket, load_data_fn, :page_data) do
      {:ok, socket, layout: false}
    else
      {:error, socket} ->
        {:ok, socket, layout: false}
    end
  end

  # Private helpers

  defp format_changeset_errors(%Ecto.Changeset{errors: errors}) do
    errors
    |> Enum.map_join(", ", fn {field, {message, _}} -> "#{field}: #{message}" end)
    |> case do
      "" -> "Invalid data provided"
      formatted -> formatted
    end
  end
end
