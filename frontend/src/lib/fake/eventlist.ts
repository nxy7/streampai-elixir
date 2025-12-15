const EVENT_TYPES = ['donation', 'follow', 'subscription', 'raid', 'chat_message'] as const;

const PLATFORMS = ['twitch', 'youtube', 'facebook', 'kick'] as const;

const DONATION_MESSAGES = [
  "Keep up the great work!",
  "Love the stream! 💖",
  "Thanks for the entertainment!",
  "Here's a little something for you",
  "Amazing content as always!",
  "You deserve this and more!",
  "Keep being awesome!",
  "Love what you do!",
  "Great stream tonight!",
  "Thanks for making my day better!"
];

const FOLLOW_MESSAGES = [
  "New follower!",
  "Welcome to the family!",
  "Thanks for the follow!",
  "Another amazing person joins us!",
  "Welcome aboard!",
  "Happy to have you here!",
  "Thanks for joining the community!",
  "Welcome to the stream!",
  "Glad you found us!",
  "Welcome to the crew!"
];

const SUBSCRIPTION_MESSAGES = [
  "Thanks for the sub!",
  "Welcome to the sub club!",
  "Much appreciated!",
  "You're the best!",
  "Thanks for the support!",
  "Welcome to the subscriber family!",
  "Amazing, thank you!",
  "You rock!",
  "Thanks for believing in the stream!",
  "Subscriber hype!"
];

const RAID_MESSAGES = [
  "Thanks for the raid!",
  "Welcome raiders!",
  "Raid hype!",
  "Thanks for bringing the crew!",
  "Welcome everyone!",
  "Raid squad is here!",
  "Thanks for the love!",
  "Welcome to the stream raiders!",
  "Appreciate the raid!",
  "Amazing raid!"
];

const CHAT_MESSAGES = [
  "Hey everyone! How's the stream going?",
  "This is so entertaining!",
  "POGGERS",
  "Can't wait to see what happens next",
  "You're doing great!",
  "Love this game!",
  "First time here, loving it already!",
  "LUL that was funny",
  "Keep it up!",
  "This is why I love your streams",
  "Amazing plays!",
  "GG",
  "Hype!",
  "Best streamer ever!",
  "Can you play that song again?",
  "What's your setup?",
  "How long have you been streaming?",
  "Love the overlay!",
  "Your setup looks clean!",
  "Thanks for the stream!"
];

export interface StreamEvent {
  id: string;
  type: typeof EVENT_TYPES[number];
  username: string;
  message?: string;
  amount?: number;
  currency?: string;
  timestamp: Date;
  platform: {
    icon: typeof PLATFORMS[number];
    color: string;
  };
  data?: Record<string, any>;
}

export interface EventListConfig {
  animation_type: 'slide' | 'fade' | 'bounce';
  max_events: number;
  event_types: string[];
  show_timestamps: boolean;
  show_platform: boolean;
  show_amounts: boolean;
  font_size: 'small' | 'medium' | 'large';
  compact_mode: boolean;
}

const PLATFORM_COLORS: Record<typeof PLATFORMS[number], string> = {
  twitch: '#9146FF',
  youtube: '#FF0000',
  facebook: '#1877F2',
  kick: '#53FC18'
};

function generateUsername(): string {
  const adjectives = ['Cool', 'Epic', 'Super', 'Mega', 'Ultra', 'Pro', 'Elite', 'Master'];
  const nouns = ['Gamer', 'Player', 'Streamer', 'Viewer', 'Fan', 'User', 'Legend', 'Hero'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 1000)}`;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateEvent(): StreamEvent {
  const eventType = randomChoice(EVENT_TYPES);
  const platform = randomChoice(PLATFORMS);
  const username = generateUsername();

  const baseEvent: StreamEvent = {
    id: `event_${Math.floor(Math.random() * 10000)}`,
    type: eventType,
    username,
    timestamp: new Date(),
    platform: {
      icon: platform,
      color: PLATFORM_COLORS[platform]
    }
  };

  switch (eventType) {
    case 'donation': {
      const amount = randomChoice([5.00, 10.00, 25.00, 50.00, 100.00, 2.50, 7.50, 15.00, 20.00]);
      return {
        ...baseEvent,
        amount,
        currency: '$',
        message: randomChoice(DONATION_MESSAGES),
        data: {
          amount,
          currency: 'USD',
          message: randomChoice(DONATION_MESSAGES)
        }
      };
    }

    case 'follow':
      return {
        ...baseEvent,
        message: randomChoice(FOLLOW_MESSAGES),
        data: {
          message: randomChoice(FOLLOW_MESSAGES)
        }
      };

    case 'subscription': {
      const tier = randomChoice(['Tier 1', 'Tier 2', 'Tier 3']);
      const months = randomChoice([1, 2, 3, 6, 12, 24]);
      return {
        ...baseEvent,
        message: randomChoice(SUBSCRIPTION_MESSAGES),
        data: {
          tier,
          months,
          message: randomChoice(SUBSCRIPTION_MESSAGES)
        }
      };
    }

    case 'raid': {
      const viewerCount = randomChoice([5, 10, 25, 50, 100, 250, 500]);
      return {
        ...baseEvent,
        message: randomChoice(RAID_MESSAGES),
        data: {
          viewer_count: viewerCount,
          message: randomChoice(RAID_MESSAGES)
        }
      };
    }

    case 'chat_message':
      return {
        ...baseEvent,
        message: randomChoice(CHAT_MESSAGES),
        data: {
          message: randomChoice(CHAT_MESSAGES),
          badges: [],
          emotes: []
        }
      };

    default:
      return baseEvent;
  }
}

export function generateEvents(count: number = 10): StreamEvent[] {
  const baseTime = new Date();
  const events: StreamEvent[] = [];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(baseTime.getTime() - i * 30 * 1000);
    const event = generateEvent();
    event.timestamp = timestamp;
    event.id = `event_${Date.now()}_${i}`;
    events.push(event);
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function defaultConfig(): EventListConfig {
  return {
    animation_type: 'fade',
    max_events: 10,
    event_types: ['donation', 'follow', 'subscription', 'raid'],
    show_timestamps: false,
    show_platform: false,
    show_amounts: true,
    font_size: 'medium',
    compact_mode: true
  };
}
