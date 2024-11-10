defmodule StreampaiWeb.Components.CarouselWidget do
  @moduledoc """
  LiveView for displaying an image carousel widget.

  Perfect for showcasing sponsor logos, recent followers, achievements,
  or any rotating image content during streams.
  """
  use StreampaiWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      # Start carousel rotation
      schedule_next_slide()
    end

    {:ok,
     socket
     |> assign(:images, default_images())
     |> assign(:current_index, 0)
     # 5 seconds per slide
     |> assign(:transition_duration, 5000)
     |> assign(:show_indicators, true)
     |> assign(:auto_play, true), layout: false}
  end

  @impl true
  def handle_info(:next_slide, socket) do
    new_index = rem(socket.assigns.current_index + 1, length(socket.assigns.images))

    if socket.assigns.auto_play do
      schedule_next_slide()
    end

    {:noreply, assign(socket, :current_index, new_index)}
  end

  @impl true
  def handle_event("next", _params, socket) do
    new_index = rem(socket.assigns.current_index + 1, length(socket.assigns.images))
    {:noreply, assign(socket, :current_index, new_index)}
  end

  @impl true
  def handle_event("prev", _params, socket) do
    total_images = length(socket.assigns.images)
    new_index = rem(socket.assigns.current_index - 1 + total_images, total_images)
    {:noreply, assign(socket, :current_index, new_index)}
  end

  @impl true
  def handle_event("goto", %{"index" => index_str}, socket) do
    {index, _} = Integer.parse(index_str)

    if index >= 0 and index < length(socket.assigns.images) do
      {:noreply, assign(socket, :current_index, index)}
    else
      {:noreply, socket}
    end
  end

  @impl true
  def handle_event("toggle_autoplay", _params, socket) do
    auto_play = !socket.assigns.auto_play

    if auto_play do
      schedule_next_slide()
    end

    {:noreply, assign(socket, :auto_play, auto_play)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="carousel-widget bg-gray-900 rounded-lg overflow-hidden shadow-lg max-w-md mx-auto">
      <!-- Carousel Container -->
      <div class="relative h-48 bg-gray-800">
        <%= if @images != [] do %>
          <!-- Images -->
          <%= for {image, index} <- Enum.with_index(@images) do %>
            <div class={[
              "absolute inset-0 transition-opacity duration-500 ease-in-out",
              if(index == @current_index, do: "opacity-100 z-10", else: "opacity-0 z-0")
            ]}>
              <img
                src={image.url}
                alt={image.alt}
                class="w-full h-full object-contain bg-white"
                loading="lazy"
              />
              
    <!-- Image Overlay Info -->
              <%= if image.title do %>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <h3 class="text-white text-sm font-semibold">{image.title}</h3>
                  <%= if image.description do %>
                    <p class="text-gray-200 text-xs mt-1">{image.description}</p>
                  <% end %>
                </div>
              <% end %>
            </div>
          <% end %>
          
    <!-- Navigation Arrows -->
          <button
            phx-click="prev"
            class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-20"
            title="Previous image"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            phx-click="next"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-20"
            title="Next image"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        <% else %>
          <!-- Empty State -->
          <div class="flex items-center justify-center h-full text-gray-400">
            <div class="text-center">
              <svg
                class="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p class="text-sm">No images configured</p>
            </div>
          </div>
        <% end %>
      </div>
      
    <!-- Indicators and Controls -->
      <%= if @images != [] do %>
        <div class="bg-gray-700 px-4 py-2 flex items-center justify-between">
          <!-- Dot Indicators -->
          <%= if @show_indicators and length(@images) > 1 do %>
            <div class="flex space-x-1">
              <%= for index <- 0..(length(@images) - 1) do %>
                <button
                  phx-click="goto"
                  phx-value-index={index}
                  class={[
                    "w-2 h-2 rounded-full transition-colors",
                    if(index == @current_index,
                      do: "bg-purple-400",
                      else: "bg-gray-500 hover:bg-gray-400"
                    )
                  ]}
                  title={"Go to slide #{index + 1}"}
                >
                </button>
              <% end %>
            </div>
          <% else %>
            <div></div>
          <% end %>
          
    <!-- Counter and Controls -->
          <div class="flex items-center space-x-2 text-xs text-gray-300">
            <span>{@current_index + 1} / {length(@images)}</span>
            
    <!-- Auto-play Toggle -->
            <button
              phx-click="toggle_autoplay"
              class={[
                "p-1 rounded transition-colors",
                if(@auto_play,
                  do: "text-purple-400 hover:text-purple-300",
                  else: "text-gray-400 hover:text-gray-300"
                )
              ]}
              title={if(@auto_play, do: "Pause auto-play", else: "Start auto-play")}
            >
              <%= if @auto_play do %>
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              <% else %>
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="m7 4 10 6L7 16V4z" />
                </svg>
              <% end %>
            </button>
          </div>
        </div>
      <% end %>
    </div>
    """
  end

  # Private functions

  defp schedule_next_slide do
    # Default to 5 second intervals
    Process.send_after(self(), :next_slide, 5000)
  end

  defp default_images do
    [
      %{
        url:
          "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&crop=center",
        alt: "Gaming Setup",
        title: "Epic Gaming Station",
        description: "Professional streaming setup"
      },
      %{
        url:
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop&crop=center",
        alt: "Esports Tournament",
        title: "Esports Championship",
        description: "Competitive gaming at its finest"
      },
      %{
        url:
          "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&crop=center",
        alt: "Streaming Equipment",
        title: "Pro Streaming Gear",
        description: "High-quality broadcasting equipment"
      },
      %{
        url:
          "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop&crop=center",
        alt: "Gaming Community",
        title: "Gaming Community",
        description: "Building connections through gaming"
      },
      %{
        url:
          "https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300&fit=crop&crop=center",
        alt: "Retro Gaming",
        title: "Retro Gaming Night",
        description: "Classic games, timeless fun"
      }
    ]
  end
end
