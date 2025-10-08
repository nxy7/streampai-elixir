defmodule Streampai.Storage.Adapters.S3Test do
  use Streampai.DataCase, async: false

  alias Streampai.Storage.Adapters.S3

  @moduletag :integration

  setup_all do
    bucket = Application.get_env(:streampai, :storage)[:bucket]

    # Ensure bucket exists
    case bucket |> ExAws.S3.put_bucket("us-east-1") |> ExAws.request() do
      {:ok, _} -> :ok
      {:error, {:http_error, 409, _}} -> :ok
      {:error, reason} -> raise "Failed to create bucket: #{inspect(reason)}"
    end

    # Make bucket publicly readable for tests
    policy = %{
      "Version" => "2012-10-17",
      "Statement" => [
        %{
          "Effect" => "Allow",
          "Principal" => %{"AWS" => ["*"]},
          "Action" => ["s3:GetObject"],
          "Resource" => ["arn:aws:s3:::#{bucket}/*"]
        }
      ]
    }

    policy_json = Jason.encode!(policy)

    case bucket |> ExAws.S3.put_bucket_policy(policy_json) |> ExAws.request() do
      {:ok, _} -> :ok
      {:error, reason} -> raise "Failed to set bucket policy: #{inspect(reason)}"
    end

    :ok
  end

  describe "presigned POST upload flow" do
    test "generates presigned URL, uploads content, and retrieves it" do
      # Test data
      test_content = "Hello from S3 integration test! #{:rand.uniform(10_000)}"
      storage_key = "test/integration-#{Ash.UUID.generate()}.txt"

      # Step 1: Generate presigned POST form
      %{url: upload_url, fields: upload_fields} =
        S3.generate_presigned_upload_url(
          storage_key,
          content_type: "text/plain",
          max_size: 1000,
          # 1KB limit
          expires_in: 300
          # 5 minutes
        )

      # Verify we got a URL and fields
      assert is_binary(upload_url)
      assert is_map(upload_fields)
      assert upload_fields["key"] == storage_key
      assert upload_fields["Content-Type"] == "text/plain"
      assert upload_fields["policy"]
      assert upload_fields["x-amz-signature"]

      # Step 2: Upload content using multipart/form-data POST
      upload_result = upload_via_post(upload_url, upload_fields, test_content)

      assert upload_result.status in [200, 204],
             "Upload failed with status #{upload_result.status}: #{upload_result.body}"

      # Step 3: Retrieve the uploaded content
      download_url = S3.get_url(storage_key)
      response = Req.get!(download_url)

      # Step 4: Verify content matches
      assert response.status == 200
      assert response.body == test_content

      # Cleanup
      :ok = S3.delete(storage_key)
    end

    test "rejects file exceeding max_size" do
      storage_key = "test/oversized-#{Ash.UUID.generate()}.txt"

      # Generate presigned form with tiny 100 byte limit
      %{url: upload_url, fields: upload_fields} =
        S3.generate_presigned_upload_url(
          storage_key,
          content_type: "text/plain",
          max_size: 100,
          expires_in: 300
        )

      # Try to upload 500 bytes (should be rejected)
      large_content = String.duplicate("x", 500)
      upload_result = upload_via_post(upload_url, upload_fields, large_content)

      # S3 should reject with 400 Bad Request
      assert upload_result.status == 400,
             "Expected 400 Bad Request for oversized file, got #{upload_result.status}"

      assert upload_result.body =~ "EntityTooLarge" or upload_result.body =~ "maximum"
    end

    test "upload and delete cycle works correctly" do
      test_content = "Temporary content #{:rand.uniform(10_000)}"
      storage_key = "test/temp-#{Ash.UUID.generate()}.txt"

      # Upload
      %{url: upload_url, fields: upload_fields} =
        S3.generate_presigned_upload_url(storage_key, content_type: "text/plain")

      upload_result = upload_via_post(upload_url, upload_fields, test_content)
      assert upload_result.status in [200, 204]

      # Verify exists
      download_url = S3.get_url(storage_key)
      response = Req.get!(download_url)
      assert response.status == 200

      # Delete
      assert :ok = S3.delete(storage_key)

      # Verify deleted (should get 404)
      {:ok, response} = Req.get(download_url)
      assert response.status == 404
    end
  end

  defp upload_via_post(url, fields, content) do
    # Build multipart form-data manually
    boundary = "----WebKitFormBoundary#{:rand.uniform(1_000_000_000)}"

    # Add all form fields
    body_parts =
      Enum.map(fields, fn {key, value} ->
        """
        --#{boundary}\r
        Content-Disposition: form-data; name="#{key}"\r
        \r
        #{value}\r
        """
      end)

    # Add file content last
    file_part = """
    --#{boundary}\r
    Content-Disposition: form-data; name="file"; filename="test.txt"\r
    Content-Type: text/plain\r
    \r
    #{content}\r
    """

    # Final boundary
    final_boundary = "--#{boundary}--\r\n"

    # Combine all parts
    body = Enum.join(body_parts) <> file_part <> final_boundary

    # Make POST request using Req
    case Req.post(url,
           body: body,
           headers: [{"content-type", "multipart/form-data; boundary=#{boundary}"}]
         ) do
      {:ok, response} ->
        response

      {:error, exception} ->
        %{status: 0, body: "HTTP Error: #{inspect(exception)}"}
    end
  end
end
