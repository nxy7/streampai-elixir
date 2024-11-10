defmodule Streampai.ButtonServer do
  @moduledoc """
  GenServer for handling button interactions and tracking presence.
  """
  use GenServer
  alias StreampaiWeb.Presence

  def start_link(_) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @impl true
  def init(state) do
    Phoenix.PubSub.subscribe(Streampai.PubSub, "button:*")
    {:ok, state}
  end

  def get_count(button_id) do
    GenServer.call(__MODULE__, {:get_count, button_id})
  end

  @impl true
  def handle_call({:get_count, button_id}, _from, state) do
    count = Map.get(state, button_id, 0)
    {:reply, count, state}
  end

  def increment(button_id) do
    GenServer.cast(__MODULE__, {:increment, button_id})
  end

  @impl true
  def handle_cast({:increment, button_id}, state) do
    new_count = Map.get(state, button_id, 0) + 1
    Phoenix.PubSub.broadcast(Streampai.PubSub, "button:#{button_id}", {:count_updated, new_count})
    {:noreply, Map.put(state, button_id, new_count)}
  end

  @impl true
  def handle_info(%{event: "presence_diff", topic: topic} = _event, state) do
    new_state = handle_leaves(topic, state)
    {:noreply, new_state}
  end

  defp handle_leaves(topic, state) do
    viewers_amount =
      Presence.list(topic)
      |> map_size()

    if viewers_amount == 0 do
      button_id =
        topic
        |> String.split(":")
        |> List.last()

      Map.delete(state, button_id)
    else
      state
    end
  end
end
