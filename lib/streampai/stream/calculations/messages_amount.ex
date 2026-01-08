defmodule Streampai.Stream.Calculations.MessagesAmount do
  @moduledoc """
  Calculates the total number of chat messages for a livestream.
  """
  use Ash.Resource.Calculation

  @impl true
  def load(_query, _opts, _context) do
    [:stream_events]
  end

  @impl true
  def calculate(records, _opts, _context) do
    {:ok,
     Enum.map(records, fn record ->
       events = Map.get(record, :stream_events, []) || []

       Enum.count(events, fn event -> event.type == :chat_message end)
     end)}
  end
end
