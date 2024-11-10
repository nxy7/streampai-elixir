defmodule Streampai.Double do
  use Agent

  def start_link(_initial_values) do
    Agent.start_link(fn -> 1 end, name: __MODULE__)
  end

  def value do
    Agent.get(__MODULE__, & &1)
  end

  def double do
    Agent.update(__MODULE__, &(&1 * 2))
  end
end
