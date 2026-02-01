import { z } from "zod";
import type { FormMeta } from "~/lib/schema-form/types";

// =============================================================================
// Constants
// =============================================================================

// Maximum number of activities to keep in memory for performance
export const MAX_ACTIVITIES = 200;

// Stream categories
export const STREAM_CATEGORIES = [
  "Gaming",
  "Just Chatting",
  "Music",
  "Art",
  "Software Development",
  "Education",
  "Sports",
  "Other",
] as const;

// Available platforms for chat
export const AVAILABLE_PLATFORMS = [
  "twitch",
  "youtube",
  "kick",
  "facebook",
] as const;

// All available activity types for filtering
export const ALL_ACTIVITY_TYPES: ActivityType[] = [
  "chat",
  "donation",
  "follow",
  "subscription",
  "raid",
  "cheer",
];

// Labels for activity types in filter UI
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  chat: "Chat",
  donation: "Donations",
  follow: "Follows",
  subscription: "Subs",
  raid: "Raids",
  cheer: "Cheers",
};

// Row height constant for sticky offset calculations
export const ACTIVITY_ROW_HEIGHT = 52; // px - accounts for padding and content

// Timeout duration presets in seconds
export const TIMEOUT_PRESETS = [
  { label: "1m", seconds: 60 },
  { label: "5m", seconds: 300 },
  { label: "10m", seconds: 600 },
  { label: "1h", seconds: 3600 },
  { label: "24h", seconds: 86400 },
] as const;

// Maximum sticky items
export const MAX_STICKY_ITEMS = 3;

// =============================================================================
// Types
// =============================================================================

export type Platform = (typeof AVAILABLE_PLATFORMS)[number];

// Types for stream metadata
export interface StreamMetadata {
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailFileId?: string;
  thumbnailUrl?: string;
  enabledPlatforms?: string[];
}

// Types for stream key data
export interface StreamKeyData {
  rtmpsUrl: string;
  rtmpsStreamKey: string;
  srtUrl?: string;
  webRtcUrl?: string;
}

// Types for activity feed items
export type ActivityType =
  | "chat"
  | "donation"
  | "follow"
  | "subscription"
  | "raid"
  | "cheer";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  username: string;
  message?: string;
  amount?: number;
  currency?: string;
  platform: string;
  timestamp: Date | string;
  isImportant?: boolean;
  // Additional fields needed for moderation actions
  viewerId?: string;
  viewerPlatformId?: string;
  // Sent message tracking
  isSentByStreamer?: boolean;
  deliveryStatus?: Record<string, string>;
  // Alertbox display tracking
  wasDisplayed?: boolean;
}

// Moderation action callbacks
export interface ModerationCallbacks {
  onReplayEvent?: (eventId: string) => void;
  onBanUser?: (
    userId: string,
    platform: string,
    viewerPlatformId: string,
    username: string,
    reason?: string,
  ) => void;
  onTimeoutUser?: (
    userId: string,
    platform: string,
    viewerPlatformId: string,
    username: string,
    durationSeconds: number,
    reason?: string,
  ) => void;
  onDeleteMessage?: (eventId: string) => void;
  onHighlightMessage?: (item: ActivityItem) => void;
  onClearHighlight?: () => void;
  highlightedMessageId?: string;
  currentAlertEventId?: string;
}

// Types for stream summary
export interface StreamSummary {
  duration: number; // in seconds
  peakViewers: number;
  averageViewers: number;
  totalMessages: number;
  totalDonations: number;
  donationAmount: number;
  newFollowers: number;
  newSubscribers: number;
  raids: number;
  endedAt: Date | string;
}

// Stream phase types
export type StreamPhase = "pre-stream" | "live" | "post-stream";

// View mode for live stream (events, actions, or specific action widgets)
export type LiveViewMode =
  | "events"
  | "actions"
  | "poll"
  | "giveaway"
  | "timers"
  | "settings";

// Stream Timer Item Interface
export interface StreamTimer {
  id: string;
  label: string;
  content: string;
  intervalSeconds: number;
  disabledAt: string | null;
}

// =============================================================================
// Poll Creation Schema
// =============================================================================
export const pollCreationSchema = z.object({
  question: z.string().default(""),
  option1: z.string().default(""),
  option2: z.string().default(""),
  option3: z.string().default(""),
  option4: z.string().default(""),
  duration: z.number().min(1).max(60).default(5),
  allowMultipleVotes: z.boolean().default(false),
});

export type PollCreationValues = z.infer<typeof pollCreationSchema>;

export const pollCreationMeta: FormMeta<typeof pollCreationSchema.shape> = {
  question: {
    label: "Poll Question",
    placeholder: "What should we play next?",
  },
  option1: {
    label: "Option 1",
    placeholder: "First choice",
  },
  option2: {
    label: "Option 2",
    placeholder: "Second choice",
  },
  option3: {
    label: "Option 3 (optional)",
    placeholder: "Third choice",
  },
  option4: {
    label: "Option 4 (optional)",
    placeholder: "Fourth choice",
  },
  duration: {
    label: "Duration",
    unit: "minutes",
  },
  allowMultipleVotes: {
    label: "Allow Multiple Votes",
    description: "Let viewers vote for more than one option",
  },
};

