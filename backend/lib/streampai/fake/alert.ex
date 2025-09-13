defmodule Streampai.Fake.Alert do
  @moduledoc """
  Utility module for generating fake alert events for testing and demonstration purposes.
  Similar to FakeChat but for donation/alert widgets.
  """

  alias Streampai.Fake.Base

  @alert_types [:donation, :follow, :subscription, :raid]

  @donation_messages [
    "Great stream! Keep it up!",
    "Love your content!",
    "Thanks for the entertainment!",
    "You're awesome!",
    "Best streamer ever!",
    "Hope this helps with the setup!",
    "Amazing gameplay!",
    "Can't wait for the next stream!",
    "You deserve this!",
    "Thanks for making my day!",
    "Keep being amazing!",
    "Your content is incredible!",
    "So glad I found your stream!",
    "You're hilarious!",
    "Best part of my day!",
    "Thanks for all you do!",
    "You've got this!",
    "Loving the vibes!",
    "Your energy is contagious!",
    "Thanks for the laughs!"
  ]

  @subscription_messages [
    "Happy to support!",
    "Love being part of the community!",
    "Worth every penny!",
    "Can't wait for subscriber perks!",
    "Here for the long haul!",
    "Best decision ever!",
    "Your content is worth it!",
    "Proud to be a subscriber!",
    "Thanks for all you do!",
    "Keep up the amazing work!"
  ]

  def default_config do
    %{
      animation_type: "fade",
      display_duration: 5,
      sound_enabled: true,
      sound_volume: 75,
      show_message: true,
      show_amount: true,
      font_size: "medium",
      alert_position: "center"
    }
  end

  def generate_event do
    type = Enum.random(@alert_types)
    username = Base.generate_username()
    platform = Base.generate_platform()

    base_event = %{
      id: Base.generate_hex_id(),
      type: type,
      username: username,
      timestamp: DateTime.utc_now(),
      platform: platform
    }

    case type do
      :donation ->
        amount = Base.generate_donation_amount()

        Map.merge(base_event, %{
          amount: amount,
          currency: "$",
          message: Base.maybe_random(@donation_messages)
        })

      :subscription ->
        Map.put(base_event, :message, Base.maybe_random(@subscription_messages))

      :follow ->
        Map.put(base_event, :message, if(Base.random_boolean(0.1), do: "Thanks for the follow!"))

      :raid ->
        viewers = Enum.random(5..500)
        Map.put(base_event, :message, "Raiding with #{viewers} viewers!")
    end
  end
end
