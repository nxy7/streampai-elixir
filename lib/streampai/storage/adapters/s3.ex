defmodule Streampai.Storage.Adapters.S3 do
  @moduledoc """
  S3-compatible storage adapter.
  Works with Cloudflare R2, MinIO, AWS S3, and other S3-compatible storage.
  """

  require Logger

  @doc """
  Uploads a file from the local filesystem to S3-compatible storage.

  This is used for server-side uploads where you have a file already on disk
  that needs to be stored. For direct browser uploads, use
  `generate_presigned_upload_url/2` instead.

  ## Parameters

    * `file_path` - Absolute path to the file on the local filesystem
    * `opts` - Keyword list of options:
      * `:key` - Custom storage key/path (defaults to auto-generated UUID-based key)
      * `:content_type` - MIME type (defaults to "application/octet-stream")

  ## Returns

    * `{:ok, key}` - The storage key where the file was uploaded
    * `{:error, reason}` - Upload failed

  ## Examples

      # Upload with auto-generated key
      {:ok, key} = S3.upload("/tmp/avatar.jpg", content_type: "image/jpeg")
      # => {:ok, "uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"}

      # Upload with custom key
      {:ok, key} = S3.upload("/tmp/thumbnail.png",
        key: "thumbnails/user-123.png",
        content_type: "image/png"
      )
      # => {:ok, "thumbnails/user-123.png"}
  """
  def upload(file_path, opts \\ []) do
    key = Keyword.get(opts, :key, generate_key(file_path))
    bucket = get_bucket()
    content_type = Keyword.get(opts, :content_type, "application/octet-stream")

    file_binary = File.read!(file_path)

    case bucket
         |> ExAws.S3.put_object(key, file_binary, content_type: content_type)
         |> ExAws.request() do
      {:ok, _response} ->
        Logger.info("Uploaded file to S3: #{key}")
        {:ok, key}

      {:error, reason} ->
        Logger.error("Failed to upload file to S3: #{inspect(reason)}")
        {:error, reason}
    end
  end

  @doc """
  Gets the public URL for a stored file.

  This is used to generate URLs for displaying files in the UI (thumbnails,
  avatars, etc.). If a custom public URL is configured (like a CDN), it will
  be used. Otherwise, falls back to the default S3 bucket URL.

  ## Parameters

    * `key` - The storage key of the file (returned from `upload/2`)
    * `opts` - Reserved for future options (currently unused)

  ## Returns

  A string URL where the file can be accessed.

  ## Examples

      # With CDN configured
      S3.get_url("uploads/avatar.jpg")
      # => "https://cdn.streampai.com/uploads/avatar.jpg"

      # Without CDN (fallback to S3)
      S3.get_url("thumbnails/stream-123.png")
      # => "https://streampai-prod.r2.cloudflarestorage.com/thumbnails/stream-123.png"

  ## Note

  For private files that require authentication, use
  `generate_presigned_download_url/2` instead.
  """
  def get_url(key, _opts \\ []) do
    bucket = get_bucket()
    public_url = get_public_url()

    if public_url do
      "#{public_url}/#{key}"
    else
      # Fallback to S3 URL if no public URL configured
      config = ExAws.Config.new(:s3)
      port_suffix = if config.port, do: ":#{config.port}", else: ""
      "#{config.scheme}#{config.host}#{port_suffix}/#{bucket}/#{key}"
    end
  end

  @doc """
  Deletes a file from S3-compatible storage.

  This is used to remove files when they're no longer needed, typically called
  from the orphan cleanup job or when a user deletes content.

  ## Parameters

    * `key` - The storage key of the file to delete

  ## Returns

    * `:ok` - File was deleted successfully or didn't exist
    * `{:error, reason}` - Deletion failed

  ## Examples

      # Delete a file
      :ok = S3.delete("uploads/old-avatar.jpg")

      # Delete returns :ok even if file doesn't exist (idempotent)
      :ok = S3.delete("uploads/non-existent.jpg")

  ## Note

  This operation is idempotent - deleting a non-existent file returns `:ok`.
  """
  def delete(key) do
    bucket = get_bucket()

    case bucket |> ExAws.S3.delete_object(key) |> ExAws.request() do
      {:ok, _response} ->
        Logger.info("Deleted file from S3: #{key}")
        :ok

      {:error, {:http_error, 404, _}} ->
        # File doesn't exist, consider it deleted
        :ok

      {:error, reason} ->
        Logger.error("Failed to delete file from S3: #{inspect(reason)}")
        {:error, reason}
    end
  end

  @doc """
  Generates a presigned upload URL for direct browser-to-S3 uploads.

  Uses presigned PUT URLs for all S3-compatible storage providers (R2, MinIO, S3).
  This provides a unified, simpler approach that works across all providers.

  ## Parameters

    * `key` - The desired storage key where the file will be uploaded
    * `opts` - Keyword list of options:
      * `:expires_in` - Seconds until URL expires (default: 3600)
      * `:content_type` - Required MIME type for the upload (default: "application/octet-stream")
      * `:max_size` - Maximum file size in bytes (for client-side validation)

  ## Returns

  A map with:
    * `:url` - The presigned PUT URL
    * `:headers` - Headers to include in the PUT request

  ## Examples

      # Generate upload URL for an avatar
      %{url: url, headers: headers} = S3.generate_presigned_upload_url(
        "avatars/user-123.jpg",
        content_type: "image/jpeg",
        expires_in: 1800  # 30 minutes
      )

      # In JavaScript (browser):
      # fetch(url, {
      #   method: 'PUT',
      #   body: file,
      #   headers: headers
      # })

  ## Two-Phase Upload Pattern

  1. Backend creates pending File record and generates presigned URL
  2. Browser uploads directly to storage using PUT
  3. Browser notifies backend of successful upload
  4. Backend marks File record as uploaded

  See `vault/S3_ORPHAN_PREVENTION.md` for details.
  """
  def generate_presigned_upload_url(key, opts \\ []) do
    bucket = get_bucket()
    expires_in = Keyword.get(opts, :expires_in, 3600)
    content_type = Keyword.get(opts, :content_type, "application/octet-stream")

    config = ExAws.Config.new(:s3)

    # Use virtual host style for R2, path style for others
    virtual_host = String.contains?(config.host || "", "r2.cloudflarestorage.com")

    # Generate presigned PUT URL
    {:ok, presigned_url} =
      ExAws.S3.presigned_url(
        config,
        :put,
        bucket,
        key,
        expires_in: expires_in,
        virtual_host: virtual_host,
        query_params: [{"Content-Type", content_type}]
      )

    %{
      url: presigned_url,
      headers: %{
        "Content-Type" => content_type
      }
    }
  end

  @doc """
  Generates a presigned URL for downloading private files.

  This is used for files that require authentication or temporary access.
  The URL grants temporary access to a private file without requiring S3
  credentials. Use this for sensitive files like user documents or private
  media that shouldn't be publicly accessible.

  ## Parameters

    * `key` - The storage key of the file
    * `opts` - Keyword list of options:
      * `:expires_in` - Seconds until URL expires (default: 3600)

  ## Returns

  A presigned URL string that can be used to download the file.

  ## Examples

      # Generate download URL for a private document
      url = S3.generate_presigned_download_url(
        "private/user-123/document.pdf",
        expires_in: 300  # 5 minutes
      )
      # => "https://streampai-prod.r2.cloudflarestorage.com/private/...?X-Amz-Signature=..."

      # User can download within expiration window
      # <a href={url} download>Download Document</a>

  ## When to Use

  - **Private files**: User documents, private media
  - **Temporary access**: Share links, time-limited downloads
  - **Authentication required**: Files behind a paywall or login

  ## When NOT to Use

  For public files (avatars, thumbnails), use `get_url/2` instead as it's
  simpler and can leverage CDN caching.
  """
  def generate_presigned_download_url(key, opts \\ []) do
    bucket = get_bucket()
    expires_in = Keyword.get(opts, :expires_in, 3600)

    config = ExAws.Config.new(:s3)

    {:ok, url} =
      ExAws.S3.presigned_url(
        config,
        :get,
        bucket,
        key,
        expires_in: expires_in
      )

    url
  end

  defp get_bucket do
    Application.get_env(:streampai, :storage)[:bucket] ||
      raise "Storage bucket not configured"
  end

  defp get_public_url do
    Application.get_env(:streampai, :storage)[:public_url]
  end

  @doc """
  Gets the size of a file in S3-compatible storage.

  Makes a HEAD request to S3 to retrieve the Content-Length header without
  downloading the file content.

  ## Parameters

    * `key` - The storage key of the file

  ## Returns

    * `{:ok, size_bytes}` - The file size in bytes
    * `{:error, reason}` - Failed to get file size

  ## Examples

      {:ok, size} = S3.get_file_size("uploads/avatar/user-123/abc.jpg")
      # => {:ok, 52341}
  """
  def get_file_size(key) do
    bucket = get_bucket()

    case bucket |> ExAws.S3.head_object(key) |> ExAws.request() do
      {:ok, %{headers: headers}} ->
        content_length =
          headers
          |> Enum.find(fn {k, _v} -> String.downcase(k) == "content-length" end)
          |> case do
            {_key, value} -> String.to_integer(value)
            nil -> 0
          end

        {:ok, content_length}

      {:error, reason} ->
        Logger.error("Failed to get file size from S3: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp generate_key(file_path) do
    filename = Path.basename(file_path)
    uuid = Ash.UUID.generate()
    ext = Path.extname(filename)
    "uploads/#{uuid}#{ext}"
  end
end
