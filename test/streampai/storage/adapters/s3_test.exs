defmodule Streampai.Storage.Adapters.S3Test do
  use Streampai.DataCase, async: false
  use Mneme

  alias Streampai.Storage.Adapters.S3

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

  describe "presigned URL structure with snapshots" do
    test "generates presigned PUT URL with correct structure and parameters" do
      # Generate presigned URL
      result =
        S3.generate_presigned_upload_url("test/snapshot/document.pdf",
          content_type: "application/pdf",
          expires_in: 1800
        )

      # Parse URL to verify structure
      uri = URI.parse(result.url)
      query_params = URI.decode_query(uri.query || "")

      # Snapshot the URL structure (without dynamic values)
      url_structure = %{
        scheme: uri.scheme,
        host: uri.host,
        port: uri.port,
        path: uri.path,
        query_param_keys: query_params |> Map.keys() |> Enum.sort(),
        headers: result.headers
      }

      auto_assert %{
                    scheme: "http",
                    host: "localhost",
                    port: 9000,
                    path: "/streampai-dev/test/snapshot/document.pdf",
                    query_param_keys: [
                      "Content-Type",
                      "X-Amz-Algorithm",
                      "X-Amz-Credential",
                      "X-Amz-Date",
                      "X-Amz-Expires",
                      "X-Amz-Signature",
                      "X-Amz-SignedHeaders"
                    ],
                    headers: %{"Content-Type" => "application/pdf"}
                  } <- url_structure

      # Verify specific parameter formats
      assert query_params["X-Amz-Algorithm"] == "AWS4-HMAC-SHA256"
      assert query_params["X-Amz-Expires"] == "1800"
      assert query_params["X-Amz-SignedHeaders"] == "host"
      assert query_params["Content-Type"] == "application/pdf"

      # Verify credential format
      assert query_params["X-Amz-Credential"] =~
               ~r/^minioadmin\/\d{8}\/us-east-1\/s3\/aws4_request$/

      # Verify date format
      assert query_params["X-Amz-Date"] =~ ~r/^\d{8}T\d{6}Z$/

      # Verify signature is 64-char hex
      assert String.length(query_params["X-Amz-Signature"]) == 64
      assert query_params["X-Amz-Signature"] =~ ~r/^[a-f0-9]+$/
    end

    test "generates consistent URL structure for different content types" do
      # Test with image
      image_result =
        S3.generate_presigned_upload_url("uploads/avatar.jpg",
          content_type: "image/jpeg"
        )

      # Test with JSON
      json_result =
        S3.generate_presigned_upload_url("data/config.json",
          content_type: "application/json"
        )

      # Snapshot headers for different content types
      auto_assert %{"Content-Type" => "image/jpeg"} <- image_result.headers
      auto_assert %{"Content-Type" => "application/json"} <- json_result.headers

      # Both should have same query parameter structure
      image_params = URI.decode_query(URI.parse(image_result.url).query || "")
      json_params = URI.decode_query(URI.parse(json_result.url).query || "")

      assert image_params |> Map.keys() |> Enum.sort() == json_params |> Map.keys() |> Enum.sort()
    end
  end

  describe "presigned PUT upload flow" do
    @describetag :integration
    test "generates presigned URL, uploads content via PUT, and retrieves it" do
      # Test data
      test_content = "Hello from S3 PUT integration test! #{:rand.uniform(10_000)}"
      storage_key = "test/integration-#{Ash.UUID.generate()}.txt"

      # Step 1: Generate presigned PUT URL
      %{url: upload_url, headers: upload_headers} =
        S3.generate_presigned_upload_url(
          storage_key,
          content_type: "text/plain",
          expires_in: 300
        )

      # Verify we got a URL and headers
      assert is_binary(upload_url)
      assert is_map(upload_headers)
      assert upload_headers["Content-Type"] == "text/plain"

      # Step 2: Upload content using PUT
      upload_result = upload_via_put(upload_url, upload_headers, test_content)

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

    # Note: PUT URLs don't enforce size limits server-side like POST did
    # Size validation must be done client-side

    test "upload and delete cycle works correctly" do
      test_content = "Temporary content #{:rand.uniform(10_000)}"
      storage_key = "test/temp-#{Ash.UUID.generate()}.txt"

      # Upload
      %{url: upload_url, headers: upload_headers} =
        S3.generate_presigned_upload_url(storage_key, content_type: "text/plain")

      upload_result = upload_via_put(upload_url, upload_headers, test_content)
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

  defp upload_via_put(url, headers, content) do
    # Make PUT request with content directly in body
    case Req.put(url,
           body: content,
           headers: Enum.map(headers, fn {k, v} -> {k, v} end)
         ) do
      {:ok, response} ->
        response

      {:error, exception} ->
        %{status: 0, body: "HTTP Error: #{inspect(exception)}"}
    end
  end
end
