defmodule Streampai.Accounts.User.Calculations.DisplayAvatar do
  @moduledoc """
  Calculates the user's display avatar URL.

  Priority:
  1. If user has uploaded avatar (avatar_file), return S3 URL
  2. Otherwise, return OAuth provider avatar from extra_data["picture"]
  """

  use Ash.Resource.Calculation

  @impl true
  def load(_query, _opts, _context) do
    [:extra_data, avatar_file: [:storage_key]]
  end

  @impl true
  def calculate(records, _opts, _context) do
    Enum.map(records, fn record ->
      cond do
        not is_nil(record.avatar_file) ->
          Streampai.Storage.Adapters.S3.get_url(record.avatar_file.storage_key)

        is_map(record.extra_data) and is_binary(record.extra_data["picture"]) ->
          record.extra_data["picture"]

        true ->
          nil
      end
    end)
  end
end
