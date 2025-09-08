defmodule Streampai.Cloudflare.LiveInput.Preparations.GetOrFetch do
  @moduledoc """
  Preparation for getting or fetching live input with 6-hour refresh logic.
  """
  use Ash.Resource.Preparation

  def prepare(query, _opts, _context) do
    Ash.Query.after_action(query, fn _query, _results ->
      user_id = Ash.Query.get_argument(query, :user_id)

      case Streampai.Cloudflare.LiveInput.get_or_fetch_for_user(user_id) do
        {:ok, [live_input]} ->
          six_hours_ago = DateTime.utc_now() |> DateTime.add(-6, :hour)

          if DateTime.compare(live_input.updated_at, six_hours_ago) == :gt do
            # Data is fresh
            {:ok, live_input}
          else
            # Data is stale, refresh from API
            refresh_from_api(live_input, user_id)
          end

        {:ok, []} ->
          # No existing record, create new
          create_from_api(user_id)

        error ->
          error
      end
    end)
  end

  defp refresh_from_api(live_input, user_id) do
    case live_input.data do
      %{"uid" => cloudflare_id} ->
        # We have a Cloudflare ID, try to get updated data
        case Streampai.Cloudflare.APIClient.get_live_input(cloudflare_id) do
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
    case Streampai.Cloudflare.APIClient.create_live_input(user_id) do
      {:ok, cloudflare_data} ->
        Ash.Changeset.for_create(Streampai.Cloudflare.LiveInput, :create, %{
          user_id: user_id,
          data: cloudflare_data
        })
        |> Ash.create()

      error ->
        error
    end
  end
end
