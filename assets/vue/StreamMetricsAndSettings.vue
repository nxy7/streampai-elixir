<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import StreamSettingsFormFields from './StreamSettingsFormFields.vue'
import { formatPlatformName, getPlatformColor } from './utils/platformUtils'

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
  platform?: string
  metadata?: {
    title?: string
    description?: string
    thumbnail_url?: string
  }
  timestamp: string
}

interface StreamData {
  initial_message_count: number
  title: string
  description: string
  thumbnail_url?: string | null
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
  deleteMessage: [{ messageId: string }]
  banUser: [{ username: string; platform: string }]
  timeoutUser: [{ username: string; platform: string; duration: number }]
}>()

const activityContainer = ref<HTMLElement | null>(null)
const chatMessage = ref('')
const streamSettings = ref({
  title: '',
  description: '',
  thumbnailFile: null as File | null
})
const contextMenu = ref<{
  visible: boolean
  x: number
  y: number
  messageId: string | null
  username: string | null
  platform: string | null
}>({
  visible: false,
  x: 0,
  y: 0,
  messageId: null,
  username: null,
  platform: null
})

onMounted(() => {
  streamSettings.value.title = props.streamData.title || ''
  streamSettings.value.description = props.streamData.description || ''

  document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
})

// Watch for stream_updated events and update form fields
// Only update when NOT editing (settings panel is closed)
watch(() => props.streamEvents, (newEvents, oldEvents) => {
  if (!newEvents || !oldEvents || newEvents.length === 0) return

  // Events are prepended (newest first), so check index 0
  const latestEvent = newEvents[0]
  if (!latestEvent) return

  // Only update form fields when settings panel is closed
  if (latestEvent.type === 'stream_updated' && !props.showSettings) {
    if (latestEvent.metadata?.title !== undefined) {
      streamSettings.value.title = latestEvent.metadata.title
    }
    if (latestEvent.metadata?.description !== undefined) {
      streamSettings.value.description = latestEvent.metadata.description
    }
  }
}, { deep: true })

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
  // Send file info along with settings if a thumbnail was selected
  const payload: any = {
    title: streamSettings.value.title,
    description: streamSettings.value.description
  }

  // If there's a selected thumbnail file, include its info
  if (streamSettings.value.thumbnailFile) {
    payload.thumbnailFile = {
      name: streamSettings.value.thumbnailFile.name,
      size: streamSettings.value.thumbnailFile.size,
      type: streamSettings.value.thumbnailFile.type
    }
  }

  emit('saveSettings', payload)
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
    case 'stream_updated':
      return 'updated stream settings'
    case 'platform_started':
      return 'started streaming'
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
    case 'stream_updated':
      return '⚙️'
    case 'platform_started':
      return '🚀'
    default:
      return '🎉'
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

const showContextMenu = (event: MouseEvent, message: ChatMessage) => {
  event.preventDefault()
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    messageId: message.id,
    username: message.sender_username,
    platform: message.platform
  }
}

const hideContextMenu = () => {
  contextMenu.value.visible = false
}

const handleDeleteMessage = () => {
  if (contextMenu.value.messageId) {
    emit('deleteMessage', { messageId: contextMenu.value.messageId })
  }
  hideContextMenu()
}

const handleBanUser = () => {
  if (contextMenu.value.username && contextMenu.value.platform) {
    emit('banUser', {
      username: contextMenu.value.username,
      platform: contextMenu.value.platform
    })
  }
  hideContextMenu()
}

const handleTimeoutUser = (duration: number) => {
  if (contextMenu.value.username && contextMenu.value.platform) {
    emit('timeoutUser', {
      username: contextMenu.value.username,
      platform: contextMenu.value.platform,
      duration
    })
  }
  hideContextMenu()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Stream Settings Form -->
    <div v-if="showSettings" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Stream Settings</h3>
      <StreamSettingsFormFields v-model="streamSettings" :current-thumbnail-url="streamData.thumbnail_url" />
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
        <div ref="activityContainer" class="h-96 overflow-y-auto p-4">
          <div v-if="allActivity.length === 0" class="flex items-center justify-center h-full text-gray-400 text-sm">
            No activity yet
          </div>
          <div v-else class="space-y-2 min-h-full flex flex-col justify-end">
          <template v-for="item in allActivity" :key="item.id">
            <!-- Chat Message -->
            <div
              v-if="item.type === 'chat'"
              class="relative group flex items-center space-x-2 text-sm hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer"
              @contextmenu="showContextMenu($event, item)"
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
              <!-- Menu button (visible on hover) -->
              <button
                @click.stop="showContextMenu($event, item)"
                class="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-opacity"
                title="More actions"
              >
                <svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                  <circle cx="8" cy="3" r="1.5"/>
                  <circle cx="8" cy="8" r="1.5"/>
                  <circle cx="8" cy="13" r="1.5"/>
                </svg>
              </button>
            </div>

            <!-- Stream Event -->
            <div
              v-else
              class="relative group flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 hover:shadow-sm transition-all"
            >
              <div class="text-2xl flex-shrink-0">{{ getEventIcon(item.eventType) }}</div>
              <div class="flex-1 min-w-0">
                <div v-if="item.eventType === 'platform_started'" class="flex items-center space-x-1">
                  <span class="text-sm text-gray-600">Stream on</span>
                  <span :class="['font-semibold text-sm', item.platform ? getPlatformColor(item.platform) : 'text-gray-700']">
                    {{ formatPlatformName(item.platform) }}
                  </span>
                  <span class="text-sm text-gray-600">started!</span>
                </div>
                <div v-else class="flex items-center space-x-2">
                  <span :class="['font-semibold text-sm', item.platform ? getPlatformColor(item.platform) : 'text-gray-700']">
                    {{ item.username }}
                  </span>
                  <span class="text-sm text-gray-600">{{ formatEventMessage(item) }}</span>
                </div>
                <div class="text-xs text-gray-400 mt-0.5">
                  {{ formatTimestamp(item.timestamp) }}
                </div>
              </div>

              <!-- Tooltip for stream settings updates -->
              <div
                v-if="item.eventType === 'stream_updated' && item.metadata"
                class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-80 p-3 bg-white rounded-lg shadow-lg border border-gray-200"
              >
                <div class="text-xs font-semibold text-gray-700 mb-2">Updated Settings:</div>
                <div v-if="item.metadata.title" class="mb-2">
                  <div class="text-xs text-gray-500">Title:</div>
                  <div class="text-xs text-gray-900 font-medium">{{ item.metadata.title }}</div>
                </div>
                <div v-if="item.metadata.description" class="mb-2">
                  <div class="text-xs text-gray-500">Description:</div>
                  <div class="text-xs text-gray-900">{{ item.metadata.description }}</div>
                </div>
                <div v-if="item.metadata.thumbnail_url" class="mb-1">
                  <div class="text-xs text-gray-500 mb-1">Thumbnail:</div>
                  <img :src="item.metadata.thumbnail_url" alt="Stream thumbnail" class="w-48 aspect-video object-cover rounded" />
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

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
        class="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]"
        @click.stop
      >
        <button
          @click="handleDeleteMessage"
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete message</span>
        </button>

        <div class="border-t border-gray-200 my-1"></div>

        <button
          @click="handleTimeoutUser(60)"
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Timeout (1 min)</span>
        </button>

        <button
          @click="handleTimeoutUser(600)"
          class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-gray-700"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Timeout (10 min)</span>
        </button>

        <div class="border-t border-gray-200 my-1"></div>

        <button
          @click="handleBanUser"
          class="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center space-x-2 text-red-600"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span>Ban user</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>
