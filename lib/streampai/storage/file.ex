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
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    authorizers: [Ash.Policy.Authorizer]

  postgres do
    table "files"
    repo Streampai.Repo
  end

  postgres do
    references do
      reference :user, on_delete: :delete
    end
  end

  code_interface do
    define :request_upload
    define :mark_uploaded
    define :mark_deleted
    define :get_by_id
    define :list_pending_old
    define :list_orphans
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
        storage_key = "uploads/#{file_type}/#{user_id}/#{Ash.UUID.generate()}#{ext}"

        changeset
        |> Ash.Changeset.change_attribute(:storage_key, storage_key)
        |> Ash.Changeset.change_attribute(:user_id, user_id)
        |> Ash.Changeset.change_attribute(:status, :pending)
        |> Ash.Changeset.set_context(%{estimated_size: estimated_size})
      end

      change after_action(fn changeset, file, _context ->
               file_type = Ash.Changeset.get_argument(changeset, :file_type) || :other
               content_type = file.content_type || "application/octet-stream"
               max_size = Streampai.Storage.SizeLimits.max_size(file_type)

               # Generate presigned upload URL (POST or PUT depending on provider)
               upload_info =
                 Streampai.Storage.Adapters.S3.generate_presigned_upload_url(
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
  end

  policies do
    policy action(:request_upload) do
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
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User
  end

  identities do
    identity :unique_storage_key, [:storage_key]
  end
end
