defmodule StreampaiWeb.Components.WidgetComponents do
  use StreampaiWeb, :html

  @doc """
  Renders a widget based on its type and configuration.
  Uses pattern matching for different widget types.
  """
  def widget(assigns)

  def widget(%{widget: %{type: "carousel"}} = assigns) do
    ~H"""
    <div
      id="carousel-widget"
      phx-hook="CarouselWidget"
      data-config={Jason.encode!(@widget.config)}
      class="w-full h-screen"
    >
      <div class="relative w-full h-full overflow-hidden">
        <%= for {image_url, index} <- Enum.with_index(@widget.config.images) do %>
          <div
            class={"absolute inset-0 transition-opacity duration-1000 #{if index == 0, do: "opacity-100", else: "opacity-0"}"}
            data-slide={index}
          >
            <img src={image_url} alt={"Slide #{index + 1}"} class="w-full h-full object-cover" />
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  def widget(%{widget: %{type: "chat"}} = assigns) do
    ~H"""
    <div
      id="chat-widget"
      phx-hook="ChatDisplay"
      data-config={Jason.encode!(@widget.config)}
      class="w-full h-screen bg-black/80 text-white p-4 flex flex-col"
    >
      <div class="flex-1 overflow-hidden">
        <div
          id="chat-messages"
          class="space-y-2 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600"
        >
          <!-- Messages will be populated by the hook -->
        </div>
      </div>
    </div>
    """
  end

  def widget(%{widget: %{type: "timer"}} = assigns) do
    # Don't override timer_count if it already exists
    # Just use whatever value is passed in from LiveView

    ~H"""
    <div class="w-full h-screen bg-gray-900 text-white flex items-center justify-center">
      <div class="text-center">
        <div class="text-8xl font-bold mb-4">
          {assigns[:timer_count] || 0}
        </div>
        <div class="text-xl text-gray-400">
          {@widget.config[:title] || "Timer"}
        </div>
        <div class="text-xs text-gray-500 mt-4">
          Debug: timer_count = {inspect(assigns[:timer_count])}
        </div>
      </div>
    </div>
    """
  end

  def widget(%{widget: %{type: widget_type}} = assigns) do
    assigns = assign(assigns, :widget_type, widget_type)

    ~H"""
    <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div class="text-center p-8">
        <svg
          class="w-16 h-16 text-yellow-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 class="text-2xl font-bold mb-2">Unsupported Widget Type</h1>
        <p class="text-gray-400">Widget type "{@widget_type}" is not supported yet.</p>
      </div>
    </div>
    """
  end
end
