interface Platform {
  icon: string
  color: string
}

type AlertType = 'donation' | 'follow' | 'subscription' | 'raid'

export interface AlertEvent {
  id: string
  type: AlertType
  username: string
  message?: string
  amount?: number
  currency?: string
  bits?: number
  months?: number
  tier?: string
  viewer_count?: number
  voice?: string
  tts_path?: string
  tts_url?: string
  timestamp: Date
  platform: Platform
  display_time: number
}

export interface AlertboxConfig {
  animation_type: 'slide' | 'fade' | 'bounce'
  display_duration: number
  sound_enabled: boolean
  sound_volume: number
  show_message: boolean
  show_amount: boolean
  font_size: 'small' | 'medium' | 'large'
  alert_position: 'top' | 'center' | 'bottom'
}

const usernames = [
  'GamerPro', 'StreamFan', 'CoolViewer', 'HappyDonator', 'EpicGamer',
  'NightOwl', 'MorningViewer', 'LoyalSub', 'FirstTimer', 'ReturningSub'
]

const donationMessages = [
  'Great stream! Keep it up!',
  'Love your content!',
  'Thanks for the entertainment!',
  'You\'re awesome!',
  'Best streamer ever!',
  'Hope this helps with the setup!',
  'Amazing gameplay!',
  'Can\'t wait for the next stream!',
  'You deserve this!',
  'Thanks for making my day!'
]

const subscriptionMessages = [
  'Happy to support!',
  'Love being part of the community!',
  'Worth every penny!',
  'Can\'t wait for subscriber perks!',
  'Here for the long haul!',
  'Best decision ever!',
  'Your content is worth it!',
  'Proud to be a subscriber!',
  'Thanks for all you do!',
  'Keep up the amazing work!'
]

const platforms: Platform[] = [
  { icon: 'twitch', color: 'bg-purple-600' },
  { icon: 'youtube', color: 'bg-red-600' },
  { icon: 'facebook', color: 'bg-blue-600' },
  { icon: 'kick', color: 'bg-green-600' }
]

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateHexId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

function generateDonationAmount(): number {
  const rand = Math.random()
  if (rand < 0.4) return Math.floor(Math.random() * 5) + 1 // $1-5
  if (rand < 0.7) return Math.floor(Math.random() * 15) + 6 // $6-20
  if (rand < 0.9) return Math.floor(Math.random() * 30) + 21 // $21-50
  return Math.floor(Math.random() * 450) + 51 // $51-500
}

function getDisplayDuration(type: AlertType, amount?: number, viewerCount?: number): number {
  switch (type) {
    case 'donation':
      if (amount && amount >= 50) return 8
      if (amount && amount >= 10) return 6
      return 4
    case 'raid':
      if (viewerCount && viewerCount >= 10) return 6
      return 4
    case 'subscription':
      return 5
    case 'follow':
      return 3
    default:
      return 4
  }
}

export function defaultConfig(): AlertboxConfig {
  return {
    animation_type: 'fade',
    display_duration: 5,
    sound_enabled: true,
    sound_volume: 75,
    show_message: true,
    show_amount: true,
    font_size: 'medium',
    alert_position: 'center'
  }
}

export function generateEvent(): AlertEvent {
  const type = randomElement<AlertType>(['donation', 'follow', 'subscription', 'raid'])
  const username = randomElement(usernames)
  const platform = randomElement(platforms)

  const baseEvent = {
    id: generateHexId(),
    type,
    username,
    timestamp: new Date(),
    platform,
    display_time: 0
  }

  switch (type) {
    case 'donation': {
      const amount = generateDonationAmount()
      const message = Math.random() > 0.3 ? randomElement(donationMessages) : undefined
      return {
        ...baseEvent,
        amount,
        currency: '$',
        message,
        display_time: getDisplayDuration('donation', amount)
      }
    }
    case 'subscription': {
      const message = Math.random() > 0.5 ? randomElement(subscriptionMessages) : undefined
      return {
        ...baseEvent,
        message,
        display_time: getDisplayDuration('subscription')
      }
    }
    case 'follow': {
      const message = Math.random() > 0.9 ? 'Thanks for the follow!' : undefined
      return {
        ...baseEvent,
        message,
        display_time: getDisplayDuration('follow')
      }
    }
    case 'raid': {
      const viewers = Math.floor(Math.random() * 495) + 5
      return {
        ...baseEvent,
        message: `Raiding with ${viewers} viewers!`,
        viewer_count: viewers,
        display_time: getDisplayDuration('raid', undefined, viewers)
      }
    }
  }
}
