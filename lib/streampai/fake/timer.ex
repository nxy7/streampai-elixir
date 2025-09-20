defmodule Streampai.Fake.Timer do
  @moduledoc """
  Utility module for generating fake timer events for testing and demonstration purposes.
  """

  alias Streampai.Fake.Base

  @timer_event_types [:start, :stop, :resume, :extend]

  @extension_reasons [
    "New donation",
    "New subscription",
    "Raid bonus",
    "Patreon pledge",
    "Bits cheer",
    "Super chat",
    "Gift subs",
    "Milestone reached",
    "Special event"
  ]

  def default_config do
    %{
      # 5 minutes default
      initial_duration: 300,
      count_direction: "down",
      show_label: true,
      timer_label: "Stream Timer",
      show_progress_bar: true,
      timer_color: "#8b5cf6",
      background_color: "#1f2937",
      font_size: "large",
      timer_format: "mm:ss",
      auto_restart: false,
      restart_duration: 300,
      extension_animation: "bounce",
      sound_enabled: true,
      sound_volume: 75,
      # 30 seconds warning
      warning_threshold: 30,
      warning_color: "#ef4444",
      # Extension settings
      donation_extension_enabled: true,
      # seconds per dollar
      donation_extension_amount: 30,
      donation_min_amount: 1,
      subscription_extension_enabled: true,
      # 1 minute per sub
      subscription_extension_amount: 60,
      raid_extension_enabled: true,
      # 1 second per viewer
      raid_extension_per_viewer: 1,
      raid_min_viewers: 5,
      patreon_extension_enabled: true,
      # 2 minutes per patreon
      patreon_extension_amount: 120
    }
  end

  def generate_event do
    type = Enum.random(@timer_event_types)

    base_event = %{
      id: Base.generate_hex_id(),
      type: type,
      timestamp: DateTime.utc_now()
    }

    case type do
      :start ->
        Map.put(base_event, :duration, Enum.random([60, 120, 180, 300, 600, 900]))

      :stop ->
        base_event

      :resume ->
        base_event

      :extend ->
        username = Base.generate_username()
        amount = Enum.random(10..120)
        reason = Enum.random(@extension_reasons)

        Map.merge(base_event, %{
          amount: amount,
          username: username,
          reason: reason
        })
    end
  end

  def generate_control_event(type) when type in [:start, :stop, :resume, :reset] do
    base_event = %{
      id: Base.generate_hex_id(),
      type: type,
      timestamp: DateTime.utc_now()
    }

    case type do
      :start ->
        Map.put(base_event, :duration, 300)

      :reset ->
        Map.put(base_event, :duration, 300)

      _ ->
        base_event
    end
  end

  def generate_extension_event(source_type, amount \\ nil) do
    username = Base.generate_username()

    extension_amount =
      case source_type do
        :donation ->
          donation_amount = amount || Base.generate_donation_amount()
          # 30 seconds per dollar by default
          round(donation_amount * 30)

        :subscription ->
          # 1 minute per sub
          60

        :raid ->
          viewers = amount || Enum.random(10..200)
          # 1 second per viewer
          viewers

        :patreon ->
          # 2 minutes per patreon
          120

        _ ->
          Enum.random(10..60)
      end

    %{
      id: Base.generate_hex_id(),
      type: :extend,
      amount: extension_amount,
      username: username,
      source_type: source_type,
      timestamp: DateTime.utc_now()
    }
  end

  def generate_demo_sequence do
    # Generate a sequence of timer events for demo purposes
    [
      %{type: :start, duration: 300, delay: 0},
      %{type: :extend, amount: 30, username: "DemoUser1", delay: 5000},
      %{type: :extend, amount: 60, username: "DemoUser2", delay: 10_000},
      %{type: :stop, delay: 15_000},
      %{type: :resume, delay: 18_000},
      %{type: :extend, amount: 45, username: "DemoUser3", delay: 22_000},
      %{type: :reset, duration: 300, delay: 30_000}
    ]
  end
end
