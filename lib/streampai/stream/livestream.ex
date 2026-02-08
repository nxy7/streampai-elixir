defmodule Streampai.Stream.Livestream do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshTypescript.Resource]

  alias Streampai.Stream.Livestream.Validations.ValidateNotEnded
  alias Streampai.Stream.Livestream.Validations.ValidateSubcategory

  postgres do
    table "livestreams"
    repo Streampai.Repo
  end

  typescript do
    type_name("Livestream")
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :get_completed_by_user, args: [{:optional, :user_id}]

    define :start_livestream, args: [:user_id]

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
        :thumbnail_file_id,
        :category,
        :subcategory,
        :language,
        :tags
      ]

      validate ValidateSubcategory
    end

    create :start_livestream do
      description "Start a new livestream with optional metadata"
      accept [:title, :description, :thumbnail_file_id, :category, :subcategory, :language, :tags]

      argument :user_id, :uuid, allow_nil?: false

      change set_attribute(:id, &Ash.UUID.generate/0)
      change set_attribute(:user_id, arg(:user_id))
      change set_attribute(:started_at, &DateTime.utc_now/0)
      change Streampai.Stream.Livestream.Changes.SetDefaultTitle
      change Streampai.Stream.Livestream.Changes.ResolveThumbnailUrl

      validate ValidateSubcategory
    end

    update :end_livestream do
      description "End an active livestream"
      require_atomic? false

      validate ValidateNotEnded

      change set_attribute(:ended_at, &DateTime.utc_now/0)
    end

    read :get_completed_by_user do
      argument :user_id, :uuid do
        allow_nil? true
      end

      prepare fn query, context ->
        case Ash.Query.get_argument(query, :user_id) do
          nil ->
            if context.actor,
              do: Ash.Query.set_argument(query, :user_id, context.actor.id),
              else: query

          _ ->
            query
        end
      end

      filter expr(user_id == ^arg(:user_id) and not is_nil(ended_at))

      prepare build(
                sort: [started_at: :desc],
                load: [:thumbnail_url, :thumbnail_file]
              )
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

    attribute :category, :atom do
      public? true
      allow_nil? true
      constraints one_of: [:gaming, :music, :tech, :art, :talk, :irl, :just_chatting]
    end

    attribute :subcategory, :atom do
      public? true
      allow_nil? true
    end

    attribute :language, :string do
      public? true
      allow_nil? true
      constraints max_length: 10
    end

    attribute :tags, {:array, :string} do
      public? true
      allow_nil? true
      default []
    end

    attribute :thumbnail_url, :string do
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
      public? true
    end

    belongs_to :thumbnail_file, Streampai.Storage.File do
      allow_nil? true
      attribute_writable? true
      public? true
    end

    has_many :metrics, Streampai.Stream.LivestreamMetric do
      destination_attribute :livestream_id
      public? true
    end

    has_many :stream_events, Streampai.Stream.StreamEvent do
      destination_attribute :livestream_id
      public? true
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

    # thumbnail_url is now a stored attribute, resolved at write time
    # by ResolveThumbnailUrl change from thumbnail_file_id
  end
end
