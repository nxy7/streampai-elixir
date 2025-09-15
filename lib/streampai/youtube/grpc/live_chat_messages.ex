defmodule YouTube.V3.LiveChatMessages.PageInfo do
  @moduledoc false
  use Protobuf, syntax: :proto3

  field :total_results, 1, type: :int32
  field :results_per_page, 2, type: :int32
end

defmodule YouTube.V3.LiveChatMessages.LiveChatTextMessageDetails do
  @moduledoc false
  use Protobuf, syntax: :proto3

  field :message_text, 1, type: :string
end

defmodule YouTube.V3.LiveChatMessages.LiveChatSuperChatDetails do
  @moduledoc false
  use Protobuf, syntax: :proto3

  field :amount_micros, 1, type: :uint64
  field :currency, 2, type: :string
  field :amount_display_string, 3, type: :string
  field :user_comment, 4, type: :string
  field :tier, 5, type: :uint32
end

defmodule YouTube.V3.LiveChatMessages.SuperStickerMetadata do
  @moduledoc false
  use Protobuf, syntax: :proto3

  field :sticker_id, 1, type: :string
  field :alt_text, 2, type: :string
  field :language, 3, type: :string
end

defmodule YouTube.V3.LiveChatMessages.LiveChatSuperStickerDetails do
  @moduledoc false
  use Protobuf, syntax: :proto3

  field :amount_micros, 1, type: :uint64
  field :currency, 2, type: :string
  field :amount_display_string, 3, type: :string
  field :tier, 4, type: :uint32
  field :super_sticker_metadata, 5, type: YouTube.V3.LiveChatMessages.SuperStickerMetadata
end

defmodule YouTube.V3.LiveChatMessages.LiveChatMessageAuthorDetails do
  @moduledoc false
  use Protobuf, syntax: :proto3

  field :channel_id, 1, type: :string
  field :channel_url, 2, type: :string
  field :display_name, 3, type: :string
  field :profile_image_url, 4, type: :string
  field :is_verified, 5, type: :bool
  field :is_chat_owner, 6, type: :bool
  field :is_chat_sponsor, 7, type: :bool
  field :is_chat_moderator, 8, type: :bool
end

defmodule YouTube.V3.LiveChatMessages.LiveChatMessageSnippet do
  @moduledoc false
  use Protobuf, syntax: :proto3

  field :type, 1, type: :string
  field :live_chat_id, 2, type: :string
  field :author_channel_id, 3, type: :string
  field :published_at, 4, type: :string
  field :has_display_content, 5, type: :bool
  field :display_message, 6, type: :string
  field :text_message_details, 7, type: YouTube.V3.LiveChatMessages.LiveChatTextMessageDetails
  field :super_chat_details, 8, type: YouTube.V3.LiveChatMessages.LiveChatSuperChatDetails
  field :super_sticker_details, 9, type: YouTube.V3.LiveChatMessages.LiveChatSuperStickerDetails
end

defmodule YouTube.V3.LiveChatMessages.LiveChatMessage do
  @moduledoc false
  use Protobuf, syntax: :proto3

  field :kind, 1, type: :string
  field :etag, 2, type: :string
  field :id, 3, type: :string
  field :snippet, 4, type: YouTube.V3.LiveChatMessages.LiveChatMessageSnippet
  field :author_details, 5, type: YouTube.V3.LiveChatMessages.LiveChatMessageAuthorDetails
end

defmodule YouTube.V3.LiveChatMessages.StreamListRequest do
  @moduledoc """
  Request structure for YouTube Live Chat Messages streamList method.
  """
  use Protobuf, syntax: :proto3

  field :live_chat_id, 1, type: :string
  field :part, 2, repeated: true, type: :string
  field :page_size, 3, type: :int32
  field :profile_image_size, 4, type: :int32
  field :page_token, 5, type: :string
end

defmodule YouTube.V3.LiveChatMessages.StreamListResponse do
  @moduledoc """
  Response structure for YouTube Live Chat Messages streamList method.
  """
  use Protobuf, syntax: :proto3

  field :kind, 1, type: :string
  field :etag, 2, type: :string
  field :next_page_token, 3, type: :string
  field :page_info, 4, type: YouTube.V3.LiveChatMessages.PageInfo
  field :items, 5, repeated: true, type: YouTube.V3.LiveChatMessages.LiveChatMessage
end

defmodule YouTube.V3.LiveChatMessages.Service do
  @moduledoc """
  YouTube Live Chat Messages gRPC service definition.
  """
  use GRPC.Service, name: "youtube.v3.LiveChatMessages"

  rpc(
    :StreamList,
    YouTube.V3.LiveChatMessages.StreamListRequest,
    stream(YouTube.V3.LiveChatMessages.StreamListResponse)
  )
end

defmodule YouTube.V3.LiveChatMessages.Stub do
  @moduledoc """
  gRPC client stub for YouTube Live Chat Messages API.
  """
  use GRPC.Stub, service: YouTube.V3.LiveChatMessages.Service
end
