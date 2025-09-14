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

    # Always replace one donor (guaranteed)
    replace_index = Enum.random(max(3, actual_count - 8)..(actual_count - 1))

    # Always modify 2-3 amounts with changes large enough to affect ranking
    modify_count = Enum.random(2..min(3, actual_count - 1))

    modify_indices =
      0..(actual_count - 1)
      |> Enum.reject(&(&1 == replace_index))
      |> Enum.take_random(modify_count)

    # Apply changes based on pre-determined indices
    updated_list =
      base_list
      |> Enum.with_index()
      |> Enum.map(fn {donor, index} ->
        cond do
          # Always replace 1 donor with completely new one
          index == replace_index ->
            %{
              id: Base.generate_hex_id(),
              username: Base.generate_username(),
              amount: generate_ranking_affecting_amount(base_list, index),
              currency: "$"
            }

          # Modify amounts with changes large enough to shift rankings
          index in modify_indices ->
            new_amount = generate_ranking_shift_amount(donor, base_list, index)
            %{donor | amount: Float.round(new_amount, 2)}

          true ->
            donor
        end
      end)
      |> Enum.sort_by(& &1.amount, :desc)

    updated_list
  end

  # Generate amount that will cause ranking changes
  defp generate_ranking_affecting_amount(donor_list, target_index) do
    sorted_amounts = donor_list |> Enum.map(& &1.amount) |> Enum.sort(:desc)

    cond_result =
      cond do
        target_index < 3 ->
          # New top donor - should be higher than current #1
          max_amount = Enum.at(sorted_amounts, 0, 1000)
          max_amount + 50 + :rand.uniform() * 500

        target_index < length(sorted_amounts) / 2 ->
          # Mid-tier replacement - pick amount that will slot into top half
          mid_point = div(length(sorted_amounts), 2)
          target_amount = Enum.at(sorted_amounts, mid_point, 200)
          target_amount + (:rand.uniform() - 0.5) * target_amount * 0.5

        true ->
          # Lower tier - generate amount that could still climb up
          avg_amount = Enum.sum(sorted_amounts) / length(sorted_amounts)
          avg_amount * (0.3 + :rand.uniform() * 0.7)
      end

    cond_result
    |> max(10.0)
    |> Float.round(2)
  end

  # Modify existing amount to cause ranking shift
  defp generate_ranking_shift_amount(donor, donor_list, current_index) do
    sorted_list = Enum.sort_by(donor_list, & &1.amount, :desc)
    current_amount = donor.amount

    # Determine if we should increase or decrease to cause movement
    # 60% chance to increase
    should_increase = Base.random_boolean(0.6)

    if_result =
      if should_increase do
        # Increase enough to potentially jump 1-3 positions up
        positions_to_jump = Enum.random(1..min(3, current_index))

        if current_index >= positions_to_jump do
          target_position = current_index - positions_to_jump
          target_amount = Enum.at(sorted_list, target_position).amount
          # Add extra to ensure we surpass the target
          target_amount + 5 + :rand.uniform() * 50
        else
          # Already near top, just increase significantly
          current_amount * (1.2 + :rand.uniform() * 0.3)
        end
      else
        # Decrease enough to potentially drop 1-2 positions
        positions_to_drop = Enum.random(1..min(2, length(sorted_list) - current_index - 1))

        if current_index + positions_to_drop < length(sorted_list) do
          target_position = current_index + positions_to_drop
          target_amount = Enum.at(sorted_list, target_position).amount
          # Subtract extra to ensure we drop below the target
          max(target_amount - 5 - :rand.uniform() * 30, current_amount * 0.5)
        else
          # Near bottom, just decrease moderately
          current_amount * (0.6 + :rand.uniform() * 0.2)
        end
      end

    max(if_result, 5.0)
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
