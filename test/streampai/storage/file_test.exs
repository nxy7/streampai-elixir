defmodule Streampai.Storage.FileTest do
  use Streampai.DataCase, async: false

  alias Streampai.Accounts.User
  alias Streampai.Storage.File

  @moduletag :integration

  defp upload_test_file(file, content, opts \\ []) do
    max_size = Keyword.get(opts, :max_size, 10_000_000)

    %{url: upload_url, headers: upload_headers} =
      Streampai.Storage.Adapters.S3.generate_presigned_upload_url(
        file.storage_key,
        content_type: file.content_type,
        max_size: max_size
      )

    # Use PUT with direct file upload (simplified from POST)
    {:ok, response} =
      Req.put(upload_url,
        body: content,
        headers: Enum.map(upload_headers, fn {k, v} -> {k, v} end)
      )

    assert response.status in [200, 204]
  end

  describe "user storage aggregates" do
    test "total_files_size correctly sums uploaded file sizes" do
      user =
        User.register_with_password!(%{
          email: "storage-test-#{:rand.uniform(10_000)}@example.com",
          password: "password123",
          password_confirmation: "password123"
        })

      # Request upload for first file (1500 bytes)
      {:ok, file1} =
        File.request_upload(
          %{
            filename: "test1.txt",
            content_type: "text/plain",
            file_type: :other,
            estimated_size: 1500
          },
          actor: user
        )

      # Request upload for second file (1500 bytes)
      {:ok, file2} =
        File.request_upload(
          %{
            filename: "test2.txt",
            content_type: "text/plain",
            file_type: :other,
            estimated_size: 1500
          },
          actor: user
        )

      # At this point files are pending, so total_files_size should be 0
      user_with_pending = Ash.load!(user, :total_files_size)
      assert user_with_pending.total_files_size == 0

      # Upload first file to S3
      content1 = String.duplicate("a", 1500)
      upload_test_file(file1, content1)

      # Mark first file as uploaded (will fetch actual size from S3)
      {:ok, file1_uploaded} = File.mark_uploaded(file1)

      # Verify size was fetched correctly
      assert file1_uploaded.size_bytes == 1500

      # Reload user and check aggregate
      user_with_one = Ash.load!(user, :total_files_size)
      assert user_with_one.total_files_size == 1500

      # Upload second file to S3
      content2 = String.duplicate("b", 1500)
      upload_test_file(file2, content2)

      # Mark second file as uploaded
      {:ok, file2_uploaded} = File.mark_uploaded(file2)

      # Verify size was fetched correctly
      assert file2_uploaded.size_bytes == 1500

      # Reload user and check aggregate includes both files
      user_with_both = Ash.load!(user, :total_files_size)
      assert user_with_both.total_files_size == 3000

      # Mark first file as deleted
      {:ok, _file1_deleted} = File.mark_deleted(file1)

      # Reload user - deleted files should not count
      user_after_delete = Ash.load!(user, :total_files_size)
      assert user_after_delete.total_files_size == 1500
    end

    test "storage quota calculation for free tier" do
      free_user =
        User.register_with_password!(%{
          email: "free-#{:rand.uniform(10_000)}@example.com",
          password: "password123",
          password_confirmation: "password123"
        })

      # Load quotas
      free_user_with_quota = Ash.load!(free_user, :storage_quota)

      # Free user gets 1GB (1_073_741_824 bytes)
      assert free_user_with_quota.storage_quota == 1_073_741_824
    end

    test "storage_used_percent calculation" do
      user =
        User.register_with_password!(%{
          email: "percent-#{:rand.uniform(10_000)}@example.com",
          password: "password123",
          password_confirmation: "password123"
        })

      # Upload file that's 10% of free tier quota (107,374,182 bytes ≈ 100MB)
      {:ok, file} =
        File.request_upload(
          %{
            filename: "large.dat",
            content_type: "application/octet-stream",
            file_type: :other,
            estimated_size: 107_374_182
          },
          actor: user
        )

      # Upload large file to S3
      large_content = String.duplicate("x", 107_374_182)
      upload_test_file(file, large_content, max_size: 110_000_000)

      {:ok, file_uploaded} = File.mark_uploaded(file)

      # Verify size was fetched correctly
      assert file_uploaded.size_bytes == 107_374_182

      # Load user with percentage calculation
      user_with_percent =
        Ash.load!(user, [:total_files_size, :storage_quota, :storage_used_percent])

      assert user_with_percent.total_files_size == 107_374_182
      assert user_with_percent.storage_quota == 1_073_741_824

      # Should be approximately 10%
      assert_in_delta user_with_percent.storage_used_percent, 10.0, 0.01
    end
  end
end
