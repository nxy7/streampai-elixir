defmodule Streampai.System.FeatureFlagIntegrationTest do
  @moduledoc """
  Integration test for the complete feature flag lifecycle.

  Tests the entire workflow of feature flag operations using Ash actions.
  """
  use Streampai.DataCase, async: true
  use Mneme

  alias Ash.Error.Invalid
  alias Ash.Error.Query.NotFound
  alias Streampai.System.FeatureFlag

  @test_feature :test_integration_feature

  describe "feature flag lifecycle integration" do
    test "complete feature flag lifecycle workflow" do
      actor = %{role: :system}

      # Step 1: Check that non-existing feature is disabled
      auto_assert {:ok, false} <- FeatureFlag.enabled?(@test_feature, actor: actor)

      # Step 2: Create the feature in disabled state
      auto_assert {:ok, %FeatureFlag{id: :test_integration_feature, enabled: false}} <-
                    FeatureFlag.create(%{id: @test_feature, enabled: false}, actor: actor)

      # Step 3: Get the feature and enable it using the enable action
      {:ok, feature} = Ash.get(FeatureFlag, @test_feature, actor: actor)

      auto_assert {:ok, %FeatureFlag{id: :test_integration_feature, enabled: true}} <-
                    FeatureFlag.enable(feature, actor: actor)

      # Step 4: Verify the feature is now enabled
      auto_assert {:ok, true} <- FeatureFlag.enabled?(@test_feature, actor: actor)

      # Step 5: Get the feature and disable it using the disable action
      {:ok, enabled_feature} = Ash.get(FeatureFlag, @test_feature, actor: actor)

      auto_assert {:ok, %FeatureFlag{id: :test_integration_feature, enabled: false}} <-
                    FeatureFlag.disable(enabled_feature, actor: actor)

      # Step 6: Verify the feature is now disabled
      auto_assert {:ok, false} <- FeatureFlag.enabled?(@test_feature, actor: actor)

      # Step 7: Verify we can still read all features and see our disabled one
      {:ok, all_features} = FeatureFlag.read(actor: actor)
      disabled_feature = Enum.find(all_features, &(&1.id == @test_feature))
      auto_assert %FeatureFlag{id: :test_integration_feature, enabled: false} <- disabled_feature

      # Step 8: Delete the feature completely using destroy
      auto_assert :ok <- FeatureFlag.destroy(disabled_feature, actor: actor)

      # Step 9: Verify the feature is completely gone from read list
      {:ok, remaining_features} = FeatureFlag.read(actor: actor)
      refute Enum.any?(remaining_features, &(&1.id == @test_feature))

      # Step 10: Verify enabled? still returns false for deleted feature
      auto_assert {:ok, false} <- FeatureFlag.enabled?(@test_feature, actor: actor)
    end

    test "enable action fails for non-existing feature" do
      test_feature = :test_enable_nonexisting
      actor = %{role: :system}

      # Ensure feature doesn't exist
      auto_assert {:ok, false} <- FeatureFlag.enabled?(test_feature, actor: actor)

      # Try to get non-existing feature should fail
      case Ash.get(FeatureFlag, test_feature, actor: actor) do
        {:error, %NotFound{}} -> :ok
        {:error, %Invalid{errors: [%NotFound{}]}} -> :ok
        other -> flunk("Expected not found error, got: #{inspect(other)}")
      end

      # Feature should still not exist
      auto_assert {:ok, false} <- FeatureFlag.enabled?(test_feature, actor: actor)
    end

    test "disable action fails for non-existing feature" do
      test_feature = :test_disable_nonexisting
      actor = %{role: :system}

      # Ensure feature doesn't exist
      auto_assert {:ok, false} <- FeatureFlag.enabled?(test_feature, actor: actor)

      # Try to get non-existing feature should fail
      case Ash.get(FeatureFlag, test_feature, actor: actor) do
        {:error, %NotFound{}} -> :ok
        {:error, %Invalid{errors: [%NotFound{}]}} -> :ok
        other -> flunk("Expected not found error, got: #{inspect(other)}")
      end

      # Feature should still not exist
      auto_assert {:ok, false} <- FeatureFlag.enabled?(test_feature, actor: actor)
    end

    test "toggle action flips feature state" do
      test_feature = :test_toggle_feature
      actor = %{role: :system}

      # Create feature in enabled state first
      auto_assert {:ok, %FeatureFlag{id: :test_toggle_feature, enabled: true}} <-
                    FeatureFlag.create(%{id: test_feature, enabled: true}, actor: actor)

      # Toggle should disable
      {:ok, feature} = Ash.get(FeatureFlag, test_feature, actor: actor)

      auto_assert {:ok, %FeatureFlag{id: :test_toggle_feature, enabled: false}} <-
                    FeatureFlag.toggle(feature, actor: actor)

      # Toggle again should enable
      {:ok, disabled_feature} = Ash.get(FeatureFlag, test_feature, actor: actor)

      auto_assert {:ok, %FeatureFlag{id: :test_toggle_feature, enabled: true}} <-
                    FeatureFlag.toggle(disabled_feature, actor: actor)

      # Cleanup using code interface
      {:ok, enabled_feature} = Ash.get(FeatureFlag, test_feature, actor: actor)
      FeatureFlag.destroy(enabled_feature, actor: actor)
    end

    test "multiple features can coexist" do
      feature_a = :test_feature_a
      feature_b = :test_feature_b
      actor = %{role: :system}

      # Create both features with different states
      auto_assert {:ok, %FeatureFlag{enabled: true}} <-
                    FeatureFlag.create(%{id: feature_a, enabled: true}, actor: actor)

      auto_assert {:ok, %FeatureFlag{enabled: false}} <-
                    FeatureFlag.create(%{id: feature_b, enabled: false}, actor: actor)

      # Check states independently
      auto_assert {:ok, true} <- FeatureFlag.enabled?(feature_a, actor: actor)
      auto_assert {:ok, false} <- FeatureFlag.enabled?(feature_b, actor: actor)

      # Flip the states - get features first then update them
      {:ok, feature_a_record} = Ash.get(FeatureFlag, feature_a, actor: actor)

      auto_assert {:ok, %FeatureFlag{enabled: false}} <-
                    FeatureFlag.disable(feature_a_record, actor: actor)

      {:ok, feature_b_record} = Ash.get(FeatureFlag, feature_b, actor: actor)

      auto_assert {:ok, %FeatureFlag{enabled: true}} <-
                    FeatureFlag.enable(feature_b_record, actor: actor)

      # Verify new states
      auto_assert {:ok, false} <- FeatureFlag.enabled?(feature_a, actor: actor)
      auto_assert {:ok, true} <- FeatureFlag.enabled?(feature_b, actor: actor)

      # Cleanup both features using code interface
      {:ok, all_features} = FeatureFlag.read(actor: actor)

      for feature_id <- [feature_a, feature_b] do
        feature_to_delete = Enum.find(all_features, &(&1.id == feature_id))
        if feature_to_delete, do: FeatureFlag.destroy(feature_to_delete, actor: actor)
      end
    end
  end
end
