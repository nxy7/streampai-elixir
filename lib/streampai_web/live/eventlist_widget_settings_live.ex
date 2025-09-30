defmodule StreampaiWeb.EventlistWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring eventlist widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :eventlist_widget,
    fake_module: StreampaiWeb.Utils.FakeEventlist

  alias StreampaiWeb.Utils.WidgetHelpers
  alias StreampaiWeb.Utils.WidgetValidators

  defp widget_title, do: "Event List Widget"

  defp initialize_widget_specific_assigns(socket) do
    # Generate initial events for preview
    initial_events = @fake_module.generate_events(socket.assigns.widget_config.max_events || 10)
    assign(socket, :current_events, initial_events)
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [:show_timestamps, :show_platform, :show_amounts, :compact_mode]

    WidgetHelpers.update_unified_settings(config, params,
      boolean_fields: boolean_fields,
      converter: &convert_setting_value/2
    )
  end

  defp generate_and_assign_demo_data(socket) do
    max_events = socket.assigns.widget_config.max_events || 10
    new_events = @fake_module.generate_events(max_events)
    assign(socket, :current_events, new_events)
  end

  defp schedule_demo_event, do: Process.send_after(self(), :generate_demo_event, 5000)

  defp convert_setting_value(setting, value) do
    case setting do
      :max_events ->
        WidgetValidators.validate_numeric(value, min: 1, max: 50)

      :animation_type ->
        WidgetValidators.validate_animation_type(value)

      :font_size ->
        WidgetValidators.validate_font_size(value)

      :event_types ->
        case value do
          value when is_list(value) ->
            valid_types = ["donation", "follow", "subscription", "raid", "chat_message"]
            Enum.filter(value, &(&1 in valid_types))

          _ ->
            ["donation", "follow", "subscription", "raid"]
        end

      _ ->
        value
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Event List Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <StreampaiWeb.WidgetSettingsComponents.widget_preview
          title="Event List Widget"
          current_user={@current_user}
          socket={@socket}
          widget_type={:eventlist_widget}
          url_path={~p"/widgets/eventlist/display"}
          dimensions="400x600"
          copy_button_id="copy-eventlist-url-button"
          vue_component="EventListWidget"
        >
          <.vue
            v-component="EventListWidget"
            v-socket={@socket}
            config={@widget_config}
            events={@current_events}
            class="w-full h-full"
            id="preview-eventlist-widget"
          />
        </StreampaiWeb.WidgetSettingsComponents.widget_preview>
        
    <!-- Configuration Options -->
        <StreampaiWeb.WidgetSettingsComponents.settings_container widget_config={@widget_config}>
          <!-- Display Options -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Display Options">
            <StreampaiWeb.WidgetSettingsComponents.number_input_setting
              name="max_events"
              label="Maximum events to show"
              value={@widget_config.max_events}
              min={1}
              max={50}
              help_text="How many events to display in the list (1-50)"
            />

            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_timestamps"
              label="Show timestamps"
              checked={@widget_config.show_timestamps}
            />

            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_platform"
              label="Show platform badges"
              checked={@widget_config.show_platform}
            />

            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_amounts"
              label="Show donation amounts"
              checked={@widget_config.show_amounts}
            />

            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="compact_mode"
              label="Compact mode"
              checked={@widget_config.compact_mode}
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
          
    <!-- Event Types -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Event Types">
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Select which events to show:
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    name="event_types[]"
                    value="donation"
                    class="rounded border-gray-300 text-purple-600"
                    checked={"donation" in @widget_config.event_types}
                  />
                  <span class="ml-2 text-sm text-gray-700">💰 Donations</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    name="event_types[]"
                    value="follow"
                    class="rounded border-gray-300 text-purple-600"
                    checked={"follow" in @widget_config.event_types}
                  />
                  <span class="ml-2 text-sm text-gray-700">❤️ Follows</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    name="event_types[]"
                    value="subscription"
                    class="rounded border-gray-300 text-purple-600"
                    checked={"subscription" in @widget_config.event_types}
                  />
                  <span class="ml-2 text-sm text-gray-700">⭐ Subscriptions</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    name="event_types[]"
                    value="raid"
                    class="rounded border-gray-300 text-purple-600"
                    checked={"raid" in @widget_config.event_types}
                  />
                  <span class="ml-2 text-sm text-gray-700">⚡ Raids</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    name="event_types[]"
                    value="chat_message"
                    class="rounded border-gray-300 text-purple-600"
                    checked={"chat_message" in @widget_config.event_types}
                  />
                  <span class="ml-2 text-sm text-gray-700">💬 Chat Messages</span>
                </label>
              </div>
            </div>
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
          
    <!-- Appearance Settings -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Appearance">
            <StreampaiWeb.WidgetSettingsComponents.select_setting
              name="animation_type"
              label="Animation type"
              value={@widget_config.animation_type}
              options={[
                {"fade", "Fade In"},
                {"slide", "Slide In"},
                {"bounce", "Bounce In"}
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
        </StreampaiWeb.WidgetSettingsComponents.settings_container>
        
    <!-- Usage Instructions -->
        <StreampaiWeb.WidgetSettingsComponents.obs_usage_instructions
          title="Event List Widget"
          socket={@socket}
          url_path={~p"/widgets/eventlist/display"}
          current_user={@current_user}
          dimensions="400x600"
          instructions={[
            "Recent events will appear automatically as they happen",
            "Events are displayed in chronological order (newest first)",
            "Configure which event types to show in the settings above"
          ]}
        />
      </div>
    </.dashboard_layout>
    """
  end
end
