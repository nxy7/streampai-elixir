defmodule Streampai.Stream.Livestream.Validations.ValidateNotEnded do
  @moduledoc """
  Validates that a livestream has not already been ended.
  This checks the ORIGINAL database value, not the changeset value.
  """
  use Ash.Resource.Validation

  @impl true
  def validate(changeset, _opts, _context) do
    # Get the original record from the changeset
    case Ash.Changeset.get_data(changeset, :ended_at) do
      nil ->
        :ok

      ended_at when is_struct(ended_at, DateTime) ->
        {:error, field: :ended_at, message: "Livestream has already ended at #{DateTime.to_iso8601(ended_at)}"}

      _other ->
        {:error, field: :ended_at, message: "Livestream has already ended"}
    end
  end
end
