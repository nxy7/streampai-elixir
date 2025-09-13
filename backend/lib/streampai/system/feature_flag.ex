defmodule Streampai.System.FeatureFlag do
  @moduledoc """
  Feature flag resource for controlling system-wide features.

  Feature flags allow enabling or disabling features without code deployment.
  Flags are identified by atom IDs and have a boolean enabled status.

  ## Usage Examples

      # Check if a feature is enabled
      case FeatureFlag.enabled?(:donation_module) do
        {:ok, _record} -> # feature is enabled
        {:error, _} -> # feature is disabled or doesn't exist
      end

      # Enable a feature
      FeatureFlag.enable(:new_feature)

      # Disable a feature
      FeatureFlag.disable(:old_feature)

      # Toggle a feature
      FeatureFlag.toggle(:beta_feature)
  """
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
    define :enabled?, action: :enabled?, args: [:name]
    define :enable, action: :enable, args: [:name]
    define :disable, action: :disable, args: [:name]
    define :toggle, action: :toggle, args: [:name]
  end

  actions do
    defaults [:read, :update, :destroy]

    create :create do
      accept [:id, :enabled]
      upsert? true
      upsert_identity :unique_id
    end

    read :enabled? do
      argument :name, :atom, allow_nil?: false
      get? true
      filter expr(id == ^arg(:name) and enabled == true)
    end

    update :enable do
      argument :name, :atom, allow_nil?: false
      require_atomic? false

      manual fn changeset, _context ->
        name = Ash.Changeset.get_argument(changeset, :name)

        case __MODULE__.create(%{id: name, enabled: true}) do
          {:ok, record} ->
            {:ok, record}

          {:error, _} ->
            case Ash.get(__MODULE__, name) do
              {:ok, existing} -> Ash.update(existing, %{enabled: true})
              {:error, _} -> {:error, :not_found}
            end
        end
      end
    end

    update :disable do
      argument :name, :atom, allow_nil?: false
      require_atomic? false

      manual fn changeset, _context ->
        name = Ash.Changeset.get_argument(changeset, :name)

        case Ash.get(__MODULE__, name) do
          {:ok, record} -> Ash.update(record, %{enabled: false})
          {:error, _} -> {:ok, nil}
        end
      end
    end

    update :toggle do
      argument :name, :atom, allow_nil?: false
      require_atomic? false

      manual fn changeset, _context ->
        name = Ash.Changeset.get_argument(changeset, :name)

        case Ash.get(__MODULE__, name) do
          {:ok, record} -> Ash.update(record, %{enabled: not record.enabled})
          {:error, _} -> __MODULE__.create(%{id: name, enabled: true})
        end
      end
    end
  end

  attributes do
    attribute :id, :atom do
      allow_nil? false
      primary_key? true
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
