import { useLiveQuery } from "@tanstack/solid-db";
import { createMemo } from "solid-js";
import {
  streamEventsCollection,
  chatMessagesCollection,
  livestreamsCollection,
  viewersCollection,
  userPreferencesCollection,
  type StreamEvent,
  type ChatMessage,
  type Livestream,
  type Viewer,
  type UserPreferences,
} from "./electric";

export function useStreamEvents() {
  return useLiveQuery(() => streamEventsCollection);
}

export function useChatMessages() {
  return useLiveQuery(() => chatMessagesCollection);
}

export function useLivestreams() {
  return useLiveQuery(() => livestreamsCollection);
}

export function useViewers() {
  return useLiveQuery(() => viewersCollection);
}

export function useDonations() {
  const query = useStreamEvents();

  return {
    ...query,
    data: createMemo(() => {
      const data = query.data || [];
      return data.filter((e) => e.type === "donation");
    }),
  };
}

export function useFollows() {
  const query = useStreamEvents();

  return {
    ...query,
    data: createMemo(() => {
      const data = query.data || [];
      return data.filter((e) => e.type === "follow");
    }),
  };
}

export function useRaids() {
  const query = useStreamEvents();

  return {
    ...query,
    data: createMemo(() => {
      const data = query.data || [];
      return data.filter((e) => e.type === "raid");
    }),
  };
}

export function useCheers() {
  const query = useStreamEvents();

  return {
    ...query,
    data: createMemo(() => {
      const data = query.data || [];
      return data.filter((e) => e.type === "cheer");
    }),
  };
}

export function useTopDonors(limit: number = 10) {
  const query = useDonations();

  return createMemo(() => {
    const donations = query.data();
    const donationsByUser = new Map<string, { username: string; total: number; count: number }>();

    for (const donation of donations) {
      const username = (donation.data?.username as string) || donation.author_id;
      const amount = (donation.data?.amount as number) || 0;

      const existing = donationsByUser.get(username);
      if (existing) {
        existing.total += amount;
        existing.count += 1;
      } else {
        donationsByUser.set(username, { username, total: amount, count: 1 });
      }
    }

    return Array.from(donationsByUser.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  });
}

export function useTotalDonations() {
  const query = useDonations();

  return createMemo(() => {
    const donations = query.data();
    return donations.reduce((sum: number, d) => {
      const amount = (d.data?.amount as number) || 0;
      return sum + amount;
    }, 0);
  });
}

export function useRecentEvents(limit: number = 20) {
  const query = useStreamEvents();

  return createMemo(() => {
    const data = query.data || [];
    return [...data]
      .sort((a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime())
      .slice(0, limit);
  });
}

export function useUserPreferences() {
  return useLiveQuery(() => userPreferencesCollection);
}

export function useUserPreferencesForUser(userId: () => string | undefined) {
  const query = useLiveQuery(() => userPreferencesCollection);

  return {
    ...query,
    data: createMemo(() => {
      const id = userId();
      if (!id) return null;
      const data = query.data || [];
      return data.find((p) => p.id === id) || null;
    }),
  };
}

export { type StreamEvent, type ChatMessage, type Livestream, type Viewer, type UserPreferences };
