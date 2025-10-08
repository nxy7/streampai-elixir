defmodule Streampai.Storage.SizeLimits do
  @moduledoc """
  Configuration for file size limits by file type.
  """

  @limits %{
    avatar: 5_000_000,
    # 5MB
    thumbnail: 2_000_000,
    # 2MB
    video: 100_000_000,
    # 100MB
    other: 10_000_000
    # 10MB
  }

  @doc """
  Get the maximum allowed size for a file type.

  ## Examples

      iex> SizeLimits.max_size(:avatar)
      5_000_000

      iex> SizeLimits.max_size(:thumbnail)
      2_000_000

      iex> SizeLimits.max_size(:unknown)
      10_000_000
  """
  def max_size(file_type) when is_atom(file_type) do
    Map.get(@limits, file_type, @limits.other)
  end

  @doc """
  Validate that a file size is within limits for its type.

  Returns `:ok` if valid, `{:error, message}` if too large.

  ## Examples

      iex> SizeLimits.validate_size(:avatar, 1_000_000)
      :ok

      iex> SizeLimits.validate_size(:avatar, 10_000_000)
      {:error, "File size 10000000 bytes exceeds maximum 5000000 bytes for avatar"}
  """
  def validate_size(file_type, size) when is_atom(file_type) and is_integer(size) do
    max = max_size(file_type)

    if size <= max do
      :ok
    else
      {:error, "File size #{size} bytes exceeds maximum #{max} bytes for #{file_type}"}
    end
  end

  @doc """
  Format file size in human-readable format.

  ## Examples

      iex> SizeLimits.format_size(1024)
      "1.0 KB"

      iex> SizeLimits.format_size(5_000_000)
      "4.8 MB"
  """
  def format_size(bytes) when is_integer(bytes) do
    cond do
      bytes >= 1_073_741_824 -> "#{Float.round(bytes / 1_073_741_824, 1)} GB"
      bytes >= 1_048_576 -> "#{Float.round(bytes / 1_048_576, 1)} MB"
      bytes >= 1024 -> "#{Float.round(bytes / 1024, 1)} KB"
      true -> "#{bytes} bytes"
    end
  end
end
