defmodule Streampai.Stream.ViewerLink do
  @moduledoc """
  A ViewerLink connects a global ViewerIdentity to a streamer-specific Viewer record.
  This allows the same person (ViewerIdentity) to have different categorizations,
  notes, or recognition levels with different streamers.

  For example:
  - Global ViewerIdentity: "john_doe" (same person across platforms)
  - Viewer for StreamerA: "Regular viewer, helpful in chat"
  - Viewer for StreamerB: "VIP subscriber, long-time supporter"
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "viewer_links"
    repo Streampai.Repo

    custom_indexes do
      index [:viewer_identity_id, :viewer_id],
        name: "idx_viewer_links_identity_viewer_unique",
        unique: true

      index [:viewer_identity_id], name: "idx_viewer_links_identity_id"
      index [:viewer_id], name: "idx_viewer_links_viewer_id"
      index [:linking_confidence], name: "idx_viewer_links_confidence"
      index [:linked_at], name: "idx_viewer_links_linked_at"
    end
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :for_viewer_identity
    define :for_viewer
    define :find_link
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true

      accept [
        :viewer_identity_id,
        :viewer_id,
        :linking_confidence,
        :linking_method,
        :metadata
      ]

      validate present([:viewer_identity_id, :viewer_id])
    end

    update :update do
      primary? true
      accept [:linking_confidence, :linking_method, :metadata]

      change set_attribute(:updated_at, &DateTime.utc_now/0)
    end

    read :for_viewer_identity do
      argument :viewer_identity_id, :uuid, allow_nil?: false

      filter expr(viewer_identity_id == ^arg(:viewer_identity_id))
      prepare build(sort: [linked_at: :desc])
    end

    read :for_viewer do
      argument :viewer_id, :uuid, allow_nil?: false

      filter expr(viewer_id == ^arg(:viewer_id))
      prepare build(sort: [linked_at: :desc])
    end

    read :find_link do
      argument :viewer_identity_id, :uuid, allow_nil?: false
      argument :viewer_id, :uuid, allow_nil?: false

      filter expr(viewer_identity_id == ^arg(:viewer_identity_id) and viewer_id == ^arg(:viewer_id))
    end
  end

  validations do
    validate compare(:linking_confidence, greater_than_or_equal_to: Decimal.new("0.0")) do
      message "Linking confidence must be between 0.0 and 1.0"
    end

    validate compare(:linking_confidence, less_than_or_equal_to: Decimal.new("1.0")) do
      message "Linking confidence must be between 0.0 and 1.0"
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :linking_confidence, :decimal do
      description "Confidence level of this link between global identity and streamer-specific viewer (0.0 to 1.0)"
      allow_nil? false
      default Decimal.new("1.0")

      constraints min: Decimal.new("0.0"),
                  max: Decimal.new("1.0")
    end

    attribute :linking_method, :atom do
      description "How this link was established"
      allow_nil? false
      default :automatic

      constraints one_of: [
                    :automatic,
                    :manual,
                    :username_similarity,
                    :cross_platform_activity,
                    :admin_override
                  ]
    end

    attribute :linked_at, :utc_datetime_usec do
      description "When this link was established"
      allow_nil? false
      default &DateTime.utc_now/0
    end

    attribute :metadata, :map do
      description "Additional metadata about the linking decision"
      default %{}
    end

    timestamps()
  end

  relationships do
    belongs_to :viewer_identity, Streampai.Stream.ViewerIdentity do
      description "The global viewer identity"
      allow_nil? false
      attribute_writable? true
    end

    belongs_to :viewer, Streampai.Stream.Viewer do
      description "The streamer-specific viewer record"
      allow_nil? false
      attribute_writable? true
    end
  end

  identities do
    identity :viewer_identity_viewer_unique, [:viewer_identity_id, :viewer_id] do
      description "Each global identity can only be linked once to a specific streamer's viewer record"
    end
  end
end