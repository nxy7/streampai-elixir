defmodule StreampaiWeb.ButtonLive do
  use Phoenix.LiveView
  alias Streampai.ButtonServer
  alias StreampaiWeb.Presence

  @impl true
  def mount(%{"id" => id}, _session, socket) do
    if connected?(socket) do
      topic = "button:#{id}"
      Streampai.PubSub |> Phoenix.PubSub.subscribe(topic)

      Phoenix.PubSub.subscribe(Streampai.PubSub, topic)

      Presence.track(
        self(),
        topic,
        socket.id,
        %{
          joined_at: System.system_time(:second)
        }
      )
    end

    count = ButtonServer.get_count(id)
    dmg = Streampai.Double.value()

    {:ok,
     assign(socket, count: count, amnt: get_presence_count("presence_diff") + 1, id: id, dmg: dmg)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h2>Button {@id}</h2>
      <p>Count: {@count}</p>
      <button phx-click="increment">Increment</button>
    </div>

    <div phx-click="dbl">
      dable: {@dmg}
    </div>

    <div>
      User Amount: {@amnt}
    </div>
    """
  end

  def handle_event("increment", _params, socket) do
    ButtonServer.increment(socket.assigns.id)
    _z = Ash.Query.for_read(Streampai.Accounts.StreamingAccount, :read)
    {:noreply, socket}
  end

  @impl true
  def handle_event("dbl", _params, socket) do
    IO.puts("doubling")
    Streampai.Double.double()
    {:noreply, socket}
  end

  @impl true
  def handle_info({:count_updated, new_count}, socket) do
    {:noreply, assign(socket, count: new_count)}
  end

  @impl true
  def handle_info(%{event: "presence_diff", topic: topic}, socket) do
    new_socket = assign(socket, :amnt, get_presence_count(topic))
    {:noreply, new_socket}
  end

  defp get_presence_count(topic) do
    Presence.list(topic)
    |> map_size()
  end
end
