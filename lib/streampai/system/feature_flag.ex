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
    define :enable, action: :enable
    define :disable, action: :disable
    define :toggle, action: :toggle
  end

  actions do
    defaults [:read, :destroy]

    update :update do
      accept [:enabled]
      primary? true
    end

    create :create do
      accept [:id, :enabled]
      upsert? true
      upsert_identity :unique_id
    end

    action :enabled?, :boolean do
      argument :name, :atom, allow_nil?: false

      run &__MODULE__.check_enabled?/2
    end

    update :enable do
      change set_attribute(:enabled, true)
    end

    update :disable do
      change set_attribute(:enabled, false)
    end

    update :toggle do
      change atomic_update(:enabled, expr(not enabled))
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

  @doc """
  Checks if a feature flag with the given name exists and is enabled.

  Returns true if the feature exists and is enabled, false otherwise.
  """
  def check_enabled?(input, context) do
    require Ash.Query

    name = input.arguments.name

    __MODULE__
    |> Ash.Query.new()
    |> Ash.Query.filter(id == ^name and enabled == true)
    |> Ash.Query.for_read(:read, %{}, Ash.Context.to_opts(context))
    |> Ash.exists()
  end
end
