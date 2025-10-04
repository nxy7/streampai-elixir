defmodule Streampai.Stream.Calculations.MessagesAmount do
  @moduledoc """
  Calculates the total number of chat messages for a livestream.
  """
  use Ash.Resource.Calculation

  @impl true
  def load(_query, _opts, _context) do
    [:chat_messages]
  end

  @impl true
  def calculate(records, _opts, _context) do
    {:ok,
     Enum.map(records, fn record ->
       messages = Map.get(record, :chat_messages, []) || []

       case messages do
         [] -> 0
         messages when is_list(messages) -> length(messages)
       end
     end)}
  end
end
