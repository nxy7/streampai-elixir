defmodule StreampaiWeb.Utils.FakePatreon do
  @moduledoc false

  @platforms ["Twitch", "YouTube", "Facebook", "Kick", "Streampai"]
  @tiers ["Bronze", "Silver", "Gold", "Diamond", "Platinum"]

  @first_names [
    "Alex",
    "Jordan",
    "Taylor",
    "Morgan",
    "Casey",
    "Riley",
    "Sam",
    "Quinn",
    "Avery",
    "Blake",
    "Drew",
    "Jamie",
    "Cameron",
    "Reese",
    "Skylar",
    "Phoenix",
    "River",
    "Sage",
    "Dakota",
    "Rowan",
    "Finley",
    "Charlie",
    "Emerson",
    "Haven"
  ]

  @last_names [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson"
  ]

  @usernames [
    "xXGamerBoi",
    "StreamQueen",
    "NightOwl",
    "ProGamer",
    "CasualViewer",
    "LoyalFan",
    "MegaSupporter",
    "ElitePatron",
    "StreamAddict",
    "ContentKing",
    "ViewerOne",
    "SuperFan2024",
    "ChatMaster",
    "DonationKing",
    "SubLord",
    "TierThreeSub",
    "ModSquad",
    "VIPViewer",
    "PrimeSupporter",
    "TurboUser",
    "BitsDonator",
    "CheerLeader",
    "TopDonor",
    "MonthlySupport",
    "YearlyPatron"
  ]

  def generate_patreons(count \\ 250) do
    current_time = DateTime.utc_now()

    Enum.map(1..count, fn i ->
      platform = Enum.random(@platforms)
      tier = Enum.random(@tiers)
      months_subscribed = :rand.uniform(36)
      start_date = DateTime.add(current_time, -months_subscribed * 30 * 24 * 3600, :second)

      %{
        id: "patreon_#{i}",
        viewer_id: "viewer_#{:rand.uniform(500)}",
        username: "#{Enum.random(@usernames)}#{:rand.uniform(999)}",
        display_name: "#{Enum.random(@first_names)} #{Enum.random(@last_names)}",
        platform: platform,
        tier: tier,
        tier_level: tier_to_level(tier),
        amount: tier_to_amount(tier, platform),
        currency: platform_currency(platform),
        months_subscribed: months_subscribed,
        start_date: start_date,
        last_payment_date: last_payment_date(current_time, start_date),
        next_payment_date: next_payment_date(current_time),
        is_active: :rand.uniform(100) > 10,
        lifetime_value: months_subscribed * tier_to_amount(tier, platform),
        perks: tier_perks(tier),
        discord_linked: :rand.uniform(100) > 30,
        email_notifications: :rand.uniform(100) > 20,
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=#{i}"
      }
    end)
  end

  def get_platform_stats(patreons) do
    platforms = @platforms

    Enum.map(platforms, fn platform ->
      platform_patreons = Enum.filter(patreons, &(&1.platform == platform))
      active_patreons = Enum.filter(platform_patreons, & &1.is_active)

      %{
        platform: platform,
        total: length(platform_patreons),
        active: length(active_patreons),
        inactive: length(platform_patreons) - length(active_patreons),
        revenue: calculate_platform_revenue(active_patreons),
        average_tier: calculate_average_tier(platform_patreons),
        churn_rate: calculate_churn_rate(platform_patreons)
      }
    end)
  end

  def get_tier_distribution(patreons) do
    patreons
    |> Enum.reduce(%{}, fn patreon, acc ->
      Map.update(acc, patreon.tier, 1, &(&1 + 1))
    end)
    |> Enum.map(fn {tier, count} ->
      %{
        tier: tier,
        count: count,
        percentage: Float.round(count / length(patreons) * 100, 1)
      }
    end)
    |> Enum.sort_by(&tier_to_level(&1.tier))
  end

  def get_monthly_revenue_chart_data(patreons) do
    current_time = DateTime.utc_now()

    Enum.map(11..0//-1, fn months_ago ->
      month_date = DateTime.add(current_time, -months_ago * 30 * 24 * 3600, :second)
      month_name = Calendar.strftime(month_date, "%b")

      active_in_month =
        Enum.filter(patreons, fn p ->
          DateTime.compare(p.start_date, month_date) in [:lt, :eq] and
            (p.is_active or :rand.uniform(100) > 30)
        end)

      revenue = calculate_platform_revenue(active_in_month)

      %{
        month: month_name,
        revenue: revenue,
        count: length(active_in_month)
      }
    end)
  end

  def get_growth_metrics(patreons) do
    current_month =
      Enum.count(patreons, fn p ->
        DateTime.diff(DateTime.utc_now(), p.start_date, :day) <= 30
      end)

    last_month =
      Enum.count(patreons, fn p ->
        diff = DateTime.diff(DateTime.utc_now(), p.start_date, :day)
        diff > 30 and diff <= 60
      end)

    growth_rate =
      if last_month > 0 do
        Float.round((current_month - last_month) / last_month * 100, 1)
      else
        0.0
      end

    %{
      total_patreons: length(patreons),
      active_patreons: Enum.count(patreons, & &1.is_active),
      new_this_month: current_month,
      growth_rate: growth_rate,
      average_value: Float.round(calculate_platform_revenue(patreons) / max(length(patreons), 1), 2),
      retention_rate: Float.round(Enum.count(patreons, & &1.is_active) / max(length(patreons), 1) * 100, 1)
    }
  end

  defp tier_to_level("Bronze"), do: 1
  defp tier_to_level("Silver"), do: 2
  defp tier_to_level("Gold"), do: 3
  defp tier_to_level("Diamond"), do: 4
  defp tier_to_level("Platinum"), do: 5

  defp tier_to_amount("Bronze", _), do: 4.99
  defp tier_to_amount("Silver", _), do: 9.99
  defp tier_to_amount("Gold", _), do: 24.99
  defp tier_to_amount("Diamond", _), do: 49.99
  defp tier_to_amount("Platinum", _), do: 99.99

  defp platform_currency("YouTube"), do: "USD"
  defp platform_currency("Twitch"), do: "USD"
  defp platform_currency(_), do: "USD"

  defp tier_perks("Bronze"), do: ["Badge", "Emotes", "Ad-free viewing"]
  defp tier_perks("Silver"), do: ["Badge", "Emotes", "Ad-free viewing", "Discord access"]

  defp tier_perks("Gold"), do: ["Badge", "Emotes", "Ad-free viewing", "Discord access", "Monthly shoutout"]

  defp tier_perks("Diamond"),
    do: ["Badge", "Emotes", "Ad-free viewing", "Discord access", "Monthly shoutout", "Exclusive content"]

  defp tier_perks("Platinum"),
    do: [
      "Badge",
      "Emotes",
      "Ad-free viewing",
      "Discord access",
      "Monthly shoutout",
      "Exclusive content",
      "1-on-1 monthly call"
    ]

  defp last_payment_date(current_time, start_date) do
    months_since_start = div(DateTime.diff(current_time, start_date, :day), 30)
    DateTime.add(start_date, months_since_start * 30 * 24 * 3600, :second)
  end

  defp next_payment_date(current_time) do
    days_to_add = :rand.uniform(30)
    DateTime.add(current_time, days_to_add * 24 * 3600, :second)
  end

  defp calculate_platform_revenue(patreons) do
    patreons
    |> Enum.map(& &1.amount)
    |> Enum.sum()
    |> Float.round(2)
  end

  defp calculate_average_tier(patreons) do
    if length(patreons) > 0 do
      avg =
        patreons
        |> Enum.map(& &1.tier_level)
        |> Enum.sum()
        |> Kernel./(length(patreons))
        |> Float.round(1)

      level_to_tier(round(avg))
    else
      "N/A"
    end
  end

  defp level_to_tier(1), do: "Bronze"
  defp level_to_tier(2), do: "Silver"
  defp level_to_tier(3), do: "Gold"
  defp level_to_tier(4), do: "Diamond"
  defp level_to_tier(5), do: "Platinum"
  defp level_to_tier(_), do: "Gold"

  defp calculate_churn_rate(patreons) do
    if length(patreons) > 0 do
      inactive = Enum.count(patreons, &(not &1.is_active))
      Float.round(inactive / length(patreons) * 100, 1)
    else
      0.0
    end
  end
end
