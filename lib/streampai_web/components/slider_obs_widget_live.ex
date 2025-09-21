defmodule StreampaiWeb.Components.SliderObsWidgetLive do
  @moduledoc """
  OBS display LiveView for the slider widget.
  Displays image slideshow with configurable timing and transitions.
  """
  use StreampaiWeb.WidgetBehaviour,
    type: :display,
    widget_type: :slider_widget

  alias StreampaiWeb.Utils.FakeSlider

  defp initialize_display_assigns(socket) do
    user_images = get_user_images(socket.assigns.widget_config)
    demo_mode = should_use_demo_mode?(socket.assigns.user_id, user_images)

    socket
    |> assign(:current_event, nil)
    |> assign(:demo_mode, demo_mode)
  end

  defp subscribe_to_real_events(user_id) do
    # Subscribe to slider-specific events (image uploads, etc.)
    Phoenix.PubSub.subscribe(Streampai.PubSub, "widget_events:#{user_id}:slider")

    # Only schedule demo images if no user images exist
    if should_use_demo_mode?(user_id, []) do
      schedule_demo_images()
    end
  end

  def handle_info(:generate_demo_images, socket) do
    user_images = get_user_images(socket.assigns.widget_config)

    if socket.assigns.demo_mode and length(user_images) == 0 do
      # Only generate demo images if user has no uploaded images
      demo_event = FakeSlider.generate_event()

      # Schedule next demo update
      schedule_demo_images()

      {:noreply, assign(socket, :current_event, demo_event)}
    else
      # Stop demo mode if user now has images
      {:noreply, assign(socket, :demo_mode, false)}
    end
  end

  defp get_user_images(config) do
    config[:images] || []
  end

  defp should_use_demo_mode?(user_id, user_images) do
    # Only use demo mode if:
    # 1. It's development environment AND
    # 2. User has no uploaded images AND
    # 3. User ID contains "demo" OR it's the test user
    has_no_images = length(user_images) == 0
    is_dev = Application.get_env(:streampai, :env) == :dev

    is_demo_user =
      String.contains?(user_id, "demo") or user_id == "07bfccd8-fc2d-4ed5-8069-0f0e692c6168"

    is_dev and has_no_images and is_demo_user
  end

  defp schedule_demo_images do
    # Schedule demo image updates every 30-60 seconds
    Process.send_after(self(), :generate_demo_images, Enum.random(30_000..60_000))
  end

  def render(assigns) do
    ~H"""
    <div class="h-screen w-screen">
      <.vue
        v-component="SliderWidget"
        v-socket={@socket}
        config={@widget_config}
        event={@current_event}
        class="w-full h-full"
        id="slider-widget"
      />
    </div>
    """
  end
end
