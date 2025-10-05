<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import StreamSettingsFormFields from './StreamSettingsFormFields.vue'

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

interface StreamData {
  initial_message_count: number
  title: string
  description: string
}

const props = defineProps<{
  viewerCount: number
  chatMessageCount: number
  chatMessages: ChatMessage[]
  streamEvents: StreamEvent[]
  streamData: StreamData
  showSettings: boolean
}>()

const emit = defineEmits<{
  toggleSettings: []
  saveSettings: [{ title: string; description: string }]
  sendChatMessage: [string]
}>()

const activityContainer = ref<HTMLElement | null>(null)
const chatMessage = ref('')
const streamSettings = ref({
  title: '',
  description: '',
  thumbnailFile: null as File | null
})

onMounted(() => {
  // Initialize form with stream data
  streamSettings.value.title = props.streamData.title || ''
  streamSettings.value.description = props.streamData.description || ''
})

const allActivity = computed(() => {
  const chatActivity = (props.chatMessages || []).map(msg => ({
    ...msg,
    type: 'chat'
  }))

  const eventActivity = (props.streamEvents || []).map(event => ({
    ...event,
    type: 'event',
    eventType: event.type
  }))

  return [...chatActivity, ...eventActivity]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-50)
})

const scrollToBottom = () => {
  if (activityContainer.value) {
    activityContainer.value.scrollTop = activityContainer.value.scrollHeight
  }
}

watch(() => allActivity.value.length, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

const handleSaveSettings = () => {
  emit('saveSettings', {
    title: streamSettings.value.title,
    description: streamSettings.value.description
  })
  emit('toggleSettings')
}

const handleCancelSettings = () => {
  emit('toggleSettings')
}

const formatEventMessage = (event: any): string => {
  switch (event.eventType) {
    case 'donation':
      return `donated $${event.amount?.toFixed(2)}`
    case 'subscription':
      return event.tier ? `subscribed (Tier ${event.tier})` : 'subscribed'
    case 'raid':
      return `raided with ${event.viewers} viewers`
    case 'follow':
      return 'followed'
    default:
      return event.eventType
  }
}

const getEventIcon = (type: string): string => {
  switch (type) {
    case 'donation':
      return '💰'
    case 'subscription':
      return '⭐'
    case 'raid':
      return '🎯'
    case 'follow':
      return '❤️'
    default:
      return '🎉'
  }
}

const getPlatformColor = (platform: string): string => {
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

const getPlatformIcon = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case 'twitch':
      return '📺'
    case 'youtube':
      return '▶️'
    case 'facebook':
      return '👤'
    case 'kick':
      return '⚡'
    default:
      return '💬'
  }
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const handleSendMessage = () => {
  const message = chatMessage.value.trim()
  if (message) {
    emit('sendChatMessage', message)
    chatMessage.value = ''
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSendMessage()
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Stream Settings Form -->
    <div v-if="showSettings" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Stream Settings</h3>
      <StreamSettingsFormFields v-model="streamSettings" />
      <div class="flex space-x-3 mt-4">
        <button
          @click="handleSaveSettings"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
        >
          Save Settings
        </button>
        <button
          @click="handleCancelSettings"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Stream Metrics and Activity -->
    <template v-else>
      <!-- Live Activity Feed -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Live Activity</h3>
          <div class="text-xs text-gray-600">
            <span class="font-semibold">{{ chatMessageCount }}</span> messages
          </div>
        </div>
        <div ref="activityContainer" class="h-96 overflow-y-auto p-4 flex flex-col justify-end">
          <div v-if="allActivity.length === 0" class="flex items-center justify-center flex-1 text-gray-400 text-sm">
            No activity yet
          </div>
          <div v-else class="space-y-2">
          <template v-for="item in allActivity" :key="item.id">
            <!-- Chat Message -->
            <div
              v-if="item.type === 'chat'"
              class="flex items-center space-x-2 text-sm hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <div class="flex-shrink-0 text-sm">
                {{ getPlatformIcon(item.platform) }}
              </div>
              <div class="flex-shrink-0 text-xs text-gray-400">
                {{ formatTimestamp(item.timestamp) }}
              </div>
              <div class="flex-1 min-w-0">
                <span :class="['font-semibold', getPlatformColor(item.platform)]">
                  {{ item.sender_username }}:
                </span>
                <span class="text-gray-700 ml-1">{{ item.message }}</span>
              </div>
            </div>

            <!-- Stream Event -->
            <div
              v-else
              class="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 hover:shadow-sm transition-all"
            >
              <div class="text-2xl flex-shrink-0">{{ getEventIcon(item.eventType) }}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2">
                  <span :class="['font-semibold text-sm', getPlatformColor(item.platform)]">
                    {{ item.username }}
                  </span>
                  <span class="text-sm text-gray-600">{{ formatEventMessage(item) }}</span>
                </div>
                <div class="text-xs text-gray-400 mt-0.5">
                  {{ formatTimestamp(item.timestamp) }}
                </div>
              </div>
            </div>
          </template>
          </div>
        </div>
        <!-- Chat Input -->
        <div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div class="flex items-center space-x-2">
            <input
              v-model="chatMessage"
              type="text"
              placeholder="Type a message..."
              @keypress="handleKeyPress"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg rounded-r-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              @click="handleSendMessage"
              class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors -ml-2 relative"
              style="border-top-left-radius: 0; border-bottom-left-radius: 0;"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
