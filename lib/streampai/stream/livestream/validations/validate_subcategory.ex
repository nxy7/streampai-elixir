defmodule Streampai.Stream.Livestream.Validations.ValidateSubcategory do
  @moduledoc """
  Validates that subcategory is appropriate for the selected category.
  """
  use Ash.Resource.Validation

  @category_subcategories %{
    gaming: [
      :league_of_legends,
      :dota_2,
      :counter_strike,
      :valorant,
      :minecraft,
      :fortnite,
      :world_of_warcraft,
      :overwatch,
      :apex_legends,
      :call_of_duty,
      :gta_v,
      :among_us,
      :rust,
      :dead_by_daylight,
      :hearthstone,
      :starcraft,
      :diablo_4,
      :elden_ring,
      :baldurs_gate_3,
      :other
    ],
    music: [
      :rock,
      :pop,
      :hip_hop,
      :electronic,
      :jazz,
      :classical,
      :metal,
      :country,
      :r_and_b,
      :indie,
      :folk,
      :reggae,
      :blues,
      :edm,
      :house,
      :techno,
      :dubstep,
      :ambient,
      :lo_fi,
      :other
    ],
    tech: [
      :programming,
      :web_development,
      :game_development,
      :mobile_development,
      :data_science,
      :machine_learning,
      :cybersecurity,
      :devops,
      :cloud_computing,
      :blockchain,
      :hardware,
      :"3d_printing",
      :robotics,
      :networking,
      :databases,
      :other
    ],
    art: [
      :digital_art,
      :traditional_art,
      :"3d_modeling",
      :animation,
      :pixel_art,
      :character_design,
      :landscape,
      :portrait,
      :abstract,
      :illustration,
      :concept_art,
      :painting,
      :drawing,
      :sculpture,
      :photography,
      :graphic_design,
      :other
    ],
    talk: [
      :podcast,
      :interview,
      :debate,
      :news,
      :politics,
      :sports,
      :entertainment,
      :lifestyle,
      :education,
      :science,
      :philosophy,
      :self_improvement,
      :business,
      :finance,
      :health,
      :fitness,
      :other
    ],
    irl: [
      :cooking,
      :travel,
      :outdoor,
      :sports,
      :fitness,
      :asmr,
      :social_eating,
      :shopping,
      :events,
      :vlog,
      :pranks,
      :challenges,
      :unboxing,
      :diy,
      :pets,
      :other
    ],
    just_chatting: [
      :casual,
      :q_and_a,
      :gaming_talk,
      :creative_talk,
      :news_discussion,
      :social,
      :other
    ]
  }

  @impl true
  def init(opts), do: {:ok, opts}

  @impl true
  def validate(changeset, _opts, _context) do
    category = Ash.Changeset.get_attribute(changeset, :category)
    subcategory = Ash.Changeset.get_attribute(changeset, :subcategory)

    case {category, subcategory} do
      # No category or no subcategory - valid (both optional)
      {nil, _} -> :ok
      {_, nil} -> :ok
      # Both present - validate subcategory is valid for category
      {cat, subcat} -> validate_pair(cat, subcat)
    end
  end

  defp validate_pair(category, subcategory) do
    valid_subcategories = Map.get(@category_subcategories, category, [])

    if subcategory in valid_subcategories do
      :ok
    else
      {:error,
       field: :subcategory, message: "#{inspect(subcategory)} is not a valid subcategory for #{inspect(category)}"}
    end
  end

  @doc """
  Returns the map of valid subcategories for each category.
  Used by frontend to populate dropdowns.
  """
  def category_subcategories, do: @category_subcategories

  @doc """
  Returns valid subcategories for a specific category.
  """
  def subcategories_for(category) when is_atom(category) do
    Map.get(@category_subcategories, category, [])
  end

  def subcategories_for(_), do: []
end
