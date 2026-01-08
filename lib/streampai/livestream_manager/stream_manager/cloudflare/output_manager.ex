defmodule Streampai.LivestreamManager.StreamManager.Cloudflare.OutputManager do
  @moduledoc """
  Cleans up Cloudflare live outputs on stream stop / process termination.

  Platform managers create and manage their own outputs directly.
  This module only handles bulk cleanup (e.g. deleting all leftover outputs
  from a live input).
  """

  alias Streampai.Cloudflare.APIClient

  require Logger

  def cleanup_all(state) do
    case get_input_id(state) do
      nil -> :ok
      input_id -> fetch_and_delete_all(input_id)
    end
  end

  defp fetch_and_delete_all(input_id) do
    case APIClient.list_live_outputs(input_id) do
      {:ok, outputs} when is_list(outputs) ->
        Enum.each(outputs, fn output ->
          output_id = Map.get(output, "uid")

          if output_id do
            case APIClient.delete_live_output(input_id, output_id) do
              :ok ->
                Logger.info("Deleted leftover output: #{output_id}")

              {:error, _error_type, message} ->
                Logger.warning("Failed to delete output #{output_id}: #{message}")
            end
          end
        end)

      {:ok, _} ->
        :ok

      {:error, _error_type, message} ->
        Logger.error("Failed to fetch outputs for cleanup: #{message}")
    end
  end

  defp get_input_id(%{horizontal_input: %{input_id: id}}) when is_binary(id), do: id
  defp get_input_id(_), do: nil
end
