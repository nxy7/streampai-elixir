defmodule Streampai.Fake.TopDonors do
  @moduledoc """
  Generates realistic donation ranking distributions with natural decay patterns
  where top donors significantly outrank lower-tier contributors.
  """

  alias Streampai.Fake.Base

  def default_config do
    %{
      display_count: 10,
      currency: "$",
      theme: "default",
      background_color: "#1f2937",
      text_color: "#ffffff",
      animation_enabled: true
    }
  end

  def generate_top_donors_list(count \\ 15) do
    # Generate base amounts that will create a natural ranking
    base_amounts = generate_ranked_amounts(count)

    # Create donors with these amounts
    base_amounts
    |> Enum.with_index()
    |> Enum.map(fn {amount, index} ->
      %{
        id: Base.generate_hex_id(),
        username: get_username(index),
        amount: amount,
        currency: "$"
      }
    end)
    |> Enum.sort_by(& &1.amount, :desc)
  end

  def generate_shuffled_top_donors(previous_donors \\ nil, count \\ 15) do
    base_list = previous_donors || generate_top_donors_list(count)
    actual_count = length(base_list)

    # Guarantee at least some changes happen
    # 40% chance to replace someone
    should_replace = Base.random_boolean(0.4)

    # Pre-determine which indices to change
    replace_index =
      if should_replace and actual_count > 5 do
        Enum.random(5..(actual_count - 1))
      end

    modify_indices =
      if actual_count > 2 do
        # Always pick 2-3 donors to modify amounts
        0..(actual_count - 1)
        |> Enum.take_random(Enum.random(2..min(3, actual_count)))
        # Don't modify the one being replaced
        |> Enum.reject(&(&1 == replace_index))
      else
        [0]
      end

    # Apply changes based on pre-determined indices
    updated_list =
      base_list
      |> Enum.with_index()
      |> Enum.map(fn {donor, index} ->
        cond do
          # Replace 1 donor
          index == replace_index ->
            %{
              id: Base.generate_hex_id(),
              username: Base.generate_username(),
              amount: generate_realistic_amount(),
              currency: "$"
            }

          # Modify amounts for selected indices
          index in modify_indices ->
            # 20-40% change for noticeable updates
            # 20-40% change
            change_percentage = 0.2 + :rand.uniform() * 0.2
            adjustment = (:rand.uniform() - 0.5) * (donor.amount * change_percentage)
            new_amount = max(donor.amount + adjustment, 5.0)
            %{donor | amount: Float.round(new_amount, 2)}

          true ->
            donor
        end
      end)
      |> Enum.sort_by(& &1.amount, :desc)

    updated_list
  end

  defp generate_ranked_amounts(count) do
    # Create a natural distribution where top donors have significantly more
    # than lower ranked donors, but with some variation

    # Top donor: $2000-$5000
    base_top_amount = 2000 + :rand.uniform() * 3000

    0..(count - 1)
    |> Enum.map(&calculate_amount_for_rank(&1, base_top_amount))
    |> Enum.map(&Float.round(&1, 2))
  end

  defp calculate_amount_for_rank(0, base_amount), do: base_amount
  defp calculate_amount_for_rank(1, base_amount), do: base_amount * (0.6 + :rand.uniform() * 0.2)
  defp calculate_amount_for_rank(2, base_amount), do: base_amount * (0.4 + :rand.uniform() * 0.2)

  defp calculate_amount_for_rank(n, base_amount) when n < 10 do
    decay_factor = 0.3 - n * 0.025 + (:rand.uniform() - 0.5) * 0.05
    max(base_amount * decay_factor, 50)
  end

  defp calculate_amount_for_rank(_, _base_amount), do: 50 + :rand.uniform() * 200

  defp generate_realistic_amount, do: Base.generate_donation_amount()

  defp get_username(_index), do: Base.generate_username()

  def generate_demo_state(config \\ default_config()) do
    # Merge provided config with defaults to ensure all keys exist
    full_config = Map.merge(default_config(), config)

    # Generate realistic top donors list
    # Generate more than needed for variation
    donors = generate_top_donors_list(20)

    %{
      config: full_config,
      donors: donors
    }
  end
end
