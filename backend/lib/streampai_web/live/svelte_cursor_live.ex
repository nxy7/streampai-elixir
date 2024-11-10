defmodule StreampaiWeb.SvelteCursorLive do
  use StreampaiWeb, :live_view
  import LiveSvelte
  alias Phoenix.PubSub

  @cursor_topic "svelte_cursor_positions"

  def mount(_params, _session, socket) do
    # Generate user ID immediately for both connected and disconnected states
    user_id = generate_user_id()
    IO.puts("Svelte Mount called, connected?: #{connected?(socket)}, user_id: #{user_id}")

    if connected?(socket) do
      IO.puts("Svelte Socket is connected, setting up subscriptions...")
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
      IO.puts("Svelte Initial server render, user_id: #{user_id}")

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
    IO.puts("Svelte Cursor move from #{user_id}: #{x}, #{y}")

    # Broadcast cursor position to all other users
    PubSub.broadcast(Streampai.PubSub, @cursor_topic, {:cursor_update, user_id, x, y})

    {:noreply, socket}
  end

  def handle_info({:cursor_update, user_id, x, y}, socket) do
    # Don't update our own cursor position
    if user_id != socket.assigns.user_id do
      IO.puts("Svelte Received cursor update from #{user_id}: #{x}, #{y}")

      cursors =
        Map.put(socket.assigns.cursors, user_id, %{
          x: x,
          y: y,
          last_seen: System.system_time(:millisecond)
        })

      {:noreply, assign(socket, cursors: cursors)}
    else
      {:noreply, socket}
    end
  end

  def handle_info({:user_joined, user_id}, socket) do
    IO.puts("Svelte User #{user_id} joined, current user: #{socket.assigns.user_id}")
    # Add the new user to our connected users set
    connected_users = MapSet.put(socket.assigns.connected_users, user_id)
    online_users = MapSet.size(connected_users)
    IO.puts("Svelte Online users now: #{online_users}")
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
    if responding_user_id != socket.assigns.user_id do
      their_users = MapSet.new(their_user_list)
      combined_users = MapSet.union(socket.assigns.connected_users, their_users)
      online_users = MapSet.size(combined_users)
      IO.puts("Svelte Updated user count from #{responding_user_id}: #{online_users}")
      {:noreply, assign(socket, connected_users: combined_users, online_users: online_users)}
    else
      {:noreply, socket}
    end
  end

  # Cleanup old cursor positions
  def handle_info(:cleanup_cursors, socket) do
    current_time = System.system_time(:millisecond)
    # 10 seconds
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
    :crypto.strong_rand_bytes(8) |> Base.encode64() |> String.slice(0, 8)
  end

  def render(assigns) do
    ~H"""
    <div>
      <h1>Debug: LiveSvelte Test</h1>
      <p>User ID: <%= @user_id %></p>
      <p>Online Users: <%= @online_users %></p>
      <p>Connected: <%= @connected %></p>

      <.svelte
        name="CursorTracker"
        props={
          %{
            user_id: @user_id,
            online_users: @online_users,
            connected: @connected,
            cursors: @cursors
          }
        }
      />
    </div>
    """
  end
end
