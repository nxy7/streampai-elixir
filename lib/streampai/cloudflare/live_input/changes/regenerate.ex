defmodule Streampai.Cloudflare.LiveInput.Changes.Regenerate do
  @moduledoc """
  Change that regenerates a live input by deleting the old Cloudflare input
  and creating a new one with a new stream key.
  """
  use Ash.Resource.Change

  alias Streampai.Cloudflare.APIClient

  @impl true
  def change(changeset, _opts, _context) do
    Ash.Changeset.before_action(changeset, fn changeset ->
      live_input = changeset.data
      user_id = live_input.user_id
      orientation = live_input.orientation

      # Delete old Cloudflare input if exists
      case live_input.data do
        %{"uid" => cloudflare_id} ->
          APIClient.delete_live_input(cloudflare_id)

        _ ->
          :ok
      end

      # Create new Cloudflare input
      input_name = build_input_name(user_id, orientation)

      case APIClient.create_live_input(input_name) do
        {:ok, cloudflare_data} ->
          Ash.Changeset.force_change_attribute(changeset, :data, cloudflare_data)

        {:error, _type, message} ->
          Ash.Changeset.add_error(changeset, message)
      end
    end)
  end

  defp build_input_name(user_id, :vertical), do: "#{user_id} - vertical"
  defp build_input_name(user_id, :horizontal), do: user_id
  defp build_input_name(user_id, orientation), do: "#{user_id} - #{orientation}"
end
