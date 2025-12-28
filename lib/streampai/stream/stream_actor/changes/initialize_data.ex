defmodule Streampai.Stream.StreamActor.Changes.InitializeData do
  @moduledoc """
  Initializes the data JSONB attribute with default values for a StreamActor.

  Used for create actions to set up the initial state structure.

  ## Options

  - `:set_user_id` - When true, also sets the user_id from the :user_id argument (default: false)

  ## Usage

      change {InitializeData, set_user_id: true}
  """
  use Ash.Resource.Change

  @impl true
  def change(changeset, opts, _context) do
    status = Ash.Changeset.get_argument(changeset, :status) || :idle
    status_message = Ash.Changeset.get_argument(changeset, :status_message)

    changeset =
      if Keyword.get(opts, :set_user_id, false) do
        user_id = Ash.Changeset.get_argument(changeset, :user_id)
        Ash.Changeset.change_attribute(changeset, :user_id, user_id)
      else
        changeset
      end

    data = build_initial_data(status, status_message)
    Ash.Changeset.change_attribute(changeset, :data, data)
  end

  @doc """
  Builds the initial data map for a StreamActor.

  ## Examples

      iex> build_initial_data(:idle, nil)
      %{
        "status" => "idle",
        "status_message" => nil,
        "viewers" => %{},
        "total_viewers" => 0,
        "platforms" => %{},
        "input_streaming" => false,
        "last_updated_at" => "2024-..."
      }
  """
  def build_initial_data(status, status_message) do
    %{
      "status" => to_string(status),
      "status_message" => status_message,
      "viewers" => %{},
      "total_viewers" => 0,
      "platforms" => %{},
      "input_streaming" => false,
      "last_updated_at" => DateTime.to_iso8601(DateTime.utc_now())
    }
  end
end
