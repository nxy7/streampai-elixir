<script setup lang="ts">
import { ref, computed } from 'vue'

interface ViewerData {
  id: string
  total_viewers: number
  platform_breakdown: {
    [platform: string]: {
      viewers: number
      icon: string
      color: string
    }
  }
  timestamp: Date
}

interface ViewerCountConfig {
  show_total: boolean
  show_platforms: boolean
  update_interval: number // seconds
  font_size: 'small' | 'medium' | 'large'
  display_style: 'minimal' | 'detailed' | 'cards'
  animation_enabled: boolean
}

const props = defineProps<{
  config: ViewerCountConfig
  data: ViewerData | null
  id?: string
}>()

const widgetId = props.id || 'viewer-count-widget'

const fontClass = computed(() => {
  switch (props.config.font_size) {
    case 'small': return 'text-lg'
    case 'large': return 'text-4xl'
    default: return 'text-2xl'
  }
})

const platformEntries = computed(() => {
  if (!props.data?.platform_breakdown) return []
  return Object.entries(props.data.platform_breakdown).filter(([_, data]) => data.viewers > 0)
})
</script>

<template>
  <div :id="widgetId" class="viewer-count-widget h-full flex items-center justify-center p-4">
    <div v-if="data" class="viewer-display">
      <!-- Minimal Style: Just total count with icon -->
      <div v-if="config.display_style === 'minimal'" class="flex items-center space-x-2 text-white">
        <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
          <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" opacity="0.3"/>
        </svg>
        <span :class="[fontClass, config.animation_enabled && 'transition-all duration-500']">
          {{ data.total_viewers.toLocaleString() }}
        </span>
        <span class="text-sm text-gray-300">viewers</span>
      </div>

      <!-- Detailed Style: Total + platform breakdown -->
      <div v-else-if="config.display_style === 'detailed'" class="space-y-3">
        <!-- Total Count -->
        <div v-if="config.show_total" class="flex items-center justify-center space-x-2 text-white">
          <svg class="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
          </svg>
          <div class="text-center">
            <div :class="[fontClass, config.animation_enabled && 'transition-all duration-500']">
              {{ data.total_viewers.toLocaleString() }}
            </div>
            <div class="text-sm text-gray-300">Total Viewers</div>
          </div>
        </div>

        <!-- Platform Breakdown -->
        <div v-if="config.show_platforms && platformEntries.length > 0" class="space-y-2">
          <div v-for="[platform, platformData] in platformEntries" :key="platform"
               class="flex items-center justify-between text-white bg-gray-800 bg-opacity-50 rounded-lg px-3 py-2">
            <div class="flex items-center space-x-2">
              <div :class="`w-4 h-4 rounded ${platformData.color}`"></div>
              <span class="capitalize text-sm">{{ platform }}</span>
            </div>
            <span :class="[config.animation_enabled && 'transition-all duration-500']">
              {{ platformData.viewers.toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Cards Style: Each platform as separate card -->
      <div v-else-if="config.display_style === 'cards'" class="space-y-2">
        <!-- Total Card -->
        <div v-if="config.show_total" class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white text-center">
          <div class="flex items-center justify-center space-x-2 mb-1">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm">Total</span>
          </div>
          <div :class="[fontClass, config.animation_enabled && 'transition-all duration-500']">
            {{ data.total_viewers.toLocaleString() }}
          </div>
        </div>

        <!-- Platform Cards -->
        <div v-if="config.show_platforms && platformEntries.length > 0" class="grid grid-cols-2 gap-2">
          <div v-for="[platform, platformData] in platformEntries" :key="platform"
               :class="`${platformData.color} rounded-lg p-3 text-white text-center`">
            <div class="text-sm capitalize mb-1">{{ platform }}</div>
            <div :class="[config.animation_enabled && 'transition-all duration-500']">
              {{ platformData.viewers.toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center space-x-2 text-gray-400">
      <svg class="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
      </svg>
      <span>Loading viewers...</span>
    </div>
  </div>
</template>

<style scoped>
.viewer-count-widget {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>