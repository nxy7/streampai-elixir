defmodule Streampai.Cloudflare.LiveInput.Preparations.GetOrFetch do
  @moduledoc """
  Preparation for getting or fetching live input with 6-hour refresh logic.
  """
  use Ash.Resource.Preparation

  alias Streampai.Cloudflare.APIClient
  alias Streampai.Cloudflare.LiveInput

  def prepare(query, _opts, _context) do
    Ash.Query.after_action(query, fn _query, _results ->
      user_id = Ash.Query.get_argument(query, :user_id)
      orientation = Ash.Query.get_argument(query, :orientation)
      handle_live_input_for_user(user_id, orientation)
    end)
  end

  defp handle_live_input_for_user(user_id, orientation) do
    # Query LiveInput directly without using the preparation to avoid infinite recursion
    case LiveInput
         |> Ash.Query.filter(user_id == ^user_id and orientation == ^orientation)
         |> Ash.read(actor: %{id: user_id}) do
      {:ok, [live_input]} -> handle_existing_live_input(live_input, user_id, orientation)
      {:ok, []} -> create_from_api(user_id, orientation)
      error -> error
    end
  end

  defp handle_existing_live_input(live_input, user_id, orientation) do
    six_hours_ago = DateTime.add(DateTime.utc_now(), -6, :hour)

    if DateTime.after?(live_input.updated_at, six_hours_ago) do
      # Data is fresh
      {:ok, live_input}
    else
      # Data is stale, refresh from API
      refresh_from_api(live_input, user_id, orientation)
    end
  end

  defp refresh_from_api(live_input, user_id, orientation) do
    case live_input.data do
      %{"uid" => cloudflare_id} ->
        # We have a Cloudflare ID, try to get updated data
        case APIClient.get_live_input(cloudflare_id) do
          {:ok, fresh_data} ->
            live_input
            |> Ash.Changeset.for_update(:update, %{data: fresh_data})
            |> Ash.update(actor: %{id: user_id})

          {:error, _error_type, _message} ->
            # If get fails, create a new one
            create_from_api(user_id, orientation)
        end

      _ ->
        # No Cloudflare ID in data, create new
        create_from_api(user_id, orientation)
    end
  end

  defp create_from_api(user_id, orientation) do
    input_name = build_input_name(user_id, orientation)
    {:ok, cloudflare_data} = APIClient.create_live_input(input_name)
    create_or_update_record(user_id, orientation, cloudflare_data)
  end

  defp build_input_name(user_id, :vertical), do: "#{user_id} - vertical"
  defp build_input_name(user_id, :horizontal), do: user_id

  defp create_or_update_record(user_id, orientation, cloudflare_data) do
    case create_new_record(user_id, orientation, cloudflare_data) do
      {:ok, live_input} ->
        {:ok, live_input}

      {:error,
       %Ash.Error.Invalid{
         errors: [%Ash.Error.Changes.InvalidAttribute{message: "has already been taken"}]
       }} ->
        update_existing_record(user_id, orientation, cloudflare_data)

      error ->
        error
    end
  end

  defp create_new_record(user_id, orientation, cloudflare_data) do
    LiveInput
    |> Ash.Changeset.for_create(:create, %{
      user_id: user_id,
      orientation: orientation,
      data: cloudflare_data
    })
    |> Ash.create(actor: %{id: user_id})
  end

  defp update_existing_record(user_id, orientation, cloudflare_data) do
    {:ok, existing_record} = get_existing_record(user_id, orientation)

    existing_record
    |> Ash.Changeset.for_update(:update, %{data: cloudflare_data})
    |> Ash.update(actor: %{id: user_id})
  end

  defp get_existing_record(user_id, orientation) do
    LiveInput
    |> Ash.Query.filter(user_id == ^user_id and orientation == ^orientation)
    |> Ash.read_one(actor: %{id: user_id})
  end
end
