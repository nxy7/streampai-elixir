defmodule StreampaiWeb.SharedCursorLive do
  @moduledoc false
  use StreampaiWeb, :live_view

  alias Phoenix.PubSub

  @cursor_topic "cursor_positions"

  def mount(_params, _session, socket) do
    # Generate user ID immediately for both connected and disconnected states
    user_id = generate_user_id()
    IO.puts("Mount called, connected?: #{connected?(socket)}, user_id: #{user_id}")
    IO.puts("Socket assigns: #{inspect(socket.assigns)}")

    if connected?(socket) do
      IO.puts("Socket is connected, setting up subscriptions...")
      PubSub.subscribe(Streampai.PubSub, @cursor_topic)

      # Start cleanup timer
      Process.send_after(self(), :cleanup_cursors, 10_000)

      # Broadcast that this user joined - send current count request
      PubSub.broadcast(Streampai.PubSub, @cursor_topic, {:user_joined, user_id})
      PubSub.broadcast(Streampai.PubSub, @cursor_topic, {:request_user_count, user_id})

      {:ok,
       assign(socket,
         user_id: user_id,
         cursors: %{},
         online_users: 1,
         connected_users: MapSet.new([user_id]),
         connected: true
       )}
    else
      IO.puts("Initial server render, user_id: #{user_id}")

      {:ok,
       assign(socket,
         user_id: user_id,
         cursors: %{},
         online_users: 0,
         connected_users: MapSet.new(),
         connected: false
       )}
    end
  end

  def terminate(_reason, socket) do
    if socket.assigns.user_id && socket.assigns.user_id != "disconnected" do
      # Broadcast that this user left
      PubSub.broadcast(Streampai.PubSub, @cursor_topic, {:user_left, socket.assigns.user_id})
    end

    :ok
  end

  def handle_event("cursor_move", %{"x" => x, "y" => y}, socket) do
    user_id = socket.assigns.user_id
    IO.puts("Cursor move from #{user_id}: #{x}, #{y}")

    # Broadcast cursor position to all other users
    PubSub.broadcast(Streampai.PubSub, @cursor_topic, {:cursor_update, user_id, x, y})

    {:noreply, socket}
  end

  def handle_info({:cursor_update, user_id, x, y}, socket) do
    # Don't update our own cursor position
    if user_id == socket.assigns.user_id do
      {:noreply, socket}
    else
      IO.puts("Received cursor update from #{user_id}: #{x}, #{y}")

      cursors =
        Map.put(socket.assigns.cursors, user_id, %{
          x: x,
          y: y,
          last_seen: System.system_time(:millisecond)
        })

      {:noreply, assign(socket, cursors: cursors)}
    end
  end

  def handle_info({:user_joined, user_id}, socket) do
    IO.puts("User #{user_id} joined, current user: #{socket.assigns.user_id}")
    # Add the new user to our connected users set
    connected_users = MapSet.put(socket.assigns.connected_users, user_id)
    online_users = MapSet.size(connected_users)
    IO.puts("Online users now: #{online_users}")
    {:noreply, assign(socket, connected_users: connected_users, online_users: online_users)}
  end

  def handle_info({:user_left, user_id}, socket) do
    # Remove user's cursor and update count
    cursors = Map.delete(socket.assigns.cursors, user_id)
    connected_users = MapSet.delete(socket.assigns.connected_users, user_id)
    online_users = MapSet.size(connected_users)

    {:noreply,
     assign(socket,
       cursors: cursors,
       connected_users: connected_users,
       online_users: online_users
     )}
  end

  def handle_info({:request_user_count, requesting_user_id}, socket) do
    # Respond with our current user list to help sync counts
    if requesting_user_id != socket.assigns.user_id do
      current_users = MapSet.to_list(socket.assigns.connected_users)

      PubSub.broadcast(
        Streampai.PubSub,
        @cursor_topic,
        {:user_count_response, socket.assigns.user_id, current_users}
      )
    end

    {:noreply, socket}
  end

  def handle_info({:user_count_response, responding_user_id, their_user_list}, socket) do
    # Merge their user list with ours to get accurate count
    if responding_user_id == socket.assigns.user_id do
      {:noreply, socket}
    else
      their_users = MapSet.new(their_user_list)
      combined_users = MapSet.union(socket.assigns.connected_users, their_users)
      online_users = MapSet.size(combined_users)
      IO.puts("Updated user count from #{responding_user_id}: #{online_users}")
      {:noreply, assign(socket, connected_users: combined_users, online_users: online_users)}
    end
  end

  # Cleanup old cursor positions every 5 seconds
  def handle_info(:cleanup_cursors, socket) do
    current_time = System.system_time(:millisecond)
    # Increase to 10 seconds to reduce cleanup frequency
    timeout = 10_000

    cursors =
      socket.assigns.cursors
      |> Enum.filter(fn {_user_id, cursor} ->
        current_time - cursor.last_seen < timeout
      end)
      |> Map.new()

    # Schedule next cleanup
    Process.send_after(self(), :cleanup_cursors, timeout)
    {:noreply, assign(socket, cursors: cursors)}
  end

  defp generate_user_id do
    8 |> :crypto.strong_rand_bytes() |> Base.encode64() |> String.slice(0, 8)
  end

  def render(assigns) do
    ~H"""
    <div
      id="cursor-container"
      class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden"
      phx-hook="CursorTracker"
    >
      <!-- Header -->
      <div class="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div class="max-w-6xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Shared Cursor Playground</h1>
              <p class="text-sm text-gray-600">
                Move your cursor around to see others' positions in real-time
              </p>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">
                Online Users: <span class="text-blue-600">{@online_users}</span>
              </div>
              <div class="text-xs text-gray-500">
                Your ID: <code class="bg-gray-100 px-1 rounded">{@user_id}</code>
                <%= if @connected do %>
                  <span class="ml-2 text-green-600">● Connected</span>
                <% else %>
                  <span class="ml-2 text-red-600">● Connecting...</span>
                <% end %>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Content Area -->
      <div class="pt-24 pb-12 px-6">
        <div class="max-w-6xl mx-auto">
          <!-- Demo Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div class="w-12 h-12 bg-blue-500 rounded-lg mb-4"></div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Real-time Cursors</h3>
              <p class="text-gray-600">
                See other users' cursor positions update live as they move around the page.
              </p>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div class="w-12 h-12 bg-green-500 rounded-lg mb-4"></div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Phoenix LiveView</h3>
              <p class="text-gray-600">
                Powered by Phoenix PubSub for instant real-time communication.
              </p>
            </div>

            <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
              <div class="w-12 h-12 bg-purple-500 rounded-lg mb-4"></div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Collaborative</h3>
              <p class="text-gray-600">Open this page in multiple tabs or share with friends!</p>
            </div>
          </div>
          <!-- Large Interactive Area -->
          <div class="bg-white/50 rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div class="max-w-md mx-auto">
              <div class="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-4 animate-pulse"></div>
              <h2 class="text-xl font-semibold text-gray-700 mb-2">Move Your Cursor Here</h2>
              <p class="text-gray-500">
                This is a large area perfect for seeing cursor movements. Try hovering around!
              </p>
            </div>
          </div>
        </div>
      </div>
      <!-- Other Users' Cursors -->
      <%= for {user_id, cursor} <- @cursors do %>
        <div
          class="absolute pointer-events-none z-20 transition-all duration-75 ease-out"
          style={"left: #{cursor.x}px; top: #{cursor.y}px;"}
        >
          <!-- Cursor pointer -->
          <svg width="16" height="16" viewBox="0 0 16 16" class="text-red-500 drop-shadow-lg">
            <path fill="currentColor" d="M0 0l6 11 2-5 5-2z" />
          </svg>
          <!-- User ID label -->
          <div class="absolute top-5 left-5 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap shadow-lg">
            {user_id} ({cursor.x},{cursor.y})
          </div>
        </div>
      <% end %>
      <!-- Instructions -->
      <div class="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-sm">
        <h4 class="font-semibold mb-2">How it works:</h4>
        <ul class="text-sm space-y-1">
          <li>• Your cursor position is tracked in real-time</li>
          <li>• Other users see your red cursor pointer</li>
          <li>• Open multiple tabs to test it yourself!</li>
          <li>• Cursors disappear after 5 seconds of inactivity</li>
        </ul>
      </div>
    </div>
    """
  end
end
