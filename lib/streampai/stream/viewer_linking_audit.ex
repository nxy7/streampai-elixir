defmodule Streampai.Stream.ViewerLinkingAudit do
  @moduledoc """
  Tracks all viewer linking decisions for idempotency, reevaluation, and audit purposes.
  This enables us to:
  - Replay linking decisions when rules change
  - Track the history of linking changes
  - Support bulk reevaluation of viewer identities
  - Provide transparency in automated linking decisions

  Each audit record captures the context of a linking decision including
  the algorithm used, inputs considered, and confidence metrics.
  """
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.Stream,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "viewer_linking_audits"
    repo Streampai.Repo

    custom_indexes do
      index [:viewer_identity_id], name: "idx_viewer_linking_audits_identity_id"
      index [:linking_batch_id], name: "idx_viewer_linking_audits_batch_id"
      index [:action_type], name: "idx_viewer_linking_audits_action_type"
      index [:created_at], name: "idx_viewer_linking_audits_created_at"
      index [:algorithm_version], name: "idx_viewer_linking_audits_algorithm_version"
    end
  end

  code_interface do
    define :create
    define :read
    define :for_identity
    define :for_batch
    define :by_algorithm_version
  end

  actions do
    defaults [:read]

    create :create do
      primary? true
      accept [
        :viewer_identity_id,
        :action_type,
        :linking_batch_id,
        :algorithm_version,
        :input_data,
        :decision_data,
        :confidence_score,
        :notes
      ]

      validate present([:viewer_identity_id, :action_type, :algorithm_version])
    end

    read :for_identity do
      argument :viewer_identity_id, :uuid, allow_nil?: false

      filter expr(viewer_identity_id == ^arg(:viewer_identity_id))
      prepare build(sort: [created_at: :desc])
    end

    read :for_batch do
      argument :linking_batch_id, :string, allow_nil?: false

      filter expr(linking_batch_id == ^arg(:linking_batch_id))
      prepare build(sort: [created_at: :asc])
    end

    read :by_algorithm_version do
      argument :algorithm_version, :string, allow_nil?: false

      filter expr(algorithm_version == ^arg(:algorithm_version))
      prepare build(sort: [created_at: :desc])
    end
  end

  attributes do
    uuid_primary_key :id

    attribute :action_type, :atom do
      description "Type of linking action performed"
      allow_nil? false
      constraints one_of: [:create, :update, :unlink, :relink, :confidence_update, :username_update]
    end

    attribute :linking_batch_id, :string do
      description "Batch ID for grouping related linking operations"
      allow_nil? false
      constraints max_length: 100
    end

    attribute :algorithm_version, :string do
      description "Version of the linking algorithm used"
      allow_nil? false
      constraints max_length: 50
    end

    attribute :input_data, :map do
      description "Input data used for the linking decision"
      allow_nil? false
      default %{}
    end

    attribute :decision_data, :map do
      description "Details about the linking decision made"
      allow_nil? false
      default %{}
    end

    attribute :confidence_score, :decimal do
      description "Confidence score for this linking decision"
      constraints [
        min: Decimal.new("0.0"),
        max: Decimal.new("1.0")
      ]
    end

    attribute :notes, :string do
      description "Additional notes about this linking decision"
      constraints max_length: 1000
    end

    create_timestamp :created_at
  end

  relationships do
    belongs_to :viewer_identity, Streampai.Stream.ViewerIdentity do
      description "The viewer identity this audit record relates to"
      allow_nil? false
      attribute_writable? true
    end
  end

  validations do
    validate compare(:confidence_score, greater_than_or_equal_to: Decimal.new("0.0")) do
      message "Confidence score must be between 0.0 and 1.0"
      where present(:confidence_score)
    end

    validate compare(:confidence_score, less_than_or_equal_to: Decimal.new("1.0")) do
      message "Confidence score must be between 0.0 and 1.0"
      where present(:confidence_score)
    end
  end
end