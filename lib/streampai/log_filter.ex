defmodule Streampai.LogFilter do
  @moduledoc false

  # Filters out noisy log messages from Electric's replication manager
  # that fire every 60s even when nothing changes.
  def filter_electric_noise(%{msg: {:string, msg}}, _extra) do
    if noisy_electric_message?(msg), do: :stop, else: :ignore
  end

  def filter_electric_noise(%{msg: {:report, %{message: msg}}}, _extra) when is_binary(msg) do
    if noisy_electric_message?(msg), do: :stop, else: :ignore
  end

  def filter_electric_noise(_log_event, _extra), do: :ignore

  defp noisy_electric_message?(msg) do
    msg = IO.iodata_to_binary(msg)

    String.contains?(msg, "Configuring publication") and
      String.contains?(msg, "to drop [] tables, and add [] tables")
  end
end
