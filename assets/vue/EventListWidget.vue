<script setup lang="ts">
import { ref, computed, onMounted, watch, toRaw } from 'vue'

interface StreamEvent {
  id: string
  type: 'donation' | 'follow' | 'subscription' | 'raid' | 'chat_message'
  username: string
  message?: string
  amount?: number
  currency?: string
  timestamp: Date
  platform: {
    icon: string
    color: string
  }
  data?: any
}

interface EventListConfig {
  animation_type: 'slide' | 'fade' | 'bounce'
  max_events: number
  event_types: string[]
  show_timestamps: boolean
  show_platform: boolean
  show_amounts: boolean
  font_size: 'small' | 'medium' | 'large'
  compact_mode: boolean
}

const props = defineProps<{
  config: EventListConfig
  events: StreamEvent[]
  id?: string
}>()

const widgetId = props.id || 'eventlist-widget'
const eventListContainer = ref<HTMLElement>()
const displayedEvents = ref<StreamEvent[]>([])

const fontClass = computed(() => {
  switch (props.config.font_size) {
    case 'small': return 'text-sm'
    case 'large': return 'text-lg'
    default: return 'text-base'
  }
})

const getEventColor = (type: string) => {
  const colors = {
    donation: 'text-green-400',
    follow: 'text-blue-400',
    subscription: 'text-purple-400',
    raid: 'text-yellow-400',
    chat_message: 'text-gray-300'
  }
  return colors[type as keyof typeof colors] || colors.chat_message
}

const getEventIcon = (type: string) => {
  const icons = {
    donation: '💰',
    follow: '❤️',
    subscription: '⭐',
    raid: '⚡',
    chat_message: '💬'
  }
  return icons[type as keyof typeof icons] || icons.chat_message
}

const getEventLabel = (type: string) => {
  const labels = {
    donation: 'Donation',
    follow: 'Follow',
    subscription: 'Sub',
    raid: 'Raid',
    chat_message: 'Chat'
  }
  return labels[type as keyof typeof labels] || 'Event'
}

const getPlatformName = (icon: string) => {
  const platformNames = {
    twitch: 'Twitch',
    youtube: 'YouTube',
    facebook: 'Facebook',
    kick: 'Kick'
  }
  return platformNames[icon as keyof typeof platformNames] || icon
}

const formatAmount = (amount?: number, currency?: string) => {
  if (!amount) return ''
  return `${currency || '$'}${amount.toFixed(2)}`
}

const formatTimestamp = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
}

const shouldShowEvent = (event: StreamEvent) => {
  return props.config.event_types.includes(event.type)
}

const processEvents = (newEvents: StreamEvent[]) => {
  if (!newEvents || newEvents.length === 0) {
    displayedEvents.value = []
    return
  }

  // Filter events based on configuration
  const filteredEvents = newEvents
    .filter(shouldShowEvent)
    .slice(0, props.config.max_events)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  displayedEvents.value = filteredEvents
}

// Animation classes
const getAnimationClass = (index: number) => {
  const baseAnimation = (() => {
    switch (props.config.animation_type) {
      case 'slide': return 'slide'
      case 'bounce': return 'bounce'
      default: return 'fade'
    }
  })()

  return `animate-${baseAnimation}-in-delayed`
}

// Watch for events changes
watch(() => props.events, (newEvents) => {
  processEvents(newEvents || [])
}, { immediate: true, deep: true })

// Watch for config changes
watch(() => props.config, (newConfig) => {
  processEvents(props.events || [])
}, { deep: true })

onMounted(() => {
  processEvents(props.events || [])
})
</script>

