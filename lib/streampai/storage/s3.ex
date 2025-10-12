defmodule Streampai.Storage.S3 do
  @moduledoc """
  S3 storage operations using ExAws.

  Handles file uploads, checks, and URL generation for S3 storage.
  """

  require Logger

  @doc """
  Checks if a file exists in S3.

  ## Examples

      iex> S3.file_exists?("tts/alloy_abc123.mp3")
      {:ok, true}

      iex> S3.file_exists?("tts/nonexistent.mp3")
      {:ok, false}
  """
  def file_exists?(path) do
    bucket = get_bucket()

    case bucket |> ExAws.S3.head_object(path) |> ExAws.request() do
      {:ok, _} -> {:ok, true}
      {:error, {:http_error, 404, _}} -> {:ok, false}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Uploads a file to S3.

  ## Options

    * `:content_type` - MIME type of the file (default: "application/octet-stream")
    * `:acl` - Access control list (default: "public-read")

  ## Examples

      iex> S3.upload_file(audio_data, "tts/voice_hash.mp3", content_type: "audio/mpeg")
      {:ok, "tts/voice_hash.mp3"}
  """
  def upload_file(data, path, opts \\ []) do
    bucket = get_bucket()
    content_type = Keyword.get(opts, :content_type, "application/octet-stream")
    acl = Keyword.get(opts, :acl, "public-read")

    upload_opts = [
      {:content_type, content_type},
      {:acl, acl}
    ]

    case bucket |> ExAws.S3.put_object(path, data, upload_opts) |> ExAws.request() do
      {:ok, _} ->
        Logger.info("File uploaded to S3", path: path, size: byte_size(data))
        {:ok, path}

      {:error, reason} ->
        Logger.error("S3 upload failed", path: path, reason: inspect(reason))
        {:error, reason}
    end
  end

  @doc """
  Gets the public URL for an S3 file.

  Uses the configured public URL or constructs one from bucket configuration.

  ## Examples

      iex> S3.get_public_url("tts/voice_hash.mp3")
      "https://cdn.example.com/tts/voice_hash.mp3"
  """
  def get_public_url(path) do
    case Application.get_env(:streampai, :storage)[:public_url] do
      nil -> build_s3_url(path)
      public_url -> "#{public_url}/#{path}"
    end
  end

  @doc """
  Deletes a file from S3.

  ## Examples

      iex> S3.delete_file("tts/old_file.mp3")
      {:ok, "tts/old_file.mp3"}
  """
  def delete_file(path) do
    bucket = get_bucket()

    case bucket |> ExAws.S3.delete_object(path) |> ExAws.request() do
      {:ok, _} ->
        Logger.info("File deleted from S3", path: path)
        {:ok, path}

      {:error, reason} ->
        Logger.error("S3 delete failed", path: path, reason: inspect(reason))
        {:error, reason}
    end
  end

  defp get_bucket do
    case Application.get_env(:streampai, :storage)[:bucket] do
      nil ->
        Logger.warning("S3 bucket not configured, using 'streampai' as default")
        "streampai"

      bucket ->
        bucket
    end
  end

  defp build_s3_url(path) do
    bucket = get_bucket()
    s3_config = Application.get_env(:ex_aws, :s3) || []

    scheme = s3_config[:scheme] || "https://"
    host = s3_config[:host] || "s3.amazonaws.com"
    port = s3_config[:port]

    # Build base URL with optional port
    base_url =
      if port do
        "#{scheme}#{host}:#{port}"
      else
        "#{scheme}#{host}"
      end

    # Use path-style URLs for MinIO/local (when port is specified)
    # Use subdomain-style for AWS S3 (production)
    if port do
      "#{base_url}/#{bucket}/#{path}"
    else
      "#{scheme}#{bucket}.#{host}/#{path}"
    end
  end
end
