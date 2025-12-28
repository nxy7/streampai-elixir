defmodule Streampai.Storage.File do
  @moduledoc """
  Tracks all files uploaded to storage.

  This resource prevents orphaned files by:
  1. Recording metadata for every upload
  2. Tracking file status (uploaded, confirmed, deleted)
  3. Enabling cleanup of unconfirmed uploads
  4. Allowing orphan detection via DB queries

  ## Orphan Prevention Strategy

  Two-phase upload:
  1. Create File record with status=:pending when generating presigned URL
  2. Mark status=:uploaded after browser confirms upload
  3. Background job deletes :pending files older than 24h
  """

  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Storage,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer],
    extensions: [AshTypescript.Resource]

  alias Streampai.Storage.Adapters.S3
  alias Streampai.Storage.SizeLimits

  postgres do
    table "files"
    repo Streampai.Repo
  end

  postgres do
    references do
      reference :user, on_delete: :delete
    end
  end

  typescript do
    type_name("File")
  end

  code_interface do
    define :request_upload
    define :mark_uploaded
    define :mark_deleted
    define :get_by_id
    define :list_pending_old
    define :list_orphans
    define :check_duplicate
    define :request_upload_with_hash
  end

  actions do
    defaults [:read]

    create :request_upload do
      description "Request presigned upload URL with quota check"
      accept [:filename, :content_type, :file_type]

      argument :estimated_size, :integer do
        description "Estimated file size in bytes for quota check"
        allow_nil? false
      end

      change fn changeset, context ->
        actor = context.actor
        user_id = if actor, do: actor.id
        file_type = Ash.Changeset.get_argument(changeset, :file_type) || :other
        estimated_size = Ash.Changeset.get_argument(changeset, :estimated_size)

        # Generate unique storage key
        filename = Ash.Changeset.get_attribute(changeset, :filename)
        ext = Path.extname(filename)
        storage_key = "uploads/#{user_id}/#{Ash.UUID.generate()}#{ext}"

        changeset
        |> Ash.Changeset.change_attribute(:storage_key, storage_key)
        |> Ash.Changeset.change_attribute(:user_id, user_id)
        |> Ash.Changeset.change_attribute(:status, :pending)
        |> Ash.Changeset.set_context(%{estimated_size: estimated_size})
      end

      change after_action(fn changeset, file, _context ->
               file_type = Ash.Changeset.get_argument(changeset, :file_type) || :other
               content_type = file.content_type || "application/octet-stream"
               max_size = SizeLimits.max_size(file_type)

               # Generate presigned upload URL (POST or PUT depending on provider)
               upload_info =
                 S3.generate_presigned_upload_url(
                   file.storage_key,
                   content_type: content_type,
                   max_size: max_size,
                   expires_in: 1800
                 )

               # Add upload info to metadata
               file_with_metadata =
                 file
                 |> Ash.Resource.put_metadata(:upload_url, upload_info.url)
                 |> Ash.Resource.put_metadata(:upload_headers, upload_info.headers)
                 |> Ash.Resource.put_metadata(:max_size, max_size)

               {:ok, file_with_metadata}
             end)
    end

    update :mark_uploaded do
      description "Mark file as successfully uploaded and fetch actual size from S3"
      accept [:content_hash]
      require_atomic? false
      change set_attribute(:status, :uploaded)
      change Streampai.Storage.File.Changes.FetchSizeFromS3
    end

    update :mark_deleted do
      description "Soft delete the file"
      change set_attribute(:status, :deleted)
      change set_attribute(:deleted_at, &DateTime.utc_now/0)
    end

    read :get_by_id do
      description "Get file by ID"
      argument :id, :uuid, allow_nil?: false
      get? true
      filter expr(id == ^arg(:id))
    end

    read :list_pending_old do
      description "List pending files older than threshold (for cleanup)"

      argument :hours_old, :integer do
        default 24
      end

      filter expr(
               status == :pending and
                 inserted_at < ago(^arg(:hours_old), :hour)
             )
    end

    read :list_orphans do
      description "Find files in DB not referenced by any resource"

      # This will be extended with custom logic
      # For now, just lists uploaded files
      filter expr(status == :uploaded)
    end

    read :check_duplicate do
      description "Check if a file with the same hash already exists"

      argument :content_hash, :string, allow_nil?: false
      argument :file_type, :atom, allow_nil?: false

      filter expr(
               content_hash == ^arg(:content_hash) and
                 file_type == ^arg(:file_type) and
                 status == :uploaded
             )

      prepare build(limit: 1)
    end

    create :request_upload_with_hash do
      description "Request upload with deduplication check"
      accept [:filename, :content_type, :file_type, :content_hash]

      argument :estimated_size, :integer do
        description "Estimated file size in bytes"
        allow_nil? false
      end

      change fn changeset, context ->
        actor = context.actor
        user_id = if actor, do: actor.id
        content_hash = Ash.Changeset.get_attribute(changeset, :content_hash)
        file_type = Ash.Changeset.get_attribute(changeset, :file_type) || :other

        if content_hash do
          # Check for existing file with same hash
          case Streampai.Storage.File.check_duplicate(
                 %{
                   content_hash: content_hash,
                   file_type: file_type
                 },
                 actor: actor
               ) do
            {:ok, [existing_file | _]} ->
              # Found duplicate - return existing file instead
              Ash.Changeset.add_error(changeset,
                field: :content_hash,
                message: "duplicate",
                vars: %{existing_file_id: existing_file.id}
              )

            _ ->
              # No duplicate, proceed with normal upload
              filename = Ash.Changeset.get_attribute(changeset, :filename)
              ext = Path.extname(filename)
              storage_key = "uploads/#{user_id}/#{Ash.UUID.generate()}#{ext}"

              changeset
              |> Ash.Changeset.change_attribute(:storage_key, storage_key)
              |> Ash.Changeset.change_attribute(:user_id, user_id)
              |> Ash.Changeset.change_attribute(:status, :pending)
          end
        else
          # No hash provided, proceed normally
          filename = Ash.Changeset.get_attribute(changeset, :filename)
          ext = Path.extname(filename)
          storage_key = "uploads/#{user_id}/#{Ash.UUID.generate()}#{ext}"

          changeset
          |> Ash.Changeset.change_attribute(:storage_key, storage_key)
          |> Ash.Changeset.change_attribute(:user_id, user_id)
          |> Ash.Changeset.change_attribute(:status, :pending)
        end
      end

      change after_action(fn changeset, file, _context ->
               file_type = Ash.Changeset.get_argument(changeset, :file_type) || :other
               content_type = file.content_type || "application/octet-stream"
               max_size = SizeLimits.max_size(file_type)

               upload_info =
                 S3.generate_presigned_upload_url(
                   file.storage_key,
                   content_type: content_type,
                   max_size: max_size,
                   expires_in: 1800
                 )

               file_with_metadata =
                 file
                 |> Ash.Resource.put_metadata(:upload_url, upload_info.url)
                 |> Ash.Resource.put_metadata(:upload_headers, upload_info.headers)
                 |> Ash.Resource.put_metadata(:max_size, max_size)

               {:ok, file_with_metadata}
             end)
    end
  end

  policies do
    policy action([:request_upload, :request_upload_with_hash]) do
      description "Check storage quota before allowing upload"
      authorize_if Streampai.Storage.File.Checks.HasStorageQuota
    end

    policy always() do
      authorize_if always()
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :storage_key, :string do
      description "S3/R2 key (path in bucket)"
      allow_nil? false
    end

    attribute :filename, :string do
      description "Original filename"
      allow_nil? false
    end

    attribute :content_type, :string do
      description "MIME type"
      allow_nil? false
      default "application/octet-stream"
    end

    attribute :size_bytes, :integer do
      description "File size in bytes"
    end

    attribute :status, :atom do
      description "Upload status"
      allow_nil? false
      default :pending
      constraints one_of: [:pending, :uploaded, :deleted]
    end

    attribute :file_type, :atom do
      description "Category of file"
      allow_nil? false
      constraints one_of: [:thumbnail, :avatar, :video, :other]
    end

    attribute :user_id, :uuid do
      description "User who uploaded the file"
      allow_nil? false
    end

    create_timestamp :inserted_at
    update_timestamp :updated_at

    attribute :deleted_at, :utc_datetime do
      description "Soft delete timestamp"
    end

    attribute :content_hash, :string do
      description "SHA256 hash of file content for deduplication"
      allow_nil? true
    end
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User
  end

  calculations do
    calculate :url, :string do
      public? true
      description "Public URL to access the file"

      calculation fn records, _context ->
        Enum.map(records, fn record ->
          S3.get_url(record.storage_key)
        end)
      end
    end

    calculate :upload_url, :string do
      public? true
      description "Presigned upload URL (only available immediately after request_upload)"

      calculation fn records, _context ->
        Enum.map(records, fn record ->
          record.__metadata__[:upload_url]
        end)
      end
    end

    calculate :upload_headers, {:array, :map} do
      public? true

      description "Headers to include when uploading (only available immediately after request_upload)"

      calculation fn records, _context ->
        Enum.map(records, fn record ->
          case record.__metadata__[:upload_headers] do
            nil ->
              nil

            headers when is_map(headers) ->
              Enum.map(headers, fn {k, v} -> %{"key" => k, "value" => v} end)
          end
        end)
      end
    end

    calculate :max_size, :integer do
      public? true
      description "Maximum allowed file size (only available immediately after request_upload)"

      calculation fn records, _context ->
        Enum.map(records, fn record ->
          record.__metadata__[:max_size]
        end)
      end
    end
  end

  identities do
    identity :unique_storage_key, [:storage_key]
    identity :content_hash, [:content_hash, :file_type]
  end
end
