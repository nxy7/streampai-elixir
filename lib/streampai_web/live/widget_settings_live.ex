defmodule StreampaiWeb.WidgetSettingsLive do
  @moduledoc """
  Shared behavior for widget settings LiveViews.
  Provides common patterns for widget configuration, PubSub, and OBS browser source URL generation.
  """

  import StreampaiWeb.LiveHelpers.FlashHelpers

  alias Streampai.Accounts.WidgetConfig
  alias StreampaiWeb.Utils.ValidationUtils

  defmacro __using__(opts) do
    widget_type = Keyword.fetch!(opts, :widget_type)
    fake_data_module = Keyword.fetch!(opts, :fake_data_module)

    quote do
      use StreampaiWeb, :live_view

      import StreampaiWeb.Components.DashboardLayout

      alias unquote(fake_data_module)

      @widget_type unquote(widget_type)
      @fake_data_module unquote(fake_data_module)

      # Common mount pattern for widget settings
      def mount(_params, _session, socket) do
        current_user = socket.assigns.current_user

        if connected?(socket) do
          schedule_initial_data_generation()
        end

        # Load widget configuration
        {:ok, %{config: initial_config}} =
          WidgetConfig.get_by_user_and_type(%{
            user_id: current_user.id,
            type: @widget_type
          })

        widget_title = "#{String.capitalize(Atom.to_string(@widget_type))} Settings"

        socket =
          socket
          |> assign(:widget_config, initial_config)
          |> assign(:page_title, widget_title)
          |> setup_initial_data()

        {:ok, socket, layout: false}
      end

      # Common event handlers
      def handle_event("toggle_setting", %{"field" => field} = params, socket) do
        StreampaiWeb.WidgetSettingsLive.handle_toggle_setting(socket, field, @widget_type)
      end

      def handle_event("update_setting", %{"field" => field, "value" => value}, socket) do
        StreampaiWeb.WidgetSettingsLive.handle_update_setting(socket, field, value, @widget_type)
      end

      def render(assigns) do
        ~H"""
        <.dashboard_layout
          {assigns}
          current_page="widgets"
          page_title={"#{String.capitalize(Atom.to_string(@widget_type))} Settings"}
        >
          <div class="max-w-6xl mx-auto space-y-6">
            {render_widget_settings(assigns)}
          </div>
        </.dashboard_layout>
        """
      end

      # Override points for specific widgets
      defp schedule_initial_data_generation, do: :ok
      defp setup_initial_data(socket), do: socket

      # This must be implemented by each widget
      defp render_widget_settings(assigns)

      defoverridable schedule_initial_data_generation: 0,
                     setup_initial_data: 1,
                     render_widget_settings: 1
    end
  end

  # Import LiveView functions for the module functions

  # Shared event handling logic
  def handle_toggle_setting(socket, field, widget_type) do
    current_config = socket.assigns.widget_config
    current_value = Map.get(current_config, String.to_existing_atom(field))
    new_value = not current_value

    handle_config_update(socket, field, new_value, widget_type)
  end

  def handle_update_setting(socket, field, value, widget_type) do
    # Parse value based on field type
    parsed_value = parse_setting_value(field, value)
    handle_config_update(socket, field, parsed_value, widget_type)
  end

  # Common config update logic
  defp handle_config_update(socket, field, value, widget_type) do
    current_config = socket.assigns.widget_config
    updated_config = Map.put(current_config, String.to_existing_atom(field), value)
    current_user = socket.assigns.current_user

    case WidgetConfig.create(
           %{
             user_id: current_user.id,
             type: widget_type,
             config: updated_config
           },
           actor: current_user
         ) do
      {:ok, _widget_config} ->
        # Broadcast config update to OBS widget
        Phoenix.PubSub.broadcast(
          Streampai.PubSub,
          "widget_config:#{widget_type}:#{current_user.id}",
          {:config_updated, updated_config}
        )

        {:noreply, Phoenix.Component.assign(socket, :widget_config, updated_config)}

      {:error, _error} ->
        {:noreply, flash_error(socket, "Failed to save #{String.replace(field, "_", " ")} setting")}
    end
  end

  # Parse setting values based on field type
  defp parse_setting_value(field, value), do: ValidationUtils.parse_setting_value(field, value)

  # Helper to generate OBS browser source URL
  def obs_browser_source_url(user_id, widget_type) do
    base_url = StreampaiWeb.Endpoint.url()
    "#{base_url}/widgets/#{widget_type}/display?user_id=#{user_id}"
  end
end
