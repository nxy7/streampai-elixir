defmodule Streampai.Repo do
  use AshPostgres.Repo,
    otp_app: :streampai

  def installed_extensions do
    ["ash-functions", "citext", AshMoney.AshPostgresExtension]
  end

  def prefer_transaction? do
    false
  end

  def min_pg_version do
    %Version{major: 16, minor: 0, patch: 0}
  end
end
