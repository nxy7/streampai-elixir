defmodule Streampai.YouTube.Protobuf do
  @moduledoc """
  Protobuf message definitions for YouTube Live Streaming API.

  This module contains the protobuf message structures needed for
  communicating with YouTube's gRPC streaming endpoints.

  Note: In a production environment, these would typically be generated
  from Google's official .proto files using a protobuf compiler.
  """

  @doc """
  Builds a StreamChatMessagesRequest for the gRPC streaming endpoint.
  """
  def build_stream_request(live_chat_id, opts \\ []) do
    part = Keyword.get(opts, :part, ["id", "snippet", "authorDetails"])

    # This would be actual protobuf encoding in production
    %{
      "liveChatId" => live_chat_id,
      "part" => part,
      "maxResults" => Keyword.get(opts, :max_results, 200)
    }
    |> Jason.encode!()
  end

  @doc """
  Decodes a chat message from protobuf format to Elixir map.
  """
  def decode_chat_message(protobuf_data) do
    try do
      # In production, this would use proper protobuf decoding
      case Jason.decode(protobuf_data) do
        {:ok, decoded} -> {:ok, normalize_chat_message(decoded)}
        {:error, _} -> decode_binary_protobuf(protobuf_data)
      end
    rescue
      e -> {:error, {:decode_error, e}}
    end
  end

  # Handle binary protobuf data (simplified placeholder)
  defp decode_binary_protobuf(data) when is_binary(data) do
    # This is a placeholder - would use actual protobuf library
    # For now, return a mock message structure
    {:ok, %{
      "id" => "msg_#{:crypto.strong_rand_bytes(8) |> Base.encode64(padding: false)}",
      "snippet" => %{
        "type" => "textMessageEvent",
        "liveChatId" => "unknown",
        "publishedAt" => DateTime.utc_now() |> DateTime.to_iso8601(),
        "hasDisplayContent" => true,
        "displayMessage" => "[Binary message - decoding not implemented]",
        "textMessageDetails" => %{
          "messageText" => "[Binary message - decoding not implemented]"
        }
      },
      "authorDetails" => %{
        "channelId" => "unknown",
        "displayName" => "Unknown User",
        "isVerified" => false,
        "isChatOwner" => false,
        "isChatSponsor" => false,
        "isChatModerator" => false
      }
    }}
  end

  # Normalize the message structure to ensure consistent format
  defp normalize_chat_message(message) do
    %{
      "id" => get_in(message, ["id"]) || generate_message_id(),
      "snippet" => normalize_snippet(get_in(message, ["snippet"])),
      "authorDetails" => normalize_author_details(get_in(message, ["authorDetails"]))
    }
  end

  defp normalize_snippet(snippet) when is_map(snippet) do
    %{
      "type" => get_in(snippet, ["type"]) || "textMessageEvent",
      "liveChatId" => get_in(snippet, ["liveChatId"]),
      "authorChannelId" => get_in(snippet, ["authorChannelId"]),
      "publishedAt" => get_in(snippet, ["publishedAt"]) || DateTime.utc_now() |> DateTime.to_iso8601(),
      "hasDisplayContent" => get_in(snippet, ["hasDisplayContent"]) || true,
      "displayMessage" => get_in(snippet, ["displayMessage"]) || get_message_text(snippet),
      "textMessageDetails" => normalize_text_details(get_in(snippet, ["textMessageDetails"]))
    }
  end
  defp normalize_snippet(_), do: %{}

  defp normalize_text_details(details) when is_map(details) do
    %{
      "messageText" => get_in(details, ["messageText"]) || ""
    }
  end
  defp normalize_text_details(_), do: %{"messageText" => ""}

  defp normalize_author_details(details) when is_map(details) do
    %{
      "channelId" => get_in(details, ["channelId"]),
      "channelUrl" => get_in(details, ["channelUrl"]),
      "displayName" => get_in(details, ["displayName"]) || "Unknown User",
      "profileImageUrl" => get_in(details, ["profileImageUrl"]),
      "isVerified" => get_in(details, ["isVerified"]) || false,
      "isChatOwner" => get_in(details, ["isChatOwner"]) || false,
      "isChatSponsor" => get_in(details, ["isChatSponsor"]) || false,
      "isChatModerator" => get_in(details, ["isChatModerator"]) || false
    }
  end
  defp normalize_author_details(_), do: %{}

  defp get_message_text(snippet) do
    get_in(snippet, ["textMessageDetails", "messageText"]) || ""
  end

  defp generate_message_id do
    "msg_#{:crypto.strong_rand_bytes(12) |> Base.encode64(padding: false)}"
  end

  @doc """
  Builds authentication headers for gRPC requests.
  """
  def build_auth_headers(access_token) do
    [
      {"authorization", "Bearer #{access_token}"},
      {"content-type", "application/grpc+proto"},
      {"user-agent", "StreamPai-YouTube-gRPC-Client/1.0"},
      {"grpc-accept-encoding", "gzip"}
    ]
  end

  @doc """
  Message types that can be received from YouTube Live Chat.
  """
  def message_types do
    [
      "textMessageEvent",
      "superChatEvent",
      "superStickerEvent",
      "newSponsorEvent",
      "memberMilestoneChatEvent",
      "membershipGiftingEvent",
      "giftMembershipReceivedEvent",
      "messageDeletedEvent",
      "messageRetractedEvent",
      "userBannedEvent",
      "moderatorAddedEvent",
      "moderatorRemovedEvent",
      "chatEndedEvent"
    ]
  end

  @doc """
  Determines if a message type represents a monetization event.
  """
  def monetization_event?(message_type) do
    message_type in [
      "superChatEvent",
      "superStickerEvent",
      "newSponsorEvent",
      "memberMilestoneChatEvent",
      "membershipGiftingEvent",
      "giftMembershipReceivedEvent"
    ]
  end

  @doc """
  Determines if a message type represents a moderation event.
  """
  def moderation_event?(message_type) do
    message_type in [
      "messageDeletedEvent",
      "messageRetractedEvent",
      "userBannedEvent",
      "moderatorAddedEvent",
      "moderatorRemovedEvent"
    ]
  end
end