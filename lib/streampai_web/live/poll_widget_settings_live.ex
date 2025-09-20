defmodule StreampaiWeb.PollWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring poll widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :poll_widget,
    fake_module: StreampaiWeb.Utils.FakePoll

  alias StreampaiWeb.Utils.WidgetHelpers

  # Widget-specific implementations

  defp widget_title, do: "Poll Widget"

  defp initialize_widget_specific_assigns(socket) do
    socket
    |> assign(:current_poll_status, nil)
    |> assign(:demo_status, "waiting")
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [
      :show_title,
      :show_percentages,
      :show_vote_counts,
      :highlight_winner,
      :auto_hide_after_end
    ]

    WidgetHelpers.update_unified_settings(config, params,
      boolean_fields: boolean_fields,
      converter: &convert_setting_value/2
    )
  end

  defp generate_and_assign_demo_data(socket) do
    # Cycle through different poll states for demo
    new_status =
      case socket.assigns.demo_status do
        "waiting" -> "active"
        "active" -> "ended"
        "ended" -> "active"
        _ -> "active"
      end

    poll_status = @fake_module.generate_poll_status(new_status)

    socket
    |> assign(:current_poll_status, poll_status)
    |> assign(:demo_status, new_status)
  end

  defp convert_setting_value(setting, value) do
    case setting do
      :hide_delay ->
        WidgetHelpers.parse_numeric_setting(value, min: 1, max: 60)

      :font_size ->
        WidgetHelpers.validate_config_value(
          :font_size,
          value,
          ["small", "medium", "large", "extra-large"],
          "medium"
        )

      :animation_type ->
        WidgetHelpers.validate_config_value(
          :animation_type,
          value,
          ["none", "smooth", "bounce"],
          "smooth"
        )

      _ ->
        value
    end
  end

  # Additional event handlers for poll simulation
  def handle_event("simulate_poll", %{"action" => "start_active"}, socket) do
    new_poll_status = @fake_module.generate_active_poll()
    {:noreply, assign(socket, :current_poll_status, new_poll_status)}
  end

  def handle_event("simulate_poll", %{"action" => "start_ended"}, socket) do
    new_poll_status = @fake_module.generate_ended_poll()
    {:noreply, assign(socket, :current_poll_status, new_poll_status)}
  end

  def handle_event("simulate_poll", %{"action" => "add_vote"}, socket) do
    new_poll_status =
      case socket.assigns.current_poll_status do
        nil -> @fake_module.generate_active_poll()
        poll_status -> @fake_module.simulate_vote_update(poll_status)
      end

    {:noreply, assign(socket, :current_poll_status, new_poll_status)}
  end

  def handle_event("simulate_poll", %{"action" => "clear"}, socket) do
    {:noreply, assign(socket, :current_poll_status, nil)}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Poll Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <StreampaiWeb.WidgetSettingsComponents.widget_preview
          title="Poll Widget"
          current_user={@current_user}
          socket={@socket}
          widget_type={:poll_widget}
          url_path={~p"/widgets/poll/display"}
          dimensions="500x400"
          copy_button_id="copy-poll-url-button"
          vue_component="PollWidget"
        >
          <.vue
            v-component="PollWidget"
            v-socket={@socket}
            config={@widget_config}
            poll-status={@current_poll_status}
          />
        </StreampaiWeb.WidgetSettingsComponents.widget_preview>
        
    <!-- Poll Simulation Controls -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Poll Simulation (Preview)</h2>
          <div class="flex flex-wrap gap-2">
            <button
              phx-click="simulate_poll"
              phx-value-action="start_active"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <StreampaiWeb.CoreComponents.icon name="hero-play-solid" class="h-4 w-4 mr-1" />
              Start Active Poll
            </button>
            <button
              phx-click="simulate_poll"
              phx-value-action="start_ended"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <StreampaiWeb.CoreComponents.icon name="hero-chart-bar-solid" class="h-4 w-4 mr-1" />
              Show Poll Results
            </button>
            <button
              phx-click="simulate_poll"
              phx-value-action="add_vote"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <StreampaiWeb.CoreComponents.icon name="hero-plus-circle-solid" class="h-4 w-4 mr-1" />
              Add Vote
            </button>
            <button
              phx-click="simulate_poll"
              phx-value-action="clear"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <StreampaiWeb.CoreComponents.icon name="hero-x-mark-solid" class="h-4 w-4 mr-1" />
              Clear Poll
            </button>
          </div>
        </div>
        
    <!-- Poll Settings Form -->
        <form phx-change="update_settings" class="space-y-6">
          <!-- Display Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Display Settings</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="show_title"
                  value="true"
                  checked={@widget_config[:show_title]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Show Poll Title
                </label>
              </div>

              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="show_percentages"
                  value="true"
                  checked={@widget_config[:show_percentages]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Show Vote Percentages
                </label>
              </div>

              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="show_vote_counts"
                  value="true"
                  checked={@widget_config[:show_vote_counts]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Show Vote Counts
                </label>
              </div>

              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="highlight_winner"
                  value="true"
                  checked={@widget_config[:highlight_winner]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Highlight Leading Option
                </label>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Font Size</label>
                <select
                  name="font_size"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <option value="small" selected={@widget_config[:font_size] == "small"}>
                    Small
                  </option>
                  <option value="medium" selected={@widget_config[:font_size] == "medium"}>
                    Medium
                  </option>
                  <option value="large" selected={@widget_config[:font_size] == "large"}>
                    Large
                  </option>
                  <option value="extra-large" selected={@widget_config[:font_size] == "extra-large"}>
                    Extra Large
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Animation Style</label>
                <select
                  name="animation_type"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <option value="none" selected={@widget_config[:animation_type] == "none"}>
                    None
                  </option>
                  <option value="smooth" selected={@widget_config[:animation_type] == "smooth"}>
                    Smooth
                  </option>
                  <option value="bounce" selected={@widget_config[:animation_type] == "bounce"}>
                    Bounce
                  </option>
                </select>
              </div>
            </div>
          </div>
          
    <!-- Color Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Colors</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Primary Color</label>
                <input
                  type="color"
                  name="primary_color"
                  value={@widget_config[:primary_color]}
                  class="mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Secondary Color</label>
                <input
                  type="color"
                  name="secondary_color"
                  value={@widget_config[:secondary_color]}
                  class="mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Background Color</label>
                <input
                  type="color"
                  name="background_color"
                  value={@widget_config[:background_color]}
                  class="mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Text Color</label>
                <input
                  type="color"
                  name="text_color"
                  value={@widget_config[:text_color]}
                  class="mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Winner Highlight Color</label>
                <input
                  type="color"
                  name="winner_color"
                  value={@widget_config[:winner_color]}
                  class="mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
          
    <!-- Auto-Hide Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Auto-Hide Settings</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="auto_hide_after_end"
                  value="true"
                  checked={@widget_config[:auto_hide_after_end]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Auto-hide widget after poll ends
                </label>
              </div>

              <div :if={@widget_config[:auto_hide_after_end]}>
                <label class="block text-sm font-medium text-gray-700">
                  Hide Delay (seconds)
                </label>
                <input
                  type="number"
                  name="hide_delay"
                  value={@widget_config[:hide_delay]}
                  min="1"
                  max="60"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
                <p class="mt-1 text-sm text-gray-500">
                  How long to show results before hiding
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </.dashboard_layout>
    """
  end
end
