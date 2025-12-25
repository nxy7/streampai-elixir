defmodule StreampaiWeb.PresenceChannel do
  @moduledoc """
  Phoenix Channel for real-time presence tracking.

  Supports multiple presence topics:
  - "presence:lobby" - Global user presence (who's online)
  - "presence:stream:<stream_id>" - Stream-specific presence (who's watching)
  """
  use Phoenix.Channel

  alias StreampaiWeb.Presence

  @impl true
  def join("presence:lobby", _params, socket) do
    send(self(), :after_join)
    {:ok, socket}
  end

  def join("presence:stream:" <> stream_id, _params, socket) do
    send(self(), {:after_join_stream, stream_id})
    {:ok, assign(socket, :stream_id, stream_id)}
  end

  @impl true
  def handle_info(:after_join, socket) do
    # Track the user in presence
    if user = socket.assigns[:current_user] do
      {:ok, _} =
        Presence.track(socket, user.id, %{
          name: user.name,
          avatar: user.avatar_url,
          online_at: System.system_time(:second)
        })
    end

    # Push current presence state to the joining client
    push(socket, "presence_state", Presence.list(socket))

    {:noreply, socket}
  end

  def handle_info({:after_join_stream, stream_id}, socket) do
    user = socket.assigns[:current_user]

    # Track viewer in stream-specific presence
    user_id = if user, do: user.id, else: socket.id

    {:ok, _} =
      Presence.track(socket, user_id, %{
        name: if(user, do: user.name, else: "Anonymous"),
        avatar: if(user, do: user.avatar_url, else: nil),
        stream_id: stream_id,
        joined_at: System.system_time(:second)
      })

    # Push current presence state
    push(socket, "presence_state", Presence.list(socket))

    {:noreply, socket}
  end

  @impl true
  def handle_in("get_presence", _params, socket) do
    {:reply, {:ok, Presence.list(socket)}, socket}
  end
end
