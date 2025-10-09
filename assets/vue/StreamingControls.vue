<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import StreamMetricsAndSettings from './StreamMetricsAndSettings.vue'

interface StreamStatus {
  status: string
  input_streaming_status: string
  can_start_streaming: boolean
  rtmp_url: string | null
  stream_key: string | null
  manager_available: boolean
  youtube_broadcast_id: string | null
}

interface StreamData {
  started_at: string
  viewer_counts: {
    twitch: number
    youtube: number
    facebook: number
    kick: number
  }
  total_viewers: number
  initial_message_count: number
  title: string
  description: string
  thumbnail_url?: string | null
}

interface ChatMessage {
  id: string
  sender_username: string
  message: string
  platform: string
  timestamp: string
}

interface StreamEvent {
  id: string
  type: string
  username: string
  amount?: number
  tier?: string
  viewers?: number
  platform: string
  timestamp: string
}

const props = withDefaults(defineProps<{
  streamStatus: StreamStatus
  streamData: StreamData
  loading: boolean
  chatMessages: ChatMessage[]
  streamEvents: StreamEvent[]
  hideStopButton?: boolean
}>(), {
  hideStopButton: false
})

const emit = defineEmits<{
  stopStreaming: []
  saveSettings: [{ title: string; description: string }]
  sendChatMessage: [string]
}>()

// Client-side state
const streamDuration = ref(0)
const bitrate = ref(0)
const fps = ref(0)
const showSettings = ref(false)

let durationInterval: number | null = null

// Calculate duration based on started_at
const updateDuration = () => {
  if (!props.streamData?.started_at) return

  const startTime = new Date(props.streamData.started_at).getTime()
  const now = Date.now()
  streamDuration.value = Math.floor((now - startTime) / 1000)
}

const viewerCount = computed(() => {
  return props.streamData?.total_viewers || 0
})

const chatMessageCount = computed(() => {
  const initialCount = props.streamData?.initial_message_count || 0
  const newMessagesCount = props.chatMessages?.length || 0
  return initialCount + newMessagesCount
})

const formatDuration = computed(() => {
  const hours = Math.floor(streamDuration.value / 3600)
  const minutes = Math.floor((streamDuration.value % 3600) / 60)
  const seconds = streamDuration.value % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const isTwitchBroadcasting = computed(() => {
  return false
})

const isFacebookBroadcasting = computed(() => {
  return false
})

const isKickBroadcasting = computed(() => {
  return false
})

const hasActiveBroadcasts = computed(() => {
  return !!props.streamStatus.youtube_broadcast_id ||
         isTwitchBroadcasting.value ||
         isFacebookBroadcasting.value ||
         isKickBroadcasting.value
})

onMounted(() => {
  updateDuration()

  durationInterval = setInterval(() => {
    updateDuration()
    // Simulate some metrics for now (replace with real data later)
    bitrate.value = Math.floor(Math.random() * 1000) + 4000
    fps.value = Math.floor(Math.random() * 5) + 55
  }, 1000)
})

onUnmounted(() => {
  if (durationInterval !== null) {
    clearInterval(durationInterval)
  }
})

const handleStopStream = () => {
  emit('stopStreaming')
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const handleSaveSettings = (settings: { title: string; description: string }) => {
  emit('saveSettings', settings)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Live Indicator with Settings Button -->
    <div class="flex items-center gap-3">
      <div class="flex items-center space-x-3">
        <div class="relative">
          <div class="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          <div class="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
        </div>
        <div>
          <div class="text-lg font-bold text-red-700">LIVE NOW</div>
          <div class="text-sm text-red-600">Duration: {{ formatDuration }} • {{ viewerCount }} viewers</div>
        </div>
      </div>
      <!-- Stream Stats -->
      <div class="flex items-center gap-3 px-4 py-2 bg-white rounded-md border border-gray-300 ml-auto">
        <div class="text-center">
          <div class="text-xs text-gray-500">Bitrate</div>
          <div class="text-sm font-semibold text-gray-900">{{ (bitrate / 1000).toFixed(1) }}k</div>
        </div>
        <div class="h-8 w-px bg-gray-200"></div>
        <div class="text-center">
          <div class="text-xs text-gray-500">FPS</div>
          <div class="text-sm font-semibold text-gray-900">{{ fps }}</div>
        </div>
        <div class="h-8 w-px bg-gray-200"></div>
        <div class="text-center">
          <div class="text-xs text-gray-500">Health</div>
          <div class="flex items-center justify-center gap-1">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <div class="text-xs font-semibold text-green-600">Excellent</div>
          </div>
        </div>
      </div>
      <button
        @click="toggleSettings"
        class="p-3 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
        title="Stream Settings"
      >
        <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      <button
        v-if="!hideStopButton"
        @click="handleStopStream"
        :disabled="loading"
        class="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg"
      >
        {{ loading ? 'Stopping...' : '🛑 STOP STREAM' }}
      </button>
    </div>

    <!-- Stream Metrics and Settings Component -->
    <StreamMetricsAndSettings
      :viewer-count="viewerCount"
      :chat-message-count="chatMessageCount"
      :bitrate="bitrate"
      :fps="fps"
      :chat-messages="chatMessages"
      :stream-events="streamEvents"
      :stream-data="streamData"
      :show-settings="showSettings"
      @toggle-settings="toggleSettings"
      @save-settings="handleSaveSettings"
      @send-chat-message="(message) => $emit('sendChatMessage', message)"
    />

    <!-- Platform Status Indicators -->
    <div v-if="hasActiveBroadcasts" class="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div class="text-sm font-medium text-gray-700 mb-3">Broadcasting To:</div>
      <div class="flex flex-wrap gap-2">
        <!-- YouTube -->
        <a
          v-if="streamStatus.youtube_broadcast_id"
          :href="`https://youtu.be/${streamStatus.youtube_broadcast_id}`"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center px-3 py-1.5 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span class="text-sm font-medium text-red-700">YouTube</span>
          <span class="text-xs text-gray-500 ml-2">({{ streamData?.viewer_counts?.youtube || 0 }})</span>
          <svg class="w-3 h-3 ml-1.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        <!-- Twitch -->
        <div
          v-if="isTwitchBroadcasting"
          class="inline-flex items-center px-3 py-1.5 bg-white border border-purple-200 rounded-lg opacity-50"
          title="Twitch stream link coming soon"
        >
          <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span class="text-sm font-medium text-purple-700">Twitch</span>
          <span class="text-xs text-gray-500 ml-2">({{ streamData.viewer_counts.twitch }})</span>
        </div>

        <!-- Facebook -->
        <div
          v-if="isFacebookBroadcasting"
          class="inline-flex items-center px-3 py-1.5 bg-white border border-blue-200 rounded-lg opacity-50"
          title="Facebook stream link coming soon"
        >
          <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span class="text-sm font-medium text-blue-700">Facebook</span>
          <span class="text-xs text-gray-500 ml-2">({{ streamData.viewer_counts.facebook }})</span>
        </div>

        <!-- Kick -->
        <div
          v-if="isKickBroadcasting"
          class="inline-flex items-center px-3 py-1.5 bg-white border border-green-200 rounded-lg opacity-50"
          title="Kick stream link coming soon"
        >
          <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span class="text-sm font-medium text-green-700">Kick</span>
          <span class="text-xs text-gray-500 ml-2">({{ streamData.viewer_counts.kick }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
