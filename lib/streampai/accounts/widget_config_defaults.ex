defmodule Streampai.Accounts.WidgetConfigDefaults do
  @moduledoc """
  Default configurations and required keys for different widget types.
  Extracted from WidgetConfig to reduce cyclomatic complexity.
  """

  @widget_configs %{
    placeholder_widget: %{
      message: "Placeholder Widget",
      font_size: 24,
      text_color: "#ffffff",
      background_color: "#9333ea",
      border_color: "#ffffff",
      border_width: 2,
      padding: 16,
      border_radius: 8
    },
    chat_widget: %{
      max_messages: 50,
      show_badges: true,
      show_emotes: true,
      hide_bots: false,
      show_timestamps: false,
      show_platform: true,
      message_fade_time: 0,
      font_size: "medium"
    },
    alertbox_widget: %{
      display_duration: 5,
      animation_type: "fade",
      alert_position: "center",
      sound_enabled: true,
      sound_volume: 80,
      show_amount: true,
      show_message: true,
      font_size: "medium",
      # Alert filtering settings (used by AlertManager)
      donations_enabled: true,
      donations_min_amount: 1.0,
      follows_enabled: true,
      subscriptions_enabled: true,
      raids_enabled: true,
      raids_min_viewers: 1
    },
    viewer_count_widget: %{
      label: "viewers",
      font_size: 32,
      text_color: "#ffffff",
      background_color: "#ef4444",
      show_icon: true
    },
    follower_count_widget: %{
      label: "followers",
      font_size: 32,
      text_color: "#ffffff",
      background_color: "#9333ea",
      show_icon: true,
      animate_on_change: true
    },
    timer_widget: %{
      label: "TIMER",
      font_size: 48,
      text_color: "#ffffff",
      background_color: "#3b82f6",
      countdown_minutes: 5,
      auto_start: false
    },
    donation_widget: %{
      show_amount: true,
      show_message: true,
      minimum_amount: 1.0,
      animation_enabled: true,
      sound_enabled: true
    },
    follow_widget: %{
      show_message: true,
      animation_type: "slide",
      display_duration: 3
    },
    subscriber_widget: %{
      show_tier: true,
      show_message: true,
      animation_type: "bounce",
      display_duration: 4
    },
    poll_widget: %{
      show_title: true,
      show_percentages: true,
      show_vote_counts: true,
      font_size: "medium",
      primary_color: "#9333ea",
      secondary_color: "#3b82f6",
      background_color: "#ffffff",
      text_color: "#1f2937",
      winner_color: "#fbbf24",
      animation_type: "smooth",
      highlight_winner: true,
      auto_hide_after_end: false,
      hide_delay: 10
    },
    giveaway_widget: %{
      show_title: true,
      title: "🎉 Giveaway",
      show_description: true,
      description: "Join now for a chance to win!",
      active_label: "Giveaway Active",
      inactive_label: "No Active Giveaway",
      winner_label: "Winner!",
      entry_method_text: "Type !join to enter",
      show_entry_method: true,
      show_progress_bar: true,
      target_participants: 100,
      patreon_multiplier: 2,
      patreon_badge_text: "Patreon",
      winner_animation: "confetti",
      title_color: "#9333ea",
      text_color: "#1f2937",
      background_color: "#ffffff",
      accent_color: "#10b981",
      font_size: "medium",
      show_patreon_info: true
    },
    donation_goal_widget: %{
      goal_amount: 1000,
      starting_amount: 0,
      currency: "$",
      start_date: Date.to_iso8601(Date.utc_today()),
      end_date: Date.utc_today() |> Date.add(30) |> Date.to_iso8601(),
      title: "Donation Goal",
      show_percentage: true,
      show_amount_raised: true,
      show_days_left: true,
      theme: "default",
      bar_color: "#10b981",
      background_color: "#e5e7eb",
      text_color: "#1f2937",
      animation_enabled: true
    },
    message_highlight_widget: %{
      font_size: "medium",
      show_platform: true,
      show_timestamp: true,
      animation_type: "slide",
      background_color: "rgba(0, 0, 0, 0.9)",
      text_color: "#ffffff",
      accent_color: "#9333ea",
      border_radius: 12
    }
  }

  @required_keys %{
    placeholder_widget: [:message, :font_size, :text_color, :background_color],
    chat_widget: [:max_messages, :show_badges, :show_emotes],
    alertbox_widget: [:display_duration, :animation_type, :sound_enabled],
    viewer_count_widget: [:label, :font_size, :text_color, :background_color, :show_icon],
    follower_count_widget: [:label, :font_size, :text_color, :background_color, :show_icon],
    timer_widget: [:label, :font_size, :text_color, :background_color, :countdown_minutes],
    donation_widget: [:show_amount, :minimum_amount],
    follow_widget: [:animation_type, :display_duration],
    subscriber_widget: [:show_tier, :animation_type, :display_duration],
    top_donors_widget: [:display_count, :currency, :theme],
    slider_widget: [:slide_duration, :transition_duration, :transition_type, :fit_mode],
    eventlist_widget: [:animation_type, :max_events, :event_types],
    poll_widget: [:show_title, :font_size, :primary_color, :background_color, :text_color],
    giveaway_widget: [:title, :winner_animation, :title_color, :text_color, :background_color],
    donation_goal_widget: [
      :goal_amount,
      :currency,
      :title,
      :bar_color,
      :background_color,
      :text_color
    ],
    message_highlight_widget: [
      :font_size,
      :show_platform,
      :animation_type,
      :background_color,
      :text_color,
      :accent_color
    ]
  }

  def get_default_config(:donation_goal_widget) do
    Streampai.Fake.DonationGoal.default_config()
  end

  def get_default_config(:top_donors_widget) do
    Streampai.Fake.TopDonors.default_config()
  end

  def get_default_config(:poll_widget) do
    Streampai.Fake.Poll.default_config()
  end

  def get_default_config(:slider_widget) do
    StreampaiWeb.Utils.FakeSlider.default_config()
  end

  def get_default_config(:giveaway_widget) do
    Streampai.Fake.Giveaway.default_config()
  end

  def get_default_config(:eventlist_widget) do
    StreampaiWeb.Utils.FakeEventlist.default_config()
  end

  def get_default_config(widget_type) do
    Map.get(@widget_configs, widget_type, %{})
  end

  def get_required_config_keys(widget_type) do
    Map.get(@required_keys, widget_type, [])
  end
end