// =============================================================================
// Giveaway Creation Schema
// =============================================================================
export const giveawayCreationSchema = z.object({
  title: z.string().default("Stream Giveaway"),
  description: z.string().default(""),
  keyword: z.string().default("!join"),
  duration: z.number().min(1).max(60).default(10),
  subscriberMultiplier: z.number().min(1).max(10).default(2),
  subscriberOnly: z.boolean().default(false),
});

export type GiveawayCreationValues = z.infer<typeof giveawayCreationSchema>;

export const giveawayCreationMeta: FormMeta<
  typeof giveawayCreationSchema.shape
> = {
  title: {
    label: "Giveaway Title",
    placeholder: "Enter giveaway title",
  },
  description: {
    label: "Description",
    placeholder: "What are you giving away?",
  },
  keyword: {
    label: "Entry Keyword",
    placeholder: "!join",
    description: "Viewers type this in chat to enter",
  },
  duration: {
    label: "Duration",
    unit: "minutes",
  },
  subscriberMultiplier: {
    label: "Subscriber Multiplier",
    description: "Extra entries for subscribers (e.g., 2x = double chance)",
  },
  subscriberOnly: {
    label: "Subscribers Only",
    description: "Only subscribers can enter the giveaway",
  },
};

// =============================================================================
// Callback Interfaces
// =============================================================================

export interface StreamActionCallbacks {
  onStartPoll?: (data: PollCreationValues) => void;
  onStartGiveaway?: (data: GiveawayCreationValues) => void;
  onModifyTimers?: () => void;
  onChangeStreamSettings?: () => void;
}

export interface TimerActionCallbacks {
  onAddTimer?: (
    label: string,
    content: string,
    intervalMinutes: number,
  ) => void;
  onToggleTimer?: (timerId: string, enabled: boolean) => void;
  onDeleteTimer?: (timerId: string) => void;
}

// =============================================================================
// Smart Filter Types and Parsing
// =============================================================================

// Available smart filter prefixes
const _SMART_FILTER_PREFIXES = ["user:", "message:", "platform:"] as const;

// Parsed filter result
export interface ParsedFilters {
  user: string[];
  message: string[];
  platform: string[];
  freeText: string[];
}

/**
 * Parse a search query into smart filters.
 *
 * Supports:
 * - `user:` - Match only usernames
 * - `message:` - Match only message content
 * - `platform:` - Match by platform
 * - Free text (no prefix) - Searches both username and message
 *
 * Multiple words after a filter prefix are captured until the next filter prefix.
 *
 * Examples:
 * - "user:ninja" -> { user: ["ninja"], message: [], platform: [], freeText: [] }
 * - "user:ninja platform:twitch" -> { user: ["ninja"], message: [], platform: ["twitch"], freeText: [] }
 * - "hello world" -> { user: [], message: [], platform: [], freeText: ["hello world"] }
 * - "user:john doe message:hello" -> { user: ["john doe"], message: ["hello"], platform: [], freeText: [] }
 */
export function parseSmartFilters(query: string): ParsedFilters {
  const result: ParsedFilters = {
    user: [],
    message: [],
    platform: [],
    freeText: [],
  };

  if (!query.trim()) {
    return result;
  }

  // Pattern to find filter prefixes with their content
  // Captures: prefix (user:|message:|platform:) and content until next prefix or end
  const filterPattern =
    /\b(user:|message:|platform:)((?:(?!(?:user:|message:|platform:)).)*)/gi;

  // First pass: find all matches and their positions
  const matches: { prefix: string; content: string; start: number }[] = [];
  const allMatches = query.matchAll(filterPattern);

  for (const match of allMatches) {
    matches.push({
      prefix: match[1].toLowerCase(),
      content: match[2].trim(),
      start: match.index ?? 0,
    });
  }

  // Extract free text (text before first filter or between filters if any)
  if (matches.length === 0) {
    // No filters found, everything is free text
    const trimmed = query.trim();
    if (trimmed) {
      result.freeText.push(trimmed);
    }
  } else {
    // Check for free text before the first filter
    const firstFilterStart = matches[0].start;
    if (firstFilterStart > 0) {
      const freeTextBefore = query.substring(0, firstFilterStart).trim();
      if (freeTextBefore) {
        result.freeText.push(freeTextBefore);
      }
    }

    // Process each matched filter
    for (const m of matches) {
      const content = m.content;
      if (!content) continue;

      switch (m.prefix) {
        case "user:":
          result.user.push(content.toLowerCase());
          break;
        case "message:":
          result.message.push(content.toLowerCase());
          break;
        case "platform:":
          result.platform.push(content.toLowerCase());
          break;
      }
    }
  }

  return result;
}

// =============================================================================
// Helper Functions
// =============================================================================

// Determine importance of events (for sticky behavior)
export const isImportantEvent = (type: ActivityType): boolean => {
  return ["donation", "raid", "subscription", "cheer"].includes(type);
};

// Get event icon
export const getEventIcon = (type: ActivityType): string => {
  switch (type) {
    case "donation":
      return "$";
    case "follow":
      return "+";
    case "subscription":
      return "*";
    case "raid":
      return ">";
    case "cheer":
      return "~";
    default:
      return "";
  }
};

// Get event color
export const getEventColor = (type: ActivityType): string => {
  switch (type) {
    case "donation":
      return "text-green-400";
    case "follow":
      return "text-blue-400";
    case "subscription":
      return "text-purple-400";
    case "raid":
      return "text-orange-400";
    case "cheer":
      return "text-pink-400";
    default:
      return "text-neutral-300";
  }
};
