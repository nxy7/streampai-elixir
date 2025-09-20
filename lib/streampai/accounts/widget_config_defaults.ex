defmodule Streampai.Accounts.WidgetConfigDefaults do
  @moduledoc """
  Default configurations and required keys for different widget types.
  Extracted from WidgetConfig to reduce cyclomatic complexity.
  """

  @widget_configs %{
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
      font_size: "medium"
    },
    viewer_count_widget: %{
      show_total: true,
      show_platforms: true,
      font_size: "medium",
      display_style: "detailed",
      animation_enabled: true,
      icon_color: "#ef4444",
      viewer_label: "viewers"
    },
    follower_count_widget: %{
      show_total: true,
      show_platforms: true,
      font_size: "medium",
      display_style: "detailed",
      animation_enabled: true,
      total_label: "Total followers",
      icon_color: "#9333ea"
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
    }
  }

  @required_keys %{
    chat_widget: [:max_messages, :show_badges, :show_emotes],
    alertbox_widget: [:display_duration, :animation_type, :sound_enabled],
    viewer_count_widget: [:show_total, :display_style],
    follower_count_widget: [:show_total, :display_style],
    donation_widget: [:show_amount, :minimum_amount],
    follow_widget: [:animation_type, :display_duration],
    subscriber_widget: [:show_tier, :animation_type, :display_duration],
    top_donors_widget: [:display_count, :currency, :theme]
  }

  def get_default_config(:donation_goal_widget) do
    Streampai.Fake.DonationGoal.default_config()
  end

  def get_default_config(:top_donors_widget) do
    Streampai.Fake.TopDonors.default_config()
  end

  def get_default_config(:timer_widget) do
    Streampai.Fake.Timer.default_config()
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
