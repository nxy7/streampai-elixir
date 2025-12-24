import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, Show, For } from "solid-js";
import { createSubscription } from "@urql/solid";
import { graphql } from "~/lib/graphql";

const DONATION_SUBSCRIPTION = graphql(`
  subscription DonationReceived($userId: ID!) {
    donationReceived(userId: $userId) {
      id
      amount
      currency
      username
      message
      timestamp
      platform
    }
  }
`);

const FOLLOWER_SUBSCRIPTION = graphql(`
  subscription FollowerAdded($userId: ID!) {
    followerAdded(userId: $userId) {
      id
      username
      timestamp
      platform
    }
  }
`);

const SUBSCRIBER_SUBSCRIPTION = graphql(`
  subscription SubscriberAdded($userId: ID!) {
    subscriberAdded(userId: $userId) {
      id
      username
      tier
      months
      message
      timestamp
      platform
    }
  }
`);

const RAID_SUBSCRIPTION = graphql(`
  subscription RaidReceived($userId: ID!) {
    raidReceived(userId: $userId) {
      id
      username
      viewerCount
      timestamp
      platform
    }
  }
`);

const CHEER_SUBSCRIPTION = graphql(`
  subscription CheerReceived($userId: ID!) {
    cheerReceived(userId: $userId) {
      id
      username
      bits
      message
      timestamp
      platform
    }
  }
`);

type Event = {
  id: string;
  type: 'donation' | 'follower' | 'subscriber' | 'raid' | 'cheer';
  username: string;
  description: string;
  icon: string;
  color: string;
  timestamp: Date;
};

export default function EventListOBS() {
  const [params] = useSearchParams();
  const userId = () => (Array.isArray(params.userId) ? params.userId[0] : params.userId);
  const maxEvents = () => parseInt(params.maxEvents || "10");

  const [events, setEvents] = createSignal<Event[]>([]);

  const [donationResult] = createSubscription({
    query: DONATION_SUBSCRIPTION,
    variables: { userId: userId() },
    pause: !userId(),
  });

  const [followerResult] = createSubscription({
    query: FOLLOWER_SUBSCRIPTION,
    variables: { userId: userId() },
    pause: !userId(),
  });

  const [subscriberResult] = createSubscription({
    query: SUBSCRIBER_SUBSCRIPTION,
    variables: { userId: userId() },
    pause: !userId(),
  });

  const [raidResult] = createSubscription({
    query: RAID_SUBSCRIPTION,
    variables: { userId: userId() },
    pause: !userId(),
  });

  const [cheerResult] = createSubscription({
    query: CHEER_SUBSCRIPTION,
    variables: { userId: userId() },
    pause: !userId(),
  });

  function addEvent(event: Event) {
    setEvents(prev => {
      const updated = [event, ...prev];
      return updated.slice(0, maxEvents());
    });
  }

  createEffect(() => {
    if (donationResult()?.data?.donationReceived) {
      const data = donationResult.data.donationReceived;
      addEvent({
        id: data.id,
        type: 'donation',
        username: data.username,
        description: `Donated ${data.currency}${data.amount}`,
        icon: '💰',
        color: 'from-purple-600 to-pink-600',
        timestamp: new Date(data.timestamp)
      });
    }
  });

  createEffect(() => {
    if (followerResult()?.data?.followerAdded) {
      const data = followerResult.data.followerAdded;
      addEvent({
        id: data.id,
        type: 'follower',
        username: data.username,
        description: 'Followed',
        icon: '❤️',
        color: 'from-pink-600 to-red-600',
        timestamp: new Date(data.timestamp)
      });
    }
  });

  createEffect(() => {
    if (subscriberResult()?.data?.subscriberAdded) {
      const data = subscriberResult.data.subscriberAdded;
      addEvent({
        id: data.id,
        type: 'subscriber',
        username: data.username,
        description: data.months > 1 ? `Subscribed (${data.months} months)` : 'Subscribed',
        icon: '⭐',
        color: 'from-indigo-600 to-purple-600',
        timestamp: new Date(data.timestamp)
      });
    }
  });

  createEffect(() => {
    if (raidResult()?.data?.raidReceived) {
      const data = raidResult.data.raidReceived;
      addEvent({
        id: data.id,
        type: 'raid',
        username: data.username,
        description: `Raided with ${data.viewerCount} viewers`,
        icon: '🎉',
        color: 'from-orange-600 to-red-600',
        timestamp: new Date(data.timestamp)
      });
    }
  });

  createEffect(() => {
    if (cheerResult()?.data?.cheerReceived) {
      const data = cheerResult.data.cheerReceived;
      addEvent({
        id: data.id,
        type: 'cheer',
        username: data.username,
        description: `Cheered ${data.bits} bits`,
        icon: '💎',
        color: 'from-blue-600 to-cyan-600',
        timestamp: new Date(data.timestamp)
      });
    }
  });

  return (
    <div class="w-full h-screen bg-transparent overflow-hidden flex flex-col p-4">
      <Show when={userId()} fallback={
        <div class="text-white text-2xl bg-red-500 rounded-lg p-4">
          Error: No userId provided in URL parameters
        </div>
      }>
        <div class="flex-1 overflow-hidden">
          <div class="space-y-2">
            <For each={events()}>
              {(event) => (
                <div class={`bg-linear-to-r ${event.color} rounded-lg p-4 shadow-lg animate-slide-in-right`}>
                  <div class="flex items-center gap-3">
                    <div class="text-3xl">{event.icon}</div>
                    <div class="flex-1">
                      <div class="text-white font-bold text-lg">
                        {event.username}
                      </div>
                      <div class="text-white text-sm opacity-90">
                        {event.description}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
