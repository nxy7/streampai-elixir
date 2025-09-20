defmodule StreampaiWeb.LiveHelpers do
  @moduledoc """
  Common helpers and patterns for LiveView modules.

  This module provides consistent patterns for:
  - Error handling
  - Flash message management
  - Socket state management
  - Common LiveView operations
  """

  import Phoenix.Component, only: [assign: 3]
  import Phoenix.LiveView

  alias Streampai.Accounts.StreamingAccount
  alias Streampai.Accounts.User
  alias StreampaiWeb.Utils.FormatHelpers

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
        socket
        |> handle_error(reason, error_message)
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
  def handle_form_submit(socket, submit_fn, success_message \\ "Operation completed successfully!") do
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
    missing = Enum.reject(required_assigns, &Map.has_key?(socket.assigns, &1))

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
    case validate_assigns(socket, [:current_user]) do
      {:ok, socket} ->
        socket = safe_load(socket, load_data_fn, :page_data)
        {:ok, socket, layout: false}

      {:error, socket} ->
        {:ok, socket, layout: false}
    end
  end

  @doc """
  Standardized mount pattern for dashboard pages.
  """
  def reload_current_user(socket) do
    previous_current_user = socket.assigns.current_user

    assign(
      socket,
      :current_user,
      User.get_by_id!(%{id: previous_current_user.id}, actor: previous_current_user)
    )
  end

  @doc """
  Handles platform disconnection with consistent patterns.
  """
  def handle_platform_disconnect(socket, platform) do
    current_user = socket.assigns.current_user

    case StreamingAccount.destroy(
           %{user_id: current_user.id, platform: platform},
           actor: current_user
         ) do
      :ok ->
        # Refresh platform connections and usage data
        platform_connections = Streampai.Dashboard.get_platform_connections(current_user)
        user_data = Streampai.Dashboard.get_dashboard_data(current_user)

        {:noreply,
         socket
         |> reload_current_user()
         |> assign(:platform_connections, platform_connections)
         |> assign(:usage, user_data.usage)
         |> show_success("Successfully disconnected #{String.capitalize(platform)} account")}

      {:error, reason} ->
        {:noreply, handle_error(socket, reason, "Failed to disconnect account")}
    end
  end

  @doc """
  Handles toggle form submissions (checkboxes).
  Extracts the common pattern from settings forms.
  """
  def handle_toggle_form(socket, params, field_map, update_fn) do
    updated_values =
      Map.new(field_map, fn {field, key} ->
        {key, Map.get(params, field) == "on"}
      end)

    update_fn.(socket, updated_values)
  end

  @doc """
  Common pattern for config updates with PubSub broadcasting.
  """
  def broadcast_and_save_config(user_id, config_type, config_data, topic_suffix \\ nil) do
    topic =
      if topic_suffix do
        "widget_config:#{config_type}:#{user_id}"
      else
        "widget_config:#{user_id}"
      end

    Phoenix.PubSub.broadcast(
      Streampai.PubSub,
      topic,
      %{config: config_data}
    )
  end

  # Private helpers

  defp format_changeset_errors(changeset), do: FormatHelpers.format_changeset_errors(changeset)
end
