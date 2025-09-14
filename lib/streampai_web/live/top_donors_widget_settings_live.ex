defmodule StreampaiWeb.TopDonorsWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring top donors widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :top_donors_widget,
    fake_module: Streampai.Fake.TopDonors

  alias StreampaiWeb.Utils.WidgetHelpers

  defp widget_title, do: "Top Donors Widget"

  defp initialize_widget_specific_assigns(socket) do
    # Initialize with demo state
    demo_state = @fake_module.generate_demo_state(socket.assigns.widget_config)

    assign(socket, :donors, demo_state.donors)
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [:animation_enabled]
    color_fields = ["background_color", "text_color"]

    # Normalize color picker parameters using WidgetHelpers utility
    normalized_params = WidgetHelpers.normalize_color_params(params, color_fields)

    WidgetHelpers.update_unified_settings(config, normalized_params,
      boolean_fields: boolean_fields,
      converter: &convert_setting_value/2
    )
  end

  defp generate_and_assign_demo_data(socket) do
    # Generate new top donors list with some changes
    new_donors = @fake_module.generate_shuffled_top_donors(20)

    assign(socket, :donors, new_donors)
  end

  # Schedule next demo event between 7-10 seconds
  defp schedule_demo_event do
    delay = Enum.random(7000..10_000)
    Process.send_after(self(), :generate_demo_event, delay)
  end

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
      :display_count ->
        WidgetHelpers.parse_numeric_setting(value, min: 1, max: 20)

      :theme ->
        WidgetHelpers.validate_config_value(
          :theme,
          value,
          ["default", "minimal", "modern"],
          "default"
        )

      :currency ->
        # Ensure currency is a valid symbol
        if value in ["$", "€", "£", "¥", "₹", "₽", "¥"] do
          value
        else
          "$"
        end

      :background_color ->
        WidgetHelpers.validate_hex_color(value, "#1f2937")

      :text_color ->
        WidgetHelpers.validate_hex_color(value, "#ffffff")

      _ ->
        value
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Top Donors Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <StreampaiWeb.WidgetSettingsComponents.widget_preview_header
            title="Top Donors Widget"
            current_user={@current_user}
            socket={@socket}
            widget_type={:top_donors_widget}
            url_path={~p"/widgets/top-donors/display"}
            dimensions="300x600"
            copy_button_id="copy-top-donors-url-button"
          />
          
    <!-- Top Donors Widget Display -->
          <div class="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-200 rounded p-4 mt-4 min-h-[600px]">
            <div class="text-xs text-gray-400 mb-2">
              Preview (actual widget has transparent background)
            </div>
            <div class="w-full max-w-sm mx-auto">
              <.vue
                v-component="TopDonorsWidget"
                v-socket={@socket}
                config={@widget_config}
                donors={Enum.slice(@donors, 0, @widget_config.display_count || 10)}
                class="w-full h-full"
                id="preview-top-donors-widget"
              />
            </div>
          </div>
        </div>
        
    <!-- Configuration Options -->
        <StreampaiWeb.WidgetSettingsComponents.settings_container widget_config={@widget_config}>
          <!-- Display Settings -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Display Settings">
            <div class="space-y-4">
              <div>
                <label for="display_count" class="block text-sm font-medium text-gray-700 mb-1">
                  Number of Donors to Display
                </label>
                <input
                  type="number"
                  name="display_count"
                  id="display_count"
                  value={@widget_config.display_count || 10}
                  phx-blur="update_settings"
                  min="1"
                  max="20"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p class="text-sm text-gray-500 mt-1">Choose between 1 and 20 donors to display</p>
              </div>

              <StreampaiWeb.WidgetSettingsComponents.select_setting
                name="currency"
                label="Currency"
                value={@widget_config.currency || "$"}
                options={[
                  {"$", "USD ($)"},
                  {"€", "EUR (€)"},
                  {"£", "GBP (£)"},
                  {"¥", "JPY (¥)"},
                  {"₹", "INR (₹)"},
                  {"₽", "RUB (₽)"}
                ]}
              />
            </div>
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
          
    <!-- Display Options -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Animation">
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="animation_enabled"
              label="Enable smooth animations when donors list changes"
              checked={@widget_config.animation_enabled || true}
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
          
    <!-- Appearance Settings -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Appearance">
            <StreampaiWeb.WidgetSettingsComponents.select_setting
              name="theme"
              label="Theme"
              value={@widget_config.theme || "default"}
              options={[
                {"default", "Default"},
                {"minimal", "Minimal"},
                {"modern", "Modern"}
              ]}
            />

            <div class="space-y-4">
              <div>
                <label for="background_color" class="block text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <div class="flex items-center space-x-2">
                  <input
                    type="color"
                    name="background_color_picker"
                    id="background_color"
                    value={@widget_config.background_color || "#1f2937"}
                    class="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={@widget_config.background_color || "#1f2937"}
                    name="background_color_text"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#1f2937"
                  />
                </div>
              </div>

              <div>
                <label for="text_color" class="block text-sm font-medium text-gray-700 mb-1">
                  Text Color
                </label>
                <div class="flex items-center space-x-2">
                  <input
                    type="color"
                    name="text_color_picker"
                    id="text_color"
                    value={@widget_config.text_color || "#ffffff"}
                    class="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={@widget_config.text_color || "#ffffff"}
                    name="text_color_text"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
        </StreampaiWeb.WidgetSettingsComponents.settings_container>
        
    <!-- Usage Instructions -->
        <StreampaiWeb.WidgetSettingsComponents.obs_usage_instructions
          title="Top Donors Widget"
          socket={@socket}
          url_path={~p"/widgets/top-donors/display"}
          current_user={@current_user}
          dimensions="300x600"
          instructions={[
            "Displays top donors ranked by total donation amount",
            "Top 3 donors get special emoji crowns and larger names",
            "List updates automatically with smooth animations when rankings change",
            "Widget background is transparent for overlay use"
          ]}
        />
      </div>
    </.dashboard_layout>
    """
  end
end
