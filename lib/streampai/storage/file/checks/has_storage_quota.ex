defmodule Streampai.Storage.File.Checks.HasStorageQuota do
  @moduledoc """
  Authorization check that verifies user has sufficient storage quota.

  Checks if user's current storage + estimated file size would exceed their quota.
  Free users get 1GB, Pro users get 10GB.
  """

  use Ash.Policy.Check

  def describe(_opts) do
    "User has sufficient storage quota"
  end

  def match?(_actor, _opts, _context) do
    true
  end

  def strict_check(actor, %{changeset: changeset}, _opts) do
    estimated_size = changeset.context[:estimated_size] || 0

    # Load user with storage calculations
    user = Ash.load!(actor, [:total_files_size, :storage_quota, :tier])

    current_usage = user.total_files_size || 0
    quota = user.storage_quota
    new_total = current_usage + estimated_size

    if new_total <= quota do
      {:ok, true}
    else
      {:error,
       Ash.Error.Forbidden.exception(
         message:
           "Storage quota exceeded. Using #{format_size(current_usage)} of #{format_size(quota)}. " <>
             "File would require #{format_size(new_total)} total. " <>
             "#{if user.tier == :free, do: "Upgrade to Pro for 10GB storage.", else: ""}",
         facts: %{
           current_usage: current_usage,
           quota: quota,
           estimated_size: estimated_size,
           tier: user.tier
         }
       )}
    end
  end

  defp format_size(bytes) when is_integer(bytes) do
    Streampai.Storage.SizeLimits.format_size(bytes)
  end

  defp format_size(_), do: "0 bytes"
end
