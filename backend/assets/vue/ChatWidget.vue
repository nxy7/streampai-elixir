<script setup lang="ts">
import { ref, computed } from 'vue'

interface Platform {
  icon: string
  color: string
}

interface Message {
  id: string
  username: string
  content: string
  timestamp: Date
  platform: Platform
  badge?: string
  badge_color?: string
  username_color?: string
  emotes?: string[]
}

interface ChatConfig {
  font_size: 'small' | 'medium' | 'large'
  show_timestamps: boolean
  show_badges: boolean
  show_platform: boolean
  show_emotes: boolean
  max_messages: number
}

const props = defineProps<{
  config: ChatConfig
  messages: Message[]
  id?: string
}>()


const widgetId = props.id || 'chat-widget'

const fontClass = computed(() => {
  switch (props.config.font_size) {
    case 'small': return 'text-xs'
    case 'large': return 'text-lg'
    default: return 'text-sm'
  }
})

const displayMessages = computed(() => {
  // Messages come from Elixir in reverse order (newest first)
  // Reverse them for chronological display (oldest first)
  return [...props.messages].reverse().slice(-props.config.max_messages)
})

const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const getPlatformIcon = (platform: Platform) => {
  const iconPaths = {
    twitch: "M11.64 5.93H13.07V10.21H11.64M15.57 5.93H17V10.21H15.57M7 2L3.43 5.57V18.43H7.71V22L11.29 18.43H14.14L20.57 12V2M18.86 11.29L16.71 13.43H14.14L12.29 15.29V13.43H8.57V3.71H18.86Z",
    youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    kick: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
  }
  
  return iconPaths[platform.icon as keyof typeof iconPaths] || "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
}

// Reference for the messages container (kept for potential future use)
const messagesContainer = ref<HTMLElement>()
</script>

<template>
  <div class="chat-widget text-white h-full w-full flex flex-col">
    <!-- Chat Messages Container -->
    <div
      ref="messagesContainer"
      :id="`chat-messages-${widgetId}`"
      class="flex-1 overflow-y-hidden p-3 chat-messages-container flex flex-col justify-end"
    >
      <div :id="`messages-${widgetId}`" class="flex flex-col gap-2">
        <div 
          v-for="message in displayMessages" 
          :key="message.id" 
          :class="`chat-message flex items-start space-x-2 ${fontClass}`"
        >
          <!-- Platform Icon (leftmost) -->
          <div 
            v-if="config.show_platform" 
            :class="`w-5 h-5 rounded flex items-center justify-center ${message.platform.color}`"
          >
            <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path :d="getPlatformIcon(message.platform)" />
            </svg>
          </div>
          
          <!-- User Badge/Avatar -->
          <div 
            v-if="config.show_badges && message.badge"
            :class="`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${message.badge_color}`"
          >
            {{ message.badge }}
          </div>
          
          <!-- Message Content -->
          <div class="flex-1 min-w-0">
            <span 
              v-if="config.show_timestamps" 
              class="text-xs text-gray-500 mr-2"
            >
              {{ formatTimestamp(message.timestamp) }}
            </span>
            <span 
              class="font-semibold" 
              :style="{ color: message.username_color }"
            >
              {{ message.username }}:
            </span>
            <span class="ml-1 text-gray-100">{{ message.content }}</span>
            
            <!-- Emotes/Reactions -->
            <div 
              v-if="config.show_emotes && message.emotes && message.emotes.length > 0"
              class="inline-flex ml-2 space-x-1"
            >
              <span 
                v-for="emote in message.emotes" 
                :key="emote" 
                class="text-yellow-400"
              >
                {{ emote }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
}

.chat-messages-container::-webkit-scrollbar {
  width: 6px;
}

.chat-messages-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.chat-messages-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.chat-messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>