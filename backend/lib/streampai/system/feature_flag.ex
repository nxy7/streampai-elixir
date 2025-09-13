defmodule Streampai.System.FeatureFlag do
  @moduledoc false
  use Ash.Resource,
    otp_app: :streampai,
    domain: Streampai.System,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "feature_flags"
    repo Streampai.Repo
  end

  code_interface do
    define :create
    define :read
    define :update
    define :destroy
    define :get_by_id, action: :get_by_id, args: [:id]
    define :enable, action: :enable, args: [:id]
    define :disable, action: :disable, args: [:id]
    define :is_enabled?, action: :is_enabled?, args: [:id]
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:id, :enabled]

      change fn changeset, _context ->
        Ash.Changeset.force_change_attribute(changeset, :id, to_string(changeset.attributes[:id]))
      end
    end

    update :update do
      accept [:enabled]
    end

    update :enable do
      argument :id, :string, allow_nil?: false

      change filter expr(id == ^arg(:id))
      change set_attribute(:enabled, true)
    end

    update :disable do
      argument :id, :string, allow_nil?: false

      change filter expr(id == ^arg(:id))
      change set_attribute(:enabled, false)
    end

    read :get_by_id do
      argument :id, :string, allow_nil?: false
      get? true
      filter expr(id == ^arg(:id))
    end

    read :is_enabled? do
      argument :id, :string, allow_nil?: false
      get? true
      filter expr(id == ^arg(:id) and enabled == true)
    end
  end

  attributes do
    attribute :id, :string do
      allow_nil? false
      primary_key? true

      constraints max_length: 100
    end

    attribute :enabled, :boolean do
      allow_nil? false
      default false
    end

    timestamps()
  end

  identities do
    identity :unique_id, [:id]
  end
end
