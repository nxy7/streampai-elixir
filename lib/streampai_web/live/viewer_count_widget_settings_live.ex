defmodule StreampaiWeb.ViewerCountWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring viewer count widget settings and OBS browser source URL generation.

  NOTE: This widget shares 95% of its implementation with FollowerCountWidgetSettingsLive.
  The only differences are: widget title, fake module, default icon color, and label field name.
  If significant changes are needed, consider extracting shared functionality.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :viewer_count_widget,
    fake_module: Streampai.Fake.ViewerCount

  alias StreampaiWeb.Utils.WidgetHelpers
  alias StreampaiWeb.Utils.WidgetValidators

  defp widget_title, do: "Viewer Count Widget"

  defp initialize_widget_specific_assigns(socket) do
    # Generate initial viewer data for preview
    initial_data = @fake_module.generate_viewer_data()
    assign(socket, :current_data, initial_data)
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [:show_total, :show_platforms, :animation_enabled]
    color_fields = ["icon_color"]

    # Normalize color picker parameters
    normalized_params = WidgetHelpers.normalize_color_params(params, color_fields)

    WidgetHelpers.update_unified_settings(config, normalized_params,
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

  defp schedule_demo_event do
    # Use a reasonable default that matches our widget's typical interval
    # This could be enhanced to read from socket.assigns.widget_config if passed
    Process.send_after(self(), :generate_demo_event, 3000)
  end

  defp convert_setting_value(setting, value) do
    case setting do
      :display_style -> WidgetValidators.validate_display_style(value)
      :font_size -> WidgetValidators.validate_font_size(value)
      :icon_color -> WidgetValidators.validate_hex_color(value, "#ef4444")
      _ -> value
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Viewer Count Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <StreampaiWeb.WidgetSettingsComponents.widget_preview
          title="Viewer Count Widget"
          current_user={@current_user}
          socket={@socket}
          widget_type={:viewer_count_widget}
          url_path={~p"/widgets/viewer-count/display"}
          dimensions="800x200"
          copy_button_id="copy-viewer-count-url-button"
          vue_component="ViewerCountWidget"
          container_class="max-w-2xl mx-auto bg-gray-900 border border-gray-200 rounded p-4 h-64 overflow-hidden relative"
        >
          <.vue
            v-component="ViewerCountWidget"
            v-socket={@socket}
            config={@widget_config}
            data={@current_data}
            class="w-full h-full"
            id="preview-viewer-count-widget"
          />
        </StreampaiWeb.WidgetSettingsComponents.widget_preview>
        
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
            <StreampaiWeb.WidgetSettingsComponents.text_input_setting
              name="viewer_label"
              label="Viewer label"
              value={@widget_config.viewer_label}
              placeholder="viewers"
              help_text="Text displayed next to the viewer count"
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

            <StreampaiWeb.WidgetSettingsComponents.color_picker_setting
              name="icon_color"
              label="Icon Color"
              value={@widget_config.icon_color}
              default_color="#ef4444"
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
