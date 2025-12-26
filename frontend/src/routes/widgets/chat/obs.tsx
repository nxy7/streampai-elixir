import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show, For, createMemo } from "solid-js";
import { useLiveQuery } from "@tanstack/solid-db";
import { createUserScopedChatMessagesCollection, chatMessagesCollection } from "~/lib/electric";

type ChatMessage = {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  platform: string;
  isModerator?: boolean;
  isSubscriber?: boolean;
};

// Cache for user-scoped chat collections
const chatCollections = new Map<string, ReturnType<typeof createUserScopedChatMessagesCollection>>();
function getChatCollection(userId: string) {
  let collection = chatCollections.get(userId);
  if (!collection) {
    collection = createUserScopedChatMessagesCollection(userId);
    chatCollections.set(userId, collection);
  }
  return collection;
}

export default function ChatOBS() {
  const [params] = useSearchParams();
  const rawUserId = params.userId;
  const userId = () => (Array.isArray(rawUserId) ? rawUserId[0] : rawUserId);
  const maxMessages = () => parseInt((Array.isArray(params.maxMessages) ? params.maxMessages[0] : params.maxMessages) || "10");

  const chatQuery = useLiveQuery(() => {
    const id = userId();
    if (!id) return chatMessagesCollection;
    return getChatCollection(id);
  });

  const messages = createMemo(() => {
    const data = chatQuery.data || [];
    return data
      .map((msg): ChatMessage => ({
        id: msg.id,
        username: msg.sender_username,
        message: msg.message,
        timestamp: new Date(msg.inserted_at),
        platform: msg.platform,
        isModerator: msg.sender_is_moderator || false,
        isSubscriber: msg.sender_is_patreon || false,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-maxMessages());
  });

  function getPlatformColor(platform: string) {
    switch (platform.toLowerCase()) {
      case 'twitch': return '#9146FF';
      case 'youtube': return '#FF0000';
      case 'facebook': return '#1877F2';
      case 'kick': return '#53FC18';
      default: return '#6B7280';
    }
  }

  return (
    <div class="w-full h-screen bg-transparent overflow-hidden flex flex-col justify-end p-4">
      <Show when={userId()} fallback={
        <div class="text-white text-2xl bg-red-500 rounded-lg p-4">
          Error: No userId provided in URL parameters
        </div>
      }>
        <div class="space-y-2">
          <For each={messages()}>
            {(message) => (
              <div class="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg animate-slide-in-up">
                <div class="flex items-center gap-2 mb-1">
                  <div
                    class="w-2 h-2 rounded-full"
                    style={{ "background-color": getPlatformColor(message.platform) }}
                  />
                  <span class="text-white font-bold">
                    {message.username}
                  </span>
                  <Show when={message.isModerator}>
                    <span class="text-green-400 text-xs">MOD</span>
                  </Show>
                  <Show when={message.isSubscriber}>
                    <span class="text-purple-400 text-xs">SUB</span>
                  </Show>
                </div>
                <div class="text-white text-lg">
                  {message.message}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
