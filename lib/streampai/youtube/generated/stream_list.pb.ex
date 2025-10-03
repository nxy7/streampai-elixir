defmodule Youtube.Api.V3.LiveChatMessageSnippet.TypeWrapper.Type do
  @moduledoc false

  use Protobuf, enum: true, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :INVALID_TYPE, 0
  field :TEXT_MESSAGE_EVENT, 1
  field :TOMBSTONE, 2
  field :FAN_FUNDING_EVENT, 3
  field :CHAT_ENDED_EVENT, 4
  field :SPONSOR_ONLY_MODE_STARTED_EVENT, 5
  field :SPONSOR_ONLY_MODE_ENDED_EVENT, 6
  field :NEW_SPONSOR_EVENT, 7
  field :MEMBER_MILESTONE_CHAT_EVENT, 17
  field :MEMBERSHIP_GIFTING_EVENT, 18
  field :GIFT_MEMBERSHIP_RECEIVED_EVENT, 19
  field :MESSAGE_DELETED_EVENT, 8
  field :MESSAGE_RETRACTED_EVENT, 9
  field :USER_BANNED_EVENT, 10
  field :SUPER_CHAT_EVENT, 15
  field :SUPER_STICKER_EVENT, 16
  field :POLL_EVENT, 20
end

defmodule Youtube.Api.V3.LiveChatUserBannedMessageDetails.BanTypeWrapper.BanType do
  @moduledoc false

  use Protobuf, enum: true, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :PERMANENT, 1
  field :TEMPORARY, 2
end

defmodule Youtube.Api.V3.LiveChatPollDetails.PollStatusWrapper.PollStatus do
  @moduledoc false

  use Protobuf, enum: true, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :UNKNOWN, 0
  field :ACTIVE, 1
  field :CLOSED, 2
end

defmodule Youtube.Api.V3.LiveChatMessageListRequest do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :live_chat_id, 1, optional: true, type: :string, json_name: "liveChatId"
  field :hl, 2, optional: true, type: :string
  field :profile_image_size, 3, optional: true, type: :uint32, json_name: "profileImageSize"
  field :max_results, 98, optional: true, type: :uint32, json_name: "maxResults"
  field :page_token, 99, optional: true, type: :string, json_name: "pageToken"
  field :part, 100, repeated: true, type: :string
end

defmodule Youtube.Api.V3.LiveChatMessageListResponse do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  alias Youtube.Api.V3.LiveChatMessage

  field :kind, 200, optional: true, type: :string
  field :etag, 201, optional: true, type: :string
  field :offline_at, 2, optional: true, type: :string, json_name: "offlineAt"
  field :page_info, 1004, optional: true, type: Youtube.Api.V3.PageInfo, json_name: "pageInfo"
  field :next_page_token, 100_602, optional: true, type: :string, json_name: "nextPageToken"
  field :items, 1007, repeated: true, type: LiveChatMessage

  field :active_poll_item, 1008,
    optional: true,
    type: LiveChatMessage,
    json_name: "activePollItem"
end

defmodule Youtube.Api.V3.LiveChatMessage do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :kind, 200, optional: true, type: :string
  field :etag, 201, optional: true, type: :string
  field :id, 101, optional: true, type: :string
  field :snippet, 2, optional: true, type: Youtube.Api.V3.LiveChatMessageSnippet

  field :author_details, 3,
    optional: true,
    type: Youtube.Api.V3.LiveChatMessageAuthorDetails,
    json_name: "authorDetails"
end

defmodule Youtube.Api.V3.LiveChatMessageAuthorDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :channel_id, 10_101, optional: true, type: :string, json_name: "channelId"
  field :channel_url, 102, optional: true, type: :string, json_name: "channelUrl"
  field :display_name, 103, optional: true, type: :string, json_name: "displayName"
  field :profile_image_url, 104, optional: true, type: :string, json_name: "profileImageUrl"
  field :is_verified, 4, optional: true, type: :bool, json_name: "isVerified"
  field :is_chat_owner, 5, optional: true, type: :bool, json_name: "isChatOwner"
  field :is_chat_sponsor, 6, optional: true, type: :bool, json_name: "isChatSponsor"
  field :is_chat_moderator, 7, optional: true, type: :bool, json_name: "isChatModerator"
end

defmodule Youtube.Api.V3.LiveChatMessageSnippet.TypeWrapper do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2
end

defmodule Youtube.Api.V3.LiveChatMessageSnippet do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  oneof(:displayed_content, 0)

  field :type, 1,
    optional: true,
    type: Youtube.Api.V3.LiveChatMessageSnippet.TypeWrapper.Type,
    enum: true

  field :live_chat_id, 201, optional: true, type: :string, json_name: "liveChatId"
  field :author_channel_id, 301, optional: true, type: :string, json_name: "authorChannelId"
  field :published_at, 4, optional: true, type: :string, json_name: "publishedAt"
  field :has_display_content, 17, optional: true, type: :bool, json_name: "hasDisplayContent"
  field :display_message, 16, optional: true, type: :string, json_name: "displayMessage"

  field :text_message_details, 19,
    optional: true,
    type: Youtube.Api.V3.LiveChatTextMessageDetails,
    json_name: "textMessageDetails",
    oneof: 0

  field :message_deleted_details, 20,
    optional: true,
    type: Youtube.Api.V3.LiveChatMessageDeletedDetails,
    json_name: "messageDeletedDetails",
    oneof: 0

  field :message_retracted_details, 21,
    optional: true,
    type: Youtube.Api.V3.LiveChatMessageRetractedDetails,
    json_name: "messageRetractedDetails",
    oneof: 0

  field :user_banned_details, 22,
    optional: true,
    type: Youtube.Api.V3.LiveChatUserBannedMessageDetails,
    json_name: "userBannedDetails",
    oneof: 0

  field :super_chat_details, 27,
    optional: true,
    type: Youtube.Api.V3.LiveChatSuperChatDetails,
    json_name: "superChatDetails",
    oneof: 0

  field :super_sticker_details, 28,
    optional: true,
    type: Youtube.Api.V3.LiveChatSuperStickerDetails,
    json_name: "superStickerDetails",
    oneof: 0

  field :new_sponsor_details, 29,
    optional: true,
    type: Youtube.Api.V3.LiveChatNewSponsorDetails,
    json_name: "newSponsorDetails",
    oneof: 0

  field :member_milestone_chat_details, 30,
    optional: true,
    type: Youtube.Api.V3.LiveChatMemberMilestoneChatDetails,
    json_name: "memberMilestoneChatDetails",
    oneof: 0

  field :membership_gifting_details, 31,
    optional: true,
    type: Youtube.Api.V3.LiveChatMembershipGiftingDetails,
    json_name: "membershipGiftingDetails",
    oneof: 0

  field :gift_membership_received_details, 32,
    optional: true,
    type: Youtube.Api.V3.LiveChatGiftMembershipReceivedDetails,
    json_name: "giftMembershipReceivedDetails",
    oneof: 0

  field :poll_details, 33,
    optional: true,
    type: Youtube.Api.V3.LiveChatPollDetails,
    json_name: "pollDetails",
    oneof: 0
end

defmodule Youtube.Api.V3.LiveChatTextMessageDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :message_text, 1, optional: true, type: :string, json_name: "messageText"
end

defmodule Youtube.Api.V3.LiveChatMessageDeletedDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :deleted_message_id, 101, optional: true, type: :string, json_name: "deletedMessageId"
end

defmodule Youtube.Api.V3.LiveChatMessageRetractedDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :retracted_message_id, 201, optional: true, type: :string, json_name: "retractedMessageId"
end

defmodule Youtube.Api.V3.LiveChatUserBannedMessageDetails.BanTypeWrapper do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2
end

defmodule Youtube.Api.V3.LiveChatUserBannedMessageDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :banned_user_details, 1,
    optional: true,
    type: Youtube.Api.V3.ChannelProfileDetails,
    json_name: "bannedUserDetails"

  field :ban_type, 2,
    optional: true,
    type: Youtube.Api.V3.LiveChatUserBannedMessageDetails.BanTypeWrapper.BanType,
    json_name: "banType",
    enum: true

  field :ban_duration_seconds, 4, optional: true, type: :uint64, json_name: "banDurationSeconds"
end

defmodule Youtube.Api.V3.LiveChatSuperChatDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :amount_micros, 1, optional: true, type: :uint64, json_name: "amountMicros"
  field :currency, 2, optional: true, type: :string
  field :amount_display_string, 3, optional: true, type: :string, json_name: "amountDisplayString"
  field :user_comment, 4, optional: true, type: :string, json_name: "userComment"
  field :tier, 5, optional: true, type: :uint32
end

defmodule Youtube.Api.V3.LiveChatSuperStickerDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :amount_micros, 1, optional: true, type: :uint64, json_name: "amountMicros"
  field :currency, 2, optional: true, type: :string
  field :amount_display_string, 3, optional: true, type: :string, json_name: "amountDisplayString"
  field :tier, 4, optional: true, type: :uint32

  field :super_sticker_metadata, 5,
    optional: true,
    type: Youtube.Api.V3.SuperStickerMetadata,
    json_name: "superStickerMetadata"
end

defmodule Youtube.Api.V3.LiveChatFanFundingEventDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :amount_micros, 1, optional: true, type: :uint64, json_name: "amountMicros"
  field :currency, 2, optional: true, type: :string
  field :amount_display_string, 3, optional: true, type: :string, json_name: "amountDisplayString"
  field :user_comment, 4, optional: true, type: :string, json_name: "userComment"
end

