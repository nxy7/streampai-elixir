defmodule StreampaiWeb.DonationGoalWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring donation goal widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :donation_goal_widget,
    fake_module: Streampai.Fake.DonationGoal

  alias StreampaiWeb.Utils.WidgetHelpers

  defp widget_title, do: "Donation Goal Widget"

  defp initialize_widget_specific_assigns(socket) do
    # Initialize with demo state
    demo_state = @fake_module.generate_demo_state(socket.assigns.widget_config)

    socket
    |> assign(:current_amount, demo_state.current_amount)
    |> assign(:last_donation, nil)
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [:show_percentage, :show_amount_raised, :show_days_left, :animation_enabled]

    # Map picker and text field names to unified names
    normalized_params = params
    |> Map.put("bar_color", params["bar_color_picker"] || params["bar_color_text"] || params["bar_color"])
    |> Map.put("background_color", params["background_color_picker"] || params["background_color_text"] || params["background_color"])
    |> Map.put("text_color", params["text_color_picker"] || params["text_color_text"] || params["text_color"])
    |> Map.drop(["bar_color_picker", "bar_color_text", "background_color_picker", "background_color_text", "text_color_picker", "text_color_text"])

    updated_config = WidgetHelpers.update_unified_settings(config, normalized_params,
      boolean_fields: boolean_fields,
      converter: &convert_setting_value/2
    )

    # Debug logging
    IO.inspect({:all_params, params}, label: "ALL PARAMS RECEIVED")
    IO.inspect({:normalized_params, normalized_params}, label: "NORMALIZED PARAMS")
    if Map.has_key?(normalized_params, "text_color") do
      IO.inspect({:color_update, normalized_params, updated_config}, label: "DONATION GOAL COLOR UPDATE")
    end

    updated_config
  end

  defp generate_and_assign_demo_data(socket) do
    # Generate a new donation event
    donation = @fake_module.generate_donation()

    # Update current amount
    new_amount = socket.assigns.current_amount + donation.amount

    socket
    |> assign(:current_amount, new_amount)
    |> assign(:last_donation, donation)
  end

  # Schedule next demo event between 3-4 seconds
  defp schedule_demo_event do
    delay = Enum.random(3000..4000)
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
      :goal_amount ->
        WidgetHelpers.parse_numeric_setting(value, min: 1, max: 1_000_000)

      :starting_amount ->
        WidgetHelpers.parse_numeric_setting(value, min: 0, max: 1_000_000)

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

      :title ->
        # Limit title length
        String.slice(value, 0, 100)

      :bar_color ->
        # Validate hex color
        if String.match?(value, ~r/^#[0-9A-Fa-f]{6}$/) do
          value
        else
          "#10b981"
        end

      :background_color ->
        if String.match?(value, ~r/^#[0-9A-Fa-f]{6}$/) do
          value
        else
          "#e5e7eb"
        end

      :text_color ->
        if String.match?(value, ~r/^#[0-9A-Fa-f]{6}$/) do
          value
        else
          "#1f2937"
        end

      _ ->
        value
    end
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Donation Goal Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <StreampaiWeb.WidgetSettingsComponents.widget_preview_header
            title="Donation Goal Widget"
            current_user={@current_user}
            socket={@socket}
            widget_type={:donation_goal_widget}
            url_path={~p"/widgets/donation-goal/display"}
            dimensions="400x200"
            copy_button_id="copy-donation-goal-url-button"
          />
          
    <!-- Donation Goal Widget Display -->
          <div class="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-200 rounded p-4 mt-4 min-h-[400px]">
            <div class="text-xs text-gray-400 mb-2">
              Preview (actual widget has transparent background)
            </div>
            <div class="w-full aspect-video">
              <.vue
                v-component="DonationGoalWidget"
                v-socket={@socket}
                config={@widget_config}
                currentAmount={@current_amount}
                donation={@last_donation}
                class="w-full h-full"
                id="preview-donation-goal-widget"
              />
            </div>
          </div>
        </div>
        
    <!-- Configuration Options -->
        <StreampaiWeb.WidgetSettingsComponents.settings_container widget_config={@widget_config}>
          <!-- Goal Settings -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Goal Settings">
            <div class="space-y-4">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={@widget_config.title}
                  phx-blur="update_settings"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Monthly Donation Goal"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="goal_amount" class="block text-sm font-medium text-gray-700 mb-1">
                    Goal Amount
                  </label>
                  <div class="flex">
                    <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      {@widget_config.currency}
                    </span>
                    <input
                      type="number"
                      name="goal_amount"
                      id="goal_amount"
                      value={@widget_config.goal_amount}
                      phx-blur="update_settings"
                      min="1"
                      max="1000000"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label for="starting_amount" class="block text-sm font-medium text-gray-700 mb-1">
                    Starting Amount
                  </label>
                  <div class="flex">
                    <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      {@widget_config.currency}
                    </span>
                    <input
                      type="number"
                      name="starting_amount"
                      id="starting_amount"
                      value={@widget_config.starting_amount}
                      phx-blur="update_settings"
                      min="0"
                      max="1000000"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="start_date" class="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    id="start_date"
                    value={@widget_config.start_date}
                    phx-blur="update_settings"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label for="end_date" class="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    id="end_date"
                    value={@widget_config.end_date}
                    phx-blur="update_settings"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <StreampaiWeb.WidgetSettingsComponents.select_setting
                name="currency"
                label="Currency"
                value={@widget_config.currency}
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
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Display Options">
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_amount_raised"
              label="Show amount raised"
              checked={@widget_config.show_amount_raised}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_percentage"
              label="Show completion percentage"
              checked={@widget_config.show_percentage}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="show_days_left"
              label="Show days remaining"
              checked={@widget_config.show_days_left}
            />
            <StreampaiWeb.WidgetSettingsComponents.checkbox_setting
              name="animation_enabled"
              label="Enable animations"
              checked={@widget_config.animation_enabled}
            />
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
          
    <!-- Appearance Settings -->
          <StreampaiWeb.WidgetSettingsComponents.settings_section title="Appearance">
            <StreampaiWeb.WidgetSettingsComponents.select_setting
              name="theme"
              label="Theme"
              value={@widget_config.theme}
              options={[
                {"default", "Default"},
                {"minimal", "Minimal"},
                {"modern", "Modern"}
              ]}
            />

            <div class="space-y-4">
              <div>
                <label for="bar_color" class="block text-sm font-medium text-gray-700 mb-1">
                  Progress Bar Color
                </label>
                <div class="flex items-center space-x-2">
                  <input
                    type="color"
                    name="bar_color_picker"
                    id="bar_color"
                    value={@widget_config.bar_color}
                    class="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={@widget_config.bar_color}
                    name="bar_color_text"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#10b981"
                  />
                </div>
              </div>

              <div>
                <label for="background_color" class="block text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <div class="flex items-center space-x-2">
                  <input
                    type="color"
                    name="background_color_picker"
                    id="background_color"
                    value={@widget_config.background_color}
                    class="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={@widget_config.background_color}
                    name="background_color_text"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#e5e7eb"
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
                    value={@widget_config.text_color}
                    class="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={@widget_config.text_color}
                    name="text_color_text"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#1f2937"
                  />
                </div>
              </div>
            </div>
          </StreampaiWeb.WidgetSettingsComponents.settings_section>
        </StreampaiWeb.WidgetSettingsComponents.settings_container>
        
    <!-- Usage Instructions -->
        <StreampaiWeb.WidgetSettingsComponents.obs_usage_instructions
          title="Donation Goal Widget"
          socket={@socket}
          url_path={~p"/widgets/donation-goal/display"}
          current_user={@current_user}
          dimensions="400x200"
          instructions={[
            "Progress updates automatically when donations are received",
            "Animated bubbles show new donations as they arrive",
            "Widget background is transparent for overlay use"
          ]}
        />
      </div>
    </.dashboard_layout>
    """
  end
end
