defmodule Streampai.Stream.StreamAction.Checks.IsStreamOwnerOrModerator do
  @moduledoc """
  Policy check to verify the actor is either the stream owner or a moderator.

  Checks:
  1. If the actor's ID matches the user_id argument (owner)
  2. If the actor has an accepted moderator role for the stream owner
  """
  use Ash.Policy.SimpleCheck

  alias Streampai.Accounts.UserRole

  @impl true
  def describe(_opts), do: "actor is the stream owner or has moderator role"

  @impl true
  def match?(actor, %{action_input: %{arguments: %{user_id: stream_owner_id}}}, _opts) do
    check_owner_or_moderator(actor, stream_owner_id)
  end

  def match?(actor, %{arguments: %{user_id: stream_owner_id}}, _opts) do
    check_owner_or_moderator(actor, stream_owner_id)
  end

  def match?(_actor, _context, _opts), do: false

  defp check_owner_or_moderator(actor, stream_owner_id) do
    cond do
      # Actor is the stream owner
      actor.id == stream_owner_id ->
        true

      # Actor is a moderator for this user
      moderator?(actor, stream_owner_id) ->
        true

      true ->
        false
    end
  end

  defp moderator?(actor, stream_owner_id) do
    require Ash.Query

    # Check if actor is a moderator for the stream owner
    # The actor should be the one who was GRANTED the moderator role (user_id in UserRole)
    # The stream_owner should be the one who GRANTED the role (granter_id in UserRole)
    case UserRole
         |> Ash.Query.filter(
           user_id == ^actor.id and
             granter_id == ^stream_owner_id and
             role_type == :moderator and
             role_status == :accepted and
             is_nil(revoked_at)
         )
         |> Ash.read(authorize?: false) do
      {:ok, [_ | _]} -> true
      _ -> false
    end
  end
end