<template>
  <div class="eventlist-widget h-full w-full relative overflow-hidden">
    <div
      ref="eventListContainer"
      :id="`eventlist-container-${widgetId}`"
      :class="`h-full w-full overflow-y-auto ${props.config.compact_mode ? 'p-2 space-y-2' : 'p-4 space-y-3'}`"
    >
      <!-- Event List -->
      <div v-if="displayedEvents.length > 0" :class="props.config.compact_mode ? 'space-y-1' : 'space-y-2'">
        <div
          v-for="(event, index) in displayedEvents"
          :key="event.id"
          :class="`event-item relative transition-all duration-300 ${getAnimationClass(index)} ${props.config.compact_mode ? 'p-2 bg-gray-900/80 rounded border border-white/10' : 'p-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-lg border border-white/20 backdrop-blur-lg shadow-lg'}`"
          :style="{ 'animation-delay': `${index * 100}ms` }"
        >
          <!-- Glowing border effect (only for non-compact mode) -->
          <div v-if="!props.config.compact_mode" class="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-30 blur-sm"></div>

          <!-- Content -->
          <div class="relative z-10">
            <div v-if="props.config.compact_mode" class="flex items-center justify-between">
              <!-- Compact layout: single row -->
              <div class="flex items-center space-x-2 flex-1 min-w-0">
                <span class="text-sm">{{ getEventIcon(event.type) }}</span>
                <div class="text-sm font-medium text-white truncate">{{ event.username }}</div>
                <div v-if="props.config.show_amounts && event.amount && event.type === 'donation'" class="text-sm font-bold text-green-400">
                  {{ formatAmount(event.amount, event.currency) }}
                </div>
              </div>
              <div v-if="props.config.show_timestamps" class="text-xs text-gray-400 ml-2">
                {{ formatTimestamp(event.timestamp) }}
              </div>
            </div>

            <!-- Non-compact layout -->
            <template v-else>
              <div :class="`flex items-center justify-between mb-2`">
                <!-- Event Type and Username -->
                <div class="flex items-center space-x-2">
                  <span class="text-lg">{{ getEventIcon(event.type) }}</span>
                  <div>
                    <div :class="`font-semibold ${getEventColor(event.type)} ${fontClass}`">
                      {{ event.username }}
                    </div>
                    <div :class="`text-xs text-gray-400 uppercase tracking-wide`">
                      {{ getEventLabel(event.type) }}
                    </div>
                  </div>
                </div>

                <!-- Timestamp -->
                <div v-if="props.config.show_timestamps" :class="`text-xs text-gray-400 ${fontClass}`">
                  {{ formatTimestamp(event.timestamp) }}
                </div>
              </div>

              <!-- Amount (for donations) -->
              <div
                v-if="props.config.show_amounts && event.amount && event.type === 'donation'"
                class="mb-2"
              >
                <div :class="`font-bold text-green-400 ${fontClass}`">
                  {{ formatAmount(event.amount, event.currency) }}
                </div>
              </div>

              <!-- Message -->
              <div
                v-if="event.message && event.message.trim() !== ''"
                :class="`text-gray-200 leading-relaxed ${fontClass}`"
              >
                {{ event.message }}
              </div>

              <!-- Platform badge -->
              <div v-if="props.config.show_platform" class="flex justify-end mt-2">
                <div class="px-2 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-white">
                  {{ getPlatformName(event.platform.icon) }}
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex items-center justify-center h-full">
        <div class="text-center text-gray-400">
          <div class="text-4xl mb-4">📋</div>
          <div :class="`font-medium ${fontClass}`">No events yet</div>
          <div class="text-sm mt-2">Events will appear here as they happen</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.eventlist-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
}

.event-item {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -1px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Custom scrollbar for event list */
.eventlist-widget ::-webkit-scrollbar {
  width: 6px;
}

.eventlist-widget ::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.eventlist-widget ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.eventlist-widget ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Animation keyframes */
@keyframes fade-in-delayed {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-delayed {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes bounce-in-delayed {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-fade-in-delayed {
  animation: fade-in-delayed 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-slide-in-delayed {
  animation: slide-in-delayed 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-bounce-in-delayed {
  animation: bounce-in-delayed 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Hover effects for events */
.event-item:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 15px -3px rgba(0, 0, 0, 0.4),
    0 4px 6px -2px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
</style>