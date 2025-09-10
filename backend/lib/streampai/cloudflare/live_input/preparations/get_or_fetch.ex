defmodule LiveInput.Preparations.GetOrFetch do
  @moduledoc """
  Preparation for getting or fetching live input with 6-hour refresh logic.
  """
  use Ash.Resource.Preparation

  alias Streampai.Cloudflare.APIClient
  alias Streampai.Cloudflare.LiveInput

  def prepare(query, _opts, _context) do
    Ash.Query.after_action(query, fn _query, _results ->
      user_id = Ash.Query.get_argument(query, :user_id)
      handle_live_input_for_user(user_id)
    end)
  end

  defp handle_live_input_for_user(user_id) do
    case LiveInput.get_or_fetch_for_user(user_id) do
      {:ok, [live_input]} -> handle_existing_live_input(live_input, user_id)
      {:ok, []} -> create_from_api(user_id)
      error -> error
    end
  end

  defp handle_existing_live_input(live_input, user_id) do
    six_hours_ago = DateTime.add(DateTime.utc_now(), -6, :hour)

    if DateTime.after?(live_input.updated_at, six_hours_ago) do
      # Data is fresh
      {:ok, live_input}
    else
      # Data is stale, refresh from API
      refresh_from_api(live_input, user_id)
    end
  end

  defp refresh_from_api(live_input, user_id) do
    case live_input.data do
      %{"uid" => cloudflare_id} ->
        # We have a Cloudflare ID, try to get updated data
        case APIClient.get_live_input(cloudflare_id) do
          {:ok, fresh_data} ->
            live_input
            |> Ash.Changeset.for_update(:update, %{data: fresh_data})
            |> Ash.update()

          {:error, _error_type, _message} ->
            # If get fails, create a new one
            create_from_api(user_id)
        end

      _ ->
        # No Cloudflare ID in data, create new
        create_from_api(user_id)
    end
  end

  defp create_from_api(user_id) do
    case APIClient.create_live_input(user_id) do
      {:ok, cloudflare_data} ->
        LiveInput
        |> Ash.Changeset.for_create(:create, %{
          user_id: user_id,
          data: cloudflare_data
        })
        |> Ash.create()

      error ->
        error
    end
  end
end
