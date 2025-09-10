defmodule StreampaiWeb.WidgetDisplayLive do
  use StreampaiWeb, :live_view

  import StreampaiWeb.Components.WidgetComponents

  def mount(%{"uuid" => widget_uuid}, _session, socket) do
    case lookup_widget(widget_uuid) do
      {:ok, widget} ->
        socket =
          assign(socket,
            widget: widget,
            widget_uuid: widget_uuid,
            error: nil
          )

        socket = maybe_start_timer_server(socket, widget)

        {:ok, socket, layout: false}

      {:error, :not_found} ->
        {:ok,
         assign(socket,
           widget: nil,
           widget_uuid: widget_uuid,
           error: :not_found
         ), layout: false}

      {:error, reason} ->
        {:ok,
         assign(socket,
           widget: nil,
           widget_uuid: widget_uuid,
           error: reason
         ), layout: false}
    end
  end

  def handle_info({:timer_tick, count}, socket) do
    {:noreply, assign(socket, timer_count: count)}
  end

  def terminate(_reason, socket) do
    # Clean up timer server if it exists
    if socket.assigns[:timer_pid] do
      Streampai.Widgets.TimerServer.stop_timer(socket.assigns.timer_pid)
    end

    :ok
  end

  # Simulate widget lookup - in real implementation this would query the database
  defp lookup_widget(uuid) do
    case uuid do
      # Demo carousel widget
      "demo-carousel" ->
        {:ok,
         %{
           id: "demo-carousel",
           type: "carousel",
           name: "Demo Image Carousel",
           config: %{
             images: [
               "https://picsum.photos/800/400?random=1",
               "https://picsum.photos/800/400?random=2",
               "https://picsum.photos/800/400?random=3",
               "https://picsum.photos/800/400?random=4"
             ],
             interval: 5000
           }
         }}

      # Demo chat widget
      "demo-chat" ->
        {:ok,
         %{
           id: "demo-chat",
           type: "chat",
           name: "Demo Chat Widget",
           config: %{
             max_messages: 10,
             show_avatars: true,
             auto_scroll: true
           }
         }}

      # Demo timer widget
      "demo-timer" ->
        {:ok,
         %{
           id: "demo-timer",
           type: "timer",
           name: "Demo Timer Widget",
           config: %{
             title: "Stream Timer"
           }
         }}

      # Check if it's a valid UUID format but not found
      _uuid ->
        if valid_uuid?(uuid) do
          {:error, :not_found}
        else
          {:error, :invalid_uuid}
        end
    end
  end

  defp maybe_start_timer_server(socket, %{type: "timer"} = widget) do
    if socket.assigns[:timer_pid] && Process.alive?(socket.assigns.timer_pid) do
      socket
    else
      start_timer_server(socket, widget)
    end
  end

  defp maybe_start_timer_server(socket, _widget), do: socket

  defp start_timer_server(socket, widget) do
    case Streampai.Widgets.TimerServer.start_timer(widget.id, self()) do
      {:ok, pid} ->
        Process.link(pid)
        assign(socket, timer_count: 0, timer_pid: pid)

      {:error, _reason} ->
        assign(socket, timer_count: 0, timer_pid: nil)
    end
  end

  defp valid_uuid?(uuid) do
    try do
      case UUID.info(uuid) do
        {:ok, _} -> true
        {:error, _} -> false
      end
    rescue
      _ ->
        # Simple regex check if UUID module is not available
        Regex.match?(
          ~r/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
          uuid
        )
    end
  end

  def render(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Streampai Widget</title>
        <style>
          body { margin: 0; padding: 0; overflow: hidden; }
        </style>
      </head>
      <body class="bg-transparent">
        <%= cond do %>
          <% @error == :not_found -> %>
            <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
              <div class="text-center p-8">
                <svg
                  class="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h1 class="text-2xl font-bold mb-2">Widget Not Found</h1>
                <p class="text-gray-400 mb-4">
                  The widget with ID "<code class="bg-gray-800 px-2 py-1 rounded"><%= @widget_uuid %></code>" could not be found.
                </p>
                <p class="text-sm text-gray-500">
                  Please check your widget configuration in the Streampai dashboard.
                </p>
              </div>
            </div>
          <% @error == :invalid_uuid -> %>
            <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
              <div class="text-center p-8">
                <svg
                  class="w-16 h-16 text-red-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h1 class="text-2xl font-bold mb-2">Invalid Widget ID</h1>
                <p class="text-gray-400 mb-4">
                  The widget ID "<code class="bg-gray-800 px-2 py-1 rounded"><%= @widget_uuid %></code>" is not valid.
                </p>
                <p class="text-sm text-gray-500">
                  Widget IDs should be valid UUIDs from your Streampai dashboard.
                </p>
              </div>
            </div>
          <% @error -> %>
            <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
              <div class="text-center p-8">
                <svg
                  class="w-16 h-16 text-red-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h1 class="text-2xl font-bold mb-2">Error Loading Widget</h1>
                <p class="text-gray-400">There was an error loading the widget.</p>
              </div>
            </div>
          <% @widget -> %>
            <.widget widget={@widget} timer_count={assigns[:timer_count]} />
          <% true -> %>
            <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
              <div class="text-center p-8">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4">
                </div>
                <h1 class="text-xl">Loading widget...</h1>
              </div>
            </div>
        <% end %>
      </body>
    </html>
    """
  end
end
