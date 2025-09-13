defmodule StreampaiWeb.ViewerCountWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring viewer count widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :viewer_count_widget,
    fake_module: Streampai.Fake.ViewerCount

  alias StreampaiWeb.Utils.WidgetHelpers

  # Widget-specific implementations

  defp widget_title, do: "Viewer Count Widget"

  defp initialize_widget_specific_assigns(socket) do
    # Generate initial viewer data for preview
    initial_data = @fake_module.generate_viewer_data()
    assign(socket, :current_data, initial_data)
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [:show_total, :show_platforms, :animation_enabled]

    WidgetHelpers.update_unified_settings(config, params,
      boolean_fields: boolean_fields,
      converter: &convert_setting_value/2
    )
  end

  defp generate_and_assign_demo_data(socket) do
    # Generate update based on current data for realistic changes
    current_data = socket.assigns[:current_data]

    new_data =
      if current_data do
        @fake_module.generate_viewer_update(current_data)
      else
        @fake_module.generate_viewer_data()
      end

    assign(socket, :current_data, new_data)
  end

  defp schedule_demo_event, do: Process.send_after(self(), :generate_demo_event, 3000)

  # Handle presence updates (inherited from BaseLive)
  def handle_info(%Phoenix.Socket.Broadcast{topic: "users_presence", event: "presence_diff"}, socket) do
    {:noreply, socket}
  end

  # Let WidgetBehaviour handle other messages
  def handle_info(msg, socket) do
    super(msg, socket)
  end

  defp convert_setting_value(setting, value) do
    case setting do
      :update_interval ->
        WidgetHelpers.parse_numeric_setting(value, min: 1, max: 30)

      :display_style ->
        WidgetHelpers.validate_config_value(
          :display_style,
          value,
          ["minimal", "detailed", "cards"],
          "detailed"
        )

      :font_size ->
        WidgetHelpers.validate_config_value(
          :font_size,
          value,
          ["small", "medium", "large"],
          "medium"
        )

      _ ->
        value
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Viewer Count Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <StreampaiWeb.WidgetSettingsComponents.widget_preview_header
            title="Viewer Count Widget"
            current_user={@current_user}
            socket={@socket}
            widget_type={:viewer_count_widget}
            url_path={~p"/widgets/viewer-count/display"}
            dimensions="800x200"
            copy_button_id="copy-viewer-count-url-button"
          />
          
    <!-- Viewer Count Widget Display -->
          <div class="max-w-2xl mx-auto bg-gray-900 border border-gray-200 rounded p-4 h-64 overflow-hidden relative">
            <div class="text-xs text-gray-400 mb-2">
              Preview (actual widget has transparent background)
            </div>
            <.vue
              v-component="ViewerCountWidget"
              v-socket={@socket}
              config={@widget_config}
              data={@current_data}
              class="w-full h-full"
              id="preview-viewer-count-widget"
            />
          </div>
        </div>
        
    <!-- Configuration Options -->
        <StreampaiWeb.WidgetSettingsComponents.settings_container widget_config={@widget_config}>
          <!-- Display Options -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Display Options">
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_total"
              label="Show total viewer count"
              checked={@widget_config.show_total}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_platforms"
              label="Show platform breakdown"
              checked={@widget_config.show_platforms}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="animation_enabled"
              label="Enable smooth number animations"
              checked={@widget_config.animation_enabled}
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
          
    <!-- Appearance Settings -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Appearance">
            <StreampaiWeb.WidgetSettingsComponents.select_setting
              name="display_style"
              label="Display style"
              value={@widget_config.display_style}
              options={[
                {"minimal", "Minimal (total only)"},
                {"detailed", "Detailed (list view)"},
                {"cards", "Cards (grid view)"}
              ]}
            />

            <StreampaiWeb.WidgetSettingsComponents.select_setting
              name="font_size"
              label="Font size"
              value={@widget_config.font_size}
              options={[
                {"small", "Small"},
                {"medium", "Medium"},
                {"large", "Large"}
              ]}
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
          
    <!-- Update Settings -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Update Settings">
            <StreampaiWeb.WidgetSettingsComponents.number_input_setting
              name="update_interval"
              label="Update interval (seconds)"
              value={@widget_config.update_interval}
              min={1}
              max={30}
              help_text="How often viewer counts refresh (1-30 seconds)"
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
        </StreampaiWeb.WidgetSettingsComponents.settings_container>
        
    <!-- Usage Instructions -->
        <StreampaiWeb.WidgetSettingsComponents.obs_usage_instructions
          title="Viewer Count Widget"
          socket={@socket}
          url_path={~p"/widgets/viewer-count/display"}
          current_user={@current_user}
          dimensions="800x200"
          instructions={["Viewer counts update automatically based on your stream platforms"]}
        />
      </div>
    </.dashboard_layout>
    """
  end
end
