import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show, For, createMemo } from "solid-js";
import { useLiveQuery } from "@tanstack/solid-db";
import { createUserScopedStreamEventsCollection, streamEventsCollection } from "~/lib/electric";

type AlertEvent = {
  id: string;
  type: 'donation' | 'follower' | 'subscriber' | 'raid';
  data: any;
  timestamp: Date;
};

// Cache for user-scoped event collections
const eventCollections = new Map<string, ReturnType<typeof createUserScopedStreamEventsCollection>>();
function getEventsCollection(userId: string) {
  let collection = eventCollections.get(userId);
  if (!collection) {
    collection = createUserScopedStreamEventsCollection(userId);
    eventCollections.set(userId, collection);
  }
  return collection;
}

export default function AlertboxOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);

  const [alertQueue, setAlertQueue] = createSignal<AlertEvent[]>([]);
  const [currentAlert, setCurrentAlert] = createSignal<AlertEvent | null>(null);
  const [isAnimating, setIsAnimating] = createSignal(false);
  const [processedEventIds, setProcessedEventIds] = createSignal<Set<string>>(new Set());

  const eventsQuery = useLiveQuery(() => {
    const id = userId();
    if (!id) return streamEventsCollection;
    return getEventsCollection(id);
  });

  const relevantEvents = createMemo(() => {
    const data = eventsQuery.data || [];
    return data.filter((e) =>
      e.type === "donation" ||
      e.type === "follow" ||
      e.type === "subscription" ||
      e.type === "raid"
    ).sort((a, b) => new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime());
  });

  createEffect(() => {
    const events = relevantEvents();
    const processed = processedEventIds();

    events.forEach((streamEvent) => {
      if (processed.has(streamEvent.id)) return;

      let alertType: 'donation' | 'follower' | 'subscriber' | 'raid';
      if (streamEvent.type === "follow") {
        alertType = 'follower';
      } else if (streamEvent.type === "subscription") {
        alertType = 'subscriber';
      } else {
        alertType = streamEvent.type as 'donation' | 'raid';
      }

      const event: AlertEvent = {
        id: streamEvent.id,
        type: alertType,
        data: streamEvent.data,
        timestamp: new Date(streamEvent.inserted_at),
      };

      addToQueue(event);
      setProcessedEventIds((prev) => new Set([...prev, streamEvent.id]));
    });
  });

  function addToQueue(event: AlertEvent) {
    setAlertQueue(prev => [...prev, event]);
    if (!isAnimating()) {
      processQueue();
    }
  }

  function processQueue() {
    const queue = alertQueue();
    if (queue.length === 0) {
      setIsAnimating(false);
      return;
    }

    const nextEvent = queue[0];
    setAlertQueue(prev => prev.slice(1));
    setCurrentAlert(nextEvent);
    setIsAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
      setCurrentAlert(null);
      setTimeout(() => {
        processQueue();
      }, 500);
    }, 5000);
  }

  function getPlatformColor(platform: string) {
    switch (platform.toLowerCase()) {
      case 'twitch': return '#9146FF';
      case 'youtube': return '#FF0000';
      case 'facebook': return '#1877F2';
      case 'kick': return '#53FC18';
      default: return '#6B7280';
    }
  }

  function renderDonationAlert(data: any) {
    return (
      <div class="alert-content bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl text-center animate-bounce-in">
        <div class="text-white text-5xl mb-4">💰</div>
        <div class="text-white text-4xl font-bold mb-2">
          {data.username} donated {data.currency}{data.amount}!
        </div>
        <Show when={data.message}>
          <div class="text-white text-2xl mt-4 italic">"{data.message}"</div>
        </Show>
      </div>
    );
  }

  function renderFollowerAlert(data: any) {
    return (
      <div class="alert-content bg-linear-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 shadow-2xl text-center animate-bounce-in">
        <div class="text-white text-5xl mb-4">❤️</div>
        <div class="text-white text-4xl font-bold mb-2">
          {data.username} just followed!
        </div>
        <div class="text-white text-xl">Welcome to the community!</div>
      </div>
    );
  }

  function renderSubscriberAlert(data: any) {
    return (
      <div class="alert-content bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 shadow-2xl text-center animate-bounce-in">
        <div class="text-white text-5xl mb-4">⭐</div>
        <div class="text-white text-4xl font-bold mb-2">
          {data.username} subscribed!
        </div>
        <Show when={data.months > 1}>
          <div class="text-white text-2xl">{data.months} month{data.months > 1 ? 's' : ''} strong!</div>
        </Show>
        <Show when={data.message}>
          <div class="text-white text-xl mt-4 italic">"{data.message}"</div>
        </Show>
      </div>
    );
  }

  function renderRaidAlert(data: any) {
    return (
      <div class="alert-content bg-linear-to-r from-orange-600 to-red-600 rounded-2xl p-8 shadow-2xl text-center animate-bounce-in">
        <div class="text-white text-5xl mb-4">🎉</div>
        <div class="text-white text-4xl font-bold mb-2">
          {data.username} is raiding!
        </div>
        <div class="text-white text-3xl">with {data.viewerCount} viewers!</div>
      </div>
    );
  }

  return (
    <div class="w-full h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <Show when={isAnimating() && currentAlert()}>
        {(alert) => (
          <div class="alert-container w-full max-w-4xl px-8">
            <Show when={alert().type === 'donation'}>
              {renderDonationAlert(alert().data)}
            </Show>
            <Show when={alert().type === 'follower'}>
              {renderFollowerAlert(alert().data)}
            </Show>
            <Show when={alert().type === 'subscriber'}>
              {renderSubscriberAlert(alert().data)}
            </Show>
            <Show when={alert().type === 'raid'}>
              {renderRaidAlert(alert().data)}
            </Show>
          </div>
        )}
      </Show>

      <Show when={!userId()}>
        <div class="text-white text-2xl bg-red-500 rounded-lg p-4">
          Error: No userId provided in URL parameters
        </div>
      </Show>
    </div>
  );
}
