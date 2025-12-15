const usernames = [
  "streamfan123", "gamingpro", "chattyboi", "lurkermax", "vipviewer",
  "moderatorjoe", "subguru", "donatorkid", "epicgamer99", "nightowl247",
  "podcastlover", "musicmaniac", "artfanatic", "comedykid", "sportsfan101",
  "techgeek", "bookworm42", "movielover", "naturelover", "travelbug"
];

const platforms = ["twitch", "youtube", "facebook", "kick"] as const;

export type Platform = typeof platforms[number];

export function generateHexId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

export function generateUsername(): string {
  return usernames[Math.floor(Math.random() * usernames.length)];
}

export function generatePlatform(): { icon: string; color: string } {
  const platform = platforms[Math.floor(Math.random() * platforms.length)];
  const colors = {
    twitch: "bg-purple-600",
    youtube: "bg-red-600",
    facebook: "bg-blue-600",
    kick: "bg-green-600"
  };

  return {
    icon: platform,
    color: colors[platform]
  };
}

export function generateDonationAmount(): number {
  const chance = Math.random() * 100;

  if (chance <= 50) return Math.floor(Math.random() * 5) + 1; // $1-$5
  if (chance <= 80) return Math.floor(Math.random() * 20) + 5; // $5-$25
  if (chance <= 95) return Math.floor(Math.random() * 75) + 25; // $25-$100
  return Math.floor(Math.random() * 400) + 100; // $100-$500
}

export function maybeRandom<T>(items: T[], probability = 0.7): T | undefined {
  if (Math.random() > probability) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export function randomBoolean(probability = 0.5): boolean {
  return Math.random() < probability;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
