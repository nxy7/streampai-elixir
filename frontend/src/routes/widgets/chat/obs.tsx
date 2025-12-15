import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show, For } from "solid-js";
import { gql, createSubscription } from "@urql/solid";

const CHAT_MESSAGE_SUBSCRIPTION = gql`
  subscription ChatMessage($userId: ID!) {
    chatMessage(userId: $userId) {
      id
      username
      message
      timestamp
      platform
      isModerator
      isSubscriber
    }
  }
`;

type ChatMessage = {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  platform: string;
  isModerator?: boolean;
  isSubscriber?: boolean;
};

export default function ChatOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);
  const maxMessages = () => parseInt(params.maxMessages || "10");

  const [messages, setMessages] = createSignal<ChatMessage[]>([]);

  const result = createSubscription({
    query: CHAT_MESSAGE_SUBSCRIPTION,
    variables: { userId: userId() },
    pause: !userId(),
  });

  createEffect(() => {
    if (result()?.data?.chatMessage) {
      const newMessage = result.data.chatMessage;
      setMessages(prev => {
        const updated = [...prev, newMessage];
        return updated.slice(-maxMessages());
      });
    }
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
