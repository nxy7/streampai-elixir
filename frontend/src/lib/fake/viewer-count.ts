import { generateHexId, randomInt } from "./base";

const platforms = ["twitch", "youtube", "facebook", "kick"] as const;

export interface ViewerCountConfig {
  show_total: boolean;
  show_platforms: boolean;
  font_size: "small" | "medium" | "large";
  display_style: "minimal" | "detailed" | "cards";
  animation_enabled: boolean;
  icon_color: string;
  viewer_label: string;
}

export interface ViewerData {
  id: string;
  total_viewers: number;
  platform_breakdown: Record<string, {
    viewers: number;
    icon: string;
    color: string;
  }>;
  timestamp: Date;
}

const platformColors: Record<string, string> = {
  twitch: "bg-purple-600",
  youtube: "bg-red-600",
  facebook: "bg-blue-600",
  kick: "bg-green-600"
};

export function defaultConfig(): ViewerCountConfig {
  return {
    show_total: true,
    show_platforms: true,
    font_size: "medium",
    display_style: "detailed",
    animation_enabled: true,
    icon_color: "#ef4444",
    viewer_label: "viewers"
  };
}

function generateActivePlatforms(): string[] {
  const numPlatforms = randomInt(2, 4);
  const shuffled = [...platforms].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numPlatforms);
}

function generatePlatformViewerCount(): number {
  const chance = Math.random() * 100;

  if (chance <= 60) return randomInt(1, 50);
  if (chance <= 85) return randomInt(51, 200);
  if (chance <= 95) return randomInt(201, 1000);
  return randomInt(1001, 10000);
}

export function generateViewerData(): ViewerData {
  const activePlatforms = generateActivePlatforms();

  const platform_breakdown: Record<string, any> = {};

  for (const platform of activePlatforms) {
    platform_breakdown[platform] = {
      icon: platform,
      color: platformColors[platform],
      viewers: generatePlatformViewerCount()
    };
  }

  const total_viewers = Object.values(platform_breakdown).reduce(
    (sum, data) => sum + data.viewers,
    0
  );

  return {
    id: generateHexId(),
    total_viewers,
    platform_breakdown,
    timestamp: new Date()
  };
}

export function generateViewerUpdate(currentData: ViewerData): ViewerData {
  const updated_breakdown: Record<string, any> = {};

  for (const [platform, data] of Object.entries(currentData.platform_breakdown)) {
    const changeFactor = (randomInt(80, 130)) / 100;
    const newViewers = Math.max(1, Math.round(data.viewers * changeFactor));

    updated_breakdown[platform] = {
      ...data,
      viewers: newViewers
    };
  }

  const new_total = Object.values(updated_breakdown).reduce(
    (sum, data) => sum + data.viewers,
    0
  );

  return {
    ...currentData,
    platform_breakdown: updated_breakdown,
    total_viewers: new_total,
    timestamp: new Date()
  };
}
