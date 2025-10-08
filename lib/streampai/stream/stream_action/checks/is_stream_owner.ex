defmodule Streampai.Stream.StreamAction.Checks.IsStreamOwner do
  @moduledoc """
  Policy check to verify the actor is the owner of the stream.

  Checks if the actor's ID matches the user_id argument.
  """
  use Ash.Policy.SimpleCheck

  @impl true
  def describe(_opts), do: "actor is the stream owner"

  @impl true
  def match?(actor, %{action_input: %{arguments: %{user_id: stream_owner_id}}}, _opts) do
    actor.id == stream_owner_id
  end

  def match?(actor, %{arguments: %{user_id: stream_owner_id}}, _opts) do
    actor.id == stream_owner_id
  end

  def match?(_actor, _context, _opts), do: false
end
