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
    if user = socket.assigns[:current_user] do
      track_user(socket, user.id, user.name, user.avatar_url, online_at: System.system_time(:second))
    end

    push_presence_state(socket)
  end

  def handle_info({:after_join_stream, stream_id}, socket) do
    user = socket.assigns[:current_user]
    {user_id, name, avatar} = user_or_anonymous(user, socket.id)

    track_user(socket, user_id, name, avatar,
      stream_id: stream_id,
      joined_at: System.system_time(:second)
    )

    push_presence_state(socket)
  end

  @impl true
  def handle_in("get_presence", _params, socket) do
    {:reply, {:ok, Presence.list(socket)}, socket}
  end

  # Private helpers

  defp user_or_anonymous(nil, socket_id), do: {socket_id, "Anonymous", nil}
  defp user_or_anonymous(user, _socket_id), do: {user.id, user.name, user.avatar_url}

  defp track_user(socket, user_id, name, avatar, extra_meta) do
    meta = Map.merge(%{name: name, avatar: avatar}, Map.new(extra_meta))
    {:ok, _} = Presence.track(socket, user_id, meta)
  end

  defp push_presence_state(socket) do
    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end
end
