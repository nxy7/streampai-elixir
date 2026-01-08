defmodule Streampai.Stream.EventData do
  @moduledoc """
  Union type for StreamEvent data field. Each event type has a typed embedded
  resource. Stored as flat JSONB with a `type` tag via `:map_with_tag` storage.
  """
  use Ash.Type.NewType,
    subtype_of: :union,
    constraints: [
      storage: :map_with_tag,
      types: [
        chat_message: [
          type: Streampai.Stream.EventData.ChatMessageData,
          tag: :type,
          tag_value: "chat_message"
        ],
        donation: [
          type: Streampai.Stream.EventData.DonationData,
          tag: :type,
          tag_value: "donation"
        ],
        follow: [
          type: Streampai.Stream.EventData.FollowData,
          tag: :type,
          tag_value: "follow"
        ],
        subscription: [
          type: Streampai.Stream.EventData.SubscriptionData,
          tag: :type,
          tag_value: "subscription"
        ],
        raid: [
          type: Streampai.Stream.EventData.RaidData,
          tag: :type,
          tag_value: "raid"
        ],
        stream_updated: [
          type: Streampai.Stream.EventData.StreamUpdatedData,
          tag: :type,
          tag_value: "stream_updated"
        ],
        platform_started: [
          type: Streampai.Stream.EventData.PlatformEventData,
          tag: :type,
          tag_value: "platform_started"
        ],
        platform_stopped: [
          type: Streampai.Stream.EventData.PlatformEventData,
          tag: :type,
          tag_value: "platform_stopped"
        ]
      ]
    ]
end
