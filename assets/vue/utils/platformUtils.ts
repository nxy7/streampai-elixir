/**
 * Platform utility functions for formatting and styling streaming platforms
 */

export function formatPlatformName(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'twitch':
      return 'Twitch'
    case 'youtube':
      return 'YouTube'
    case 'facebook':
      return 'Facebook'
    case 'kick':
      return 'Kick'
    default:
      return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase()
  }
}

export function getPlatformColor(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'twitch':
      return 'text-purple-600'
    case 'youtube':
      return 'text-red-600'
    case 'facebook':
      return 'text-blue-600'
    case 'kick':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
}

export function getPlatformIcon(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'twitch':
      return '🎮'
    case 'youtube':
      return '▶️'
    case 'facebook':
      return '👥'
    case 'kick':
      return '⚡'
    default:
      return '📺'
  }
}
