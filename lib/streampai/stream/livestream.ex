defmodule Streampai.Stream.Livestream do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "livestreams"
    repo Streampai.Repo
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :get_completed_by_user, args: [:user_id]
    define :start_livestream, args: [:user_id, :title, :description, :thumbnail_file_id]
    define :end_livestream
  end

  actions do
    defaults [:read, :destroy, update: :*]

    create :create do
      accept [
        :id,
        :started_at,
        :user_id,
        :title,
        :description,
        :thumbnail_file_id
      ]
    end

    create :start_livestream do
      description "Start a new livestream with optional metadata"
      accept [:title, :description, :thumbnail_file_id]

      argument :user_id, :uuid, allow_nil?: false

      change set_attribute(:id, &Ash.UUID.generate/0)
      change set_attribute(:user_id, arg(:user_id))
      change set_attribute(:started_at, &DateTime.utc_now/0)
      change Streampai.Stream.Livestream.Changes.SetDefaultTitle
    end

    update :end_livestream do
      description "End an active livestream"
      require_atomic? false

      change set_attribute(:ended_at, &DateTime.utc_now/0)

      validate attribute_equals(:ended_at, nil) do
        message "Livestream has already ended"
      end
    end

    read :get_completed_by_user do
      argument :user_id, :uuid do
        allow_nil? false
      end

      filter expr(user_id == ^arg(:user_id) and not is_nil(ended_at))
      prepare build(sort: [started_at: :desc])
    end
  end

  attributes do
    uuid_primary_key :id do
      writable? true
    end

    attribute :title, :string do
      public? true
      allow_nil? false
    end

    attribute :description, :string do
      public? true
      allow_nil? true
    end

    # Legacy field - use thumbnail_file_id instead
    # This field is kept for backward compatibility but should not be used for new code
    # Use the thumbnail_url calculation instead which derives from thumbnail_file
    attribute :legacy_thumbnail_url, :string do
      public? true
      allow_nil? true
    end

    attribute :thumbnail_file_id, :uuid do
      public? true
      allow_nil? true
    end

    attribute :started_at, :utc_datetime do
      public? true
      allow_nil? false
    end

    attribute :ended_at, :utc_datetime do
      public? true
      allow_nil? true
    end
  end

  relationships do
    belongs_to :user, Streampai.Accounts.User do
      allow_nil? false
      attribute_writable? true
    end

    belongs_to :thumbnail_file, Streampai.Storage.File do
      allow_nil? true
      attribute_writable? true
    end

    has_many :metrics, Streampai.Stream.LivestreamMetric do
      destination_attribute :livestream_id
    end

    has_many :chat_messages, Streampai.Stream.ChatMessage do
      destination_attribute :livestream_id
    end
  end

  calculations do
    calculate :average_viewers, :integer, Streampai.Stream.Calculations.AverageViewers do
      public? true
    end

    calculate :peak_viewers, :integer, Streampai.Stream.Calculations.PeakViewers do
      public? true
    end

    calculate :messages_amount, :integer, Streampai.Stream.Calculations.MessagesAmount do
      public? true
    end

    calculate :duration_seconds, :integer, Streampai.Stream.Calculations.DurationSeconds do
      public? true
    end

    calculate :platforms, {:array, :atom}, Streampai.Stream.Calculations.Platforms do
      public? true
    end

    # Derive thumbnail URL from the file relationship
    calculate :thumbnail_url, :string, fn records, _context ->
      Enum.map(records, fn record ->
        case record.thumbnail_file do
          nil ->
            # Fall back to legacy thumbnail_url field if no file
            record.legacy_thumbnail_url

          %{url: url} ->
            # Use the URL calculation from the File resource
            url

          file ->
            # Fallback in case URL wasn't loaded - should not happen in practice
            Streampai.Storage.Adapters.S3.get_url(file.storage_key)
        end
      end)
    end do
      public? true
      load thumbnail_file: [:url]
    end
  end
end
