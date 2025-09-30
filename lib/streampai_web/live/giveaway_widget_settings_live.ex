defmodule StreampaiWeb.GiveawayWidgetSettingsLive do
  @moduledoc """
  LiveView for configuring giveaway widget settings and OBS browser source URL generation.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :settings,
    widget_type: :giveaway_widget,
    fake_module: Streampai.Fake.Giveaway

  alias StreampaiWeb.Utils.WidgetHelpers
  alias StreampaiWeb.Utils.WidgetValidators

  defp widget_title, do: "Giveaway Widget"

  defp initialize_widget_specific_assigns(socket) do
    socket
    |> assign(:current_event, nil)
    |> assign(:giveaway_controls_visible, true)
    |> assign(:giveaway_active, false)
  end

  defp update_widget_settings(config, params) do
    boolean_fields = [
      :show_title,
      :show_description,
      :show_entry_method,
      :show_progress_bar,
      :show_patreon_info
    ]

    WidgetHelpers.update_unified_settings(config, params,
      boolean_fields: boolean_fields,
      converter: &convert_setting_value/2
    )
  end

  defp generate_and_assign_demo_data(socket) do
    # Generate giveaway events periodically for demo
    new_event = @fake_module.generate_event()
    assign(socket, :current_event, new_event)
  end

  defp convert_setting_value(setting, value) do
    case setting do
      :target_participants ->
        WidgetValidators.validate_numeric(value, min: 1, max: 1000)

      :patreon_multiplier ->
        WidgetValidators.validate_numeric(value, min: 1, max: 10)

      :font_size ->
        WidgetValidators.validate_enum(
          value,
          ["small", "medium", "large", "extra-large"],
          "medium"
        )

      :winner_animation ->
        WidgetValidators.validate_enum(value, ["fade", "slide", "bounce", "confetti"], "bounce")

      _ ->
        value
    end
  end

  # Additional event handlers for giveaway controls
  def handle_event("giveaway_control", %{"action" => action}, socket) do
    {event, new_giveaway_active} =
      case action do
        "start" ->
          # Start a new giveaway
          event = %{
            id: Streampai.Fake.Base.generate_hex_id(),
            type: :update,
            participants: 0,
            patreons: 0,
            isActive: true,
            timestamp: DateTime.utc_now()
          }

          {event, true}

        "end" ->
          # End giveaway and show winner
          event = @fake_module.generate_result_event()
          {event, false}

        "reset" ->
          # Reset to inactive state
          event = %{
            id: Streampai.Fake.Base.generate_hex_id(),
            type: :update,
            participants: 0,
            patreons: 0,
            isActive: false,
            timestamp: DateTime.utc_now()
          }

          {event, false}

        "simulate_join" ->
          # Simulate participants joining
          current_participants =
            if socket.assigns.current_event do
              socket.assigns.current_event[:participants] || 0
            else
              0
            end

          new_participants = current_participants + Enum.random(1..5)
          new_patreons = div(new_participants, 4)

          event = %{
            id: Streampai.Fake.Base.generate_hex_id(),
            type: :update,
            participants: new_participants,
            patreons: new_patreons,
            isActive: true,
            timestamp: DateTime.utc_now()
          }

          {event, socket.assigns.giveaway_active}
      end

    socket =
      socket
      |> assign(:current_event, event)
      |> assign(:giveaway_active, new_giveaway_active)

    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <.dashboard_layout {assigns} current_page="widgets" page_title="Giveaway Widget">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Widget Preview -->
        <StreampaiWeb.WidgetSettingsComponents.widget_preview
          title="Giveaway Widget"
          current_user={@current_user}
          socket={@socket}
          widget_type={:giveaway_widget}
          url_path={~p"/widgets/giveaway/display"}
          dimensions="400x300"
          copy_button_id="copy-giveaway-url-button"
          vue_component="GiveawayWidget"
        >
          <.vue
            v-component="GiveawayWidget"
            v-socket={@socket}
            config={@widget_config}
            event={@current_event}
          />
        </StreampaiWeb.WidgetSettingsComponents.widget_preview>
        
    <!-- Giveaway Controls for Testing -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Giveaway Controls (Preview)</h2>
          <div class="flex flex-wrap gap-2">
            <button
              phx-click="giveaway_control"
              phx-value-action="start"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <StreampaiWeb.CoreComponents.icon name="hero-play-solid" class="h-4 w-4 mr-1" />
              Start Giveaway
            </button>
            <button
              phx-click="giveaway_control"
              phx-value-action="simulate_join"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <StreampaiWeb.CoreComponents.icon name="hero-user-plus-solid" class="h-4 w-4 mr-1" />
              Simulate Join
            </button>
            <button
              phx-click="giveaway_control"
              phx-value-action="end"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <StreampaiWeb.CoreComponents.icon name="hero-trophy-solid" class="h-4 w-4 mr-1" />
              Pick Winner
            </button>
            <button
              phx-click="giveaway_control"
              phx-value-action="reset"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <StreampaiWeb.CoreComponents.icon name="hero-arrow-path-solid" class="h-4 w-4 mr-1" />
              Reset
            </button>
          </div>
        </div>
        
    <!-- Giveaway Settings Form -->
        <form phx-change="update_settings" class="space-y-6">
          <!-- Basic Giveaway Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Basic Giveaway Settings</h2>
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
                  Show Title
                </label>
              </div>

              <div :if={@widget_config[:show_title]}>
                <label class="block text-sm font-medium text-gray-700">Giveaway Title</label>
                <input
                  type="text"
                  name="title"
                  value={@widget_config[:title]}
                  placeholder="Community Giveaway"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>

              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="show_description"
                  value="true"
                  checked={@widget_config[:show_description]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Show Description
                </label>
              </div>

              <div :if={@widget_config[:show_description]}>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows="2"
                  placeholder="Type !join to enter"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                ><%= @widget_config[:description] %></textarea>
              </div>

              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="show_entry_method"
                  value="true"
                  checked={@widget_config[:show_entry_method]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Show Entry Method
                </label>
              </div>

              <div :if={@widget_config[:show_entry_method]}>
                <label class="block text-sm font-medium text-gray-700">Entry Method Text</label>
                <input
                  type="text"
                  name="entry_method_text"
                  value={@widget_config[:entry_method_text]}
                  placeholder="Type !join to enter"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
    <!-- Status Labels -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Status Labels</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Active Label</label>
                <input
                  type="text"
                  name="active_label"
                  value={@widget_config[:active_label]}
                  placeholder="Giveaway Active"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Inactive Label</label>
                <input
                  type="text"
                  name="inactive_label"
                  value={@widget_config[:inactive_label]}
                  placeholder="No Active Giveaway"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Winner Label</label>
                <input
                  type="text"
                  name="winner_label"
                  value={@widget_config[:winner_label]}
                  placeholder="🎉 Winner! 🎉"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
    <!-- Progress & Goals -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Progress & Goals</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="show_progress_bar"
                  value="true"
                  checked={@widget_config[:show_progress_bar]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Show Progress Bar
                </label>
              </div>

              <div :if={@widget_config[:show_progress_bar]}>
                <label class="block text-sm font-medium text-gray-700">Target Participants</label>
                <input
                  type="number"
                  name="target_participants"
                  value={@widget_config[:target_participants]}
                  min="1"
                  max="1000"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
                <p class="mt-1 text-sm text-gray-500">
                  Progress bar will fill as participants join
                </p>
              </div>
            </div>
          </div>
          
    <!-- Patreon Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Patreon Integration</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  name="show_patreon_info"
                  value="true"
                  checked={@widget_config[:show_patreon_info]}
                  class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Show Patreon Information
                </label>
              </div>

              <div :if={@widget_config[:show_patreon_info]}>
                <label class="block text-sm font-medium text-gray-700">
                  Patreon Entry Multiplier
                </label>
                <input
                  type="number"
                  name="patreon_multiplier"
                  value={@widget_config[:patreon_multiplier]}
                  min="1"
                  max="10"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
                <p class="mt-1 text-sm text-gray-500">
                  How many entries Patreons get (1 = same as regular viewers)
                </p>
              </div>

              <div :if={@widget_config[:show_patreon_info]}>
                <label class="block text-sm font-medium text-gray-700">Patreon Badge Text</label>
                <input
                  type="text"
                  name="patreon_badge_text"
                  value={@widget_config[:patreon_badge_text]}
                  placeholder="⭐ Patreon"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
    <!-- Appearance Settings -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Appearance</h2>
            <div class="space-y-4">
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
                <label class="block text-sm font-medium text-gray-700">Title Color</label>
                <input
                  type="color"
                  name="title_color"
                  value={@widget_config[:title_color]}
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
                <label class="block text-sm font-medium text-gray-700">Background Color</label>
                <input
                  type="color"
                  name="background_color"
                  value={@widget_config[:background_color]}
                  class="mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Accent Color</label>
                <input
                  type="color"
                  name="accent_color"
                  value={@widget_config[:accent_color]}
                  class="mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <p class="mt-1 text-sm text-gray-500">
                  Used for active giveaway backgrounds and progress bars
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">Winner Animation</label>
                <select
                  name="winner_animation"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  <option value="fade" selected={@widget_config[:winner_animation] == "fade"}>
                    Fade In
                  </option>
                  <option value="slide" selected={@widget_config[:winner_animation] == "slide"}>
                    Slide Up
                  </option>
                  <option value="bounce" selected={@widget_config[:winner_animation] == "bounce"}>
                    Bounce
                  </option>
                  <option value="confetti" selected={@widget_config[:winner_animation] == "confetti"}>
                    Confetti
                  </option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </.dashboard_layout>
    """
  end
end