defmodule Youtube.Api.V3.LiveChatNewSponsorDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :member_level_name, 1, optional: true, type: :string, json_name: "memberLevelName"
  field :is_upgrade, 2, optional: true, type: :bool, json_name: "isUpgrade"
end

defmodule Youtube.Api.V3.LiveChatMemberMilestoneChatDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :member_level_name, 1, optional: true, type: :string, json_name: "memberLevelName"
  field :member_month, 2, optional: true, type: :uint32, json_name: "memberMonth"
  field :user_comment, 3, optional: true, type: :string, json_name: "userComment"
end

defmodule Youtube.Api.V3.LiveChatMembershipGiftingDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :gift_memberships_count, 1,
    optional: true,
    type: :int32,
    json_name: "giftMembershipsCount"

  field :gift_memberships_level_name, 2,
    optional: true,
    type: :string,
    json_name: "giftMembershipsLevelName"
end

defmodule Youtube.Api.V3.LiveChatGiftMembershipReceivedDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :member_level_name, 1, optional: true, type: :string, json_name: "memberLevelName"
  field :gifter_channel_id, 2, optional: true, type: :string, json_name: "gifterChannelId"

  field :associated_membership_gifting_message_id, 3,
    optional: true,
    type: :string,
    json_name: "associatedMembershipGiftingMessageId"
end

defmodule Youtube.Api.V3.LiveChatPollDetails.PollMetadata.PollOption do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :option_text, 1, optional: true, type: :string, json_name: "optionText"
  field :tally, 2, optional: true, type: :int64
end

defmodule Youtube.Api.V3.LiveChatPollDetails.PollMetadata do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :question_text, 1, optional: true, type: :string, json_name: "questionText"

  field :options, 2,
    repeated: true,
    type: Youtube.Api.V3.LiveChatPollDetails.PollMetadata.PollOption
end

defmodule Youtube.Api.V3.LiveChatPollDetails.PollStatusWrapper do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2
end

defmodule Youtube.Api.V3.LiveChatPollDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :metadata, 1, optional: true, type: Youtube.Api.V3.LiveChatPollDetails.PollMetadata

  field :status, 2,
    optional: true,
    type: Youtube.Api.V3.LiveChatPollDetails.PollStatusWrapper.PollStatus,
    enum: true
end

defmodule Youtube.Api.V3.SuperChatEventSnippet do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :channel_id, 101, optional: true, type: :string, json_name: "channelId"

  field :supporter_details, 2,
    optional: true,
    type: Youtube.Api.V3.ChannelProfileDetails,
    json_name: "supporterDetails"

  field :comment_text, 3, optional: true, type: :string, json_name: "commentText"
  field :created_at, 4, optional: true, type: :string, json_name: "createdAt"
  field :amount_micros, 5, optional: true, type: :uint64, json_name: "amountMicros"
  field :currency, 6, optional: true, type: :string
  field :display_string, 7, optional: true, type: :string, json_name: "displayString"
  field :message_type, 8, optional: true, type: :uint32, json_name: "messageType"
  field :is_super_sticker_event, 11, optional: true, type: :bool, json_name: "isSuperStickerEvent"

  field :super_sticker_metadata, 12,
    optional: true,
    type: Youtube.Api.V3.SuperStickerMetadata,
    json_name: "superStickerMetadata"
end

defmodule Youtube.Api.V3.SuperStickerMetadata do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :sticker_id, 1, optional: true, type: :string, json_name: "stickerId"
  field :alt_text, 2, optional: true, type: :string, json_name: "altText"
  field :alt_text_language, 3, optional: true, type: :string, json_name: "altTextLanguage"
end

defmodule Youtube.Api.V3.ChannelProfileDetails do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :channel_id, 101, optional: true, type: :string, json_name: "channelId"
  field :channel_url, 2, optional: true, type: :string, json_name: "channelUrl"
  field :display_name, 3, optional: true, type: :string, json_name: "displayName"
  field :profile_image_url, 4, optional: true, type: :string, json_name: "profileImageUrl"
end

defmodule Youtube.Api.V3.PageInfo do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.15.0", syntax: :proto2

  field :total_results, 1, optional: true, type: :int32, json_name: "totalResults"
  field :results_per_page, 2, optional: true, type: :int32, json_name: "resultsPerPage"
end

defmodule Youtube.Api.V3.V3DataLiveChatMessageService.Service do
  @moduledoc false

  use GRPC.Service,
    name: "youtube.api.v3.V3DataLiveChatMessageService",
    protoc_gen_elixir_version: "0.15.0"

  rpc(
    :StreamList,
    Youtube.Api.V3.LiveChatMessageListRequest,
    stream(Youtube.Api.V3.LiveChatMessageListResponse)
  )
end

defmodule Youtube.Api.V3.V3DataLiveChatMessageService.Stub do
  @moduledoc false

  use GRPC.Stub, service: Youtube.Api.V3.V3DataLiveChatMessageService.Service
end
