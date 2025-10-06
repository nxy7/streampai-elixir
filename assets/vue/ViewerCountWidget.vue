<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useNumberAnimation } from '../js/composables/useNumberAnimation'

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
  font_size: 'small' | 'medium' | 'large'
  display_style: 'minimal' | 'detailed' | 'cards'
  animation_enabled: boolean
  icon_color: string
  viewer_label: string
}

const props = defineProps<{
  config: ViewerCountConfig
  data: ViewerData | null
  id?: string
}>()

const widgetId = props.id || 'viewer-count-widget'
const { animateNumber } = useNumberAnimation()

const animatedTotalViewers = ref(0)
const animatedPlatformViewers = ref<Record<string, number>>({})

watch(() => props.data?.total_viewers, (newTotal, oldTotal) => {
  if (props.config.animation_enabled && newTotal !== undefined) {
    if (oldTotal !== undefined && oldTotal !== newTotal) {
      const startValue = animatedTotalViewers.value
      animateNumber(startValue, newTotal, (value) => {
        animatedTotalViewers.value = value
      })
    } else {
      animatedTotalViewers.value = newTotal
    }
  } else if (newTotal !== undefined) {
    animatedTotalViewers.value = newTotal
  }
}, { immediate: true })

watch(() => props.data?.platform_breakdown, (newPlatforms) => {
  if (props.config.animation_enabled && newPlatforms) {
    Object.entries(newPlatforms).forEach(([platform, data]) => {
      const startValue = animatedPlatformViewers.value[platform] || 0
      const newValue = data.viewers

      if (startValue !== newValue) {
        animateNumber(startValue, newValue, (value) => {
          animatedPlatformViewers.value = {
            ...animatedPlatformViewers.value,
            [platform]: value
          }
        })
      } else {
        animatedPlatformViewers.value = {
          ...animatedPlatformViewers.value,
          [platform]: newValue
        }
      }
    })
  } else if (newPlatforms) {
    // No animation, set directly
    const directValues: Record<string, number> = {}
    Object.entries(newPlatforms).forEach(([platform, data]) => {
      directValues[platform] = data.viewers
    })
    animatedPlatformViewers.value = directValues
  }
}, { immediate: true, deep: true })

// Initialize animated values
onMounted(() => {
  if (props.data) {
    animatedTotalViewers.value = props.data.total_viewers
    if (props.data.platform_breakdown) {
      const initialValues: Record<string, number> = {}
      Object.entries(props.data.platform_breakdown).forEach(([platform, data]) => {
        initialValues[platform] = data.viewers
      })
      animatedPlatformViewers.value = initialValues
    }
  }
})

const fontClass = computed(() => {
  switch (props.config.font_size) {
    case 'small': return 'text-xl'
    case 'large': return 'text-5xl'
    default: return 'text-3xl'
  }
})

const platformEntries = computed(() => {
  if (!props.data?.platform_breakdown) return []
  return Object.entries(props.data.platform_breakdown).filter(([_, data]) => data.viewers > 0)
})

const viewerIcon = computed(() => ({
  viewBox: "0 0 24 24",
  path: "M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551z"
}))

</script>

<template>
  <div :id="widgetId" class="viewer-count-widget h-full flex items-center justify-center p-4">
    <div v-if="data" class="viewer-display">
      <!-- Minimal Style: Just total count with icon -->
      <div v-if="config.display_style === 'minimal'" class="flex items-center space-x-3 text-white bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl px-6 py-4 shadow-lg border border-gray-700">
        <svg class="w-8 h-8" :style="{ color: config.icon_color || '#ef4444' }" fill="currentColor" :viewBox="viewerIcon.viewBox">
          <path :d="viewerIcon.path"/>
        </svg>
        <span :class="[fontClass, 'font-bold']">
          {{ config.animation_enabled ? animatedTotalViewers.toLocaleString() : data.total_viewers.toLocaleString() }}
        </span>
        <span v-if="config.viewer_label" class="text-sm text-gray-300 font-medium">{{ config.viewer_label }}</span>
      </div>

      <!-- Detailed Style: Total + platform breakdown -->
      <div v-else-if="config.display_style === 'detailed'" class="space-y-3">
        <!-- Total Count -->
        <div v-if="config.show_total" class="flex items-center justify-center space-x-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 shadow-lg">
          <svg class="w-10 h-10" :style="{ color: config.icon_color || '#ef4444' }" fill="currentColor" :viewBox="viewerIcon.viewBox">
            <path :d="viewerIcon.path"/>
          </svg>
          <div class="text-center">
            <div :class="[fontClass, 'font-bold']">
              {{ config.animation_enabled ? animatedTotalViewers.toLocaleString() : data.total_viewers.toLocaleString() }}
            </div>
            <div v-if="config.viewer_label" class="text-sm text-blue-100">{{ config.viewer_label }}</div>
          </div>
        </div>

        <!-- Platform Breakdown -->
        <div v-if="config.show_platforms && platformEntries.length > 0" class="flex items-center justify-center space-x-4">
          <div v-for="[platform, platformData] in platformEntries" :key="platform"
               class="flex items-center space-x-2 text-white bg-gray-900 bg-opacity-80 rounded-lg px-3 py-2 border border-gray-700">
            <div :class="`w-4 h-4 rounded-full ${platformData.color} shadow-lg`"></div>
            <span :class="['font-bold']">
              {{ config.animation_enabled ? (animatedPlatformViewers[platform] || 0).toLocaleString() : platformData.viewers.toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Cards Style: Each platform as separate card -->
      <div v-else-if="config.display_style === 'cards'" class="space-y-3">
        <!-- Total Card -->
        <div v-if="config.show_total" class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-5 text-white text-center shadow-lg">
          <div class="flex items-center justify-center space-x-2 mb-2">
            <svg class="w-7 h-7" :style="{ color: config.icon_color || '#ef4444' }" fill="currentColor" :viewBox="viewerIcon.viewBox">
              <path :d="viewerIcon.path"/>
            </svg>
            <span v-if="config.viewer_label" class="text-sm font-medium">{{ config.viewer_label }}</span>
          </div>
          <div :class="[fontClass, 'font-bold']">
            {{ config.animation_enabled ? animatedTotalViewers.toLocaleString() : data.total_viewers.toLocaleString() }}
          </div>
        </div>

        <!-- Platform Cards -->
        <div v-if="config.show_platforms && platformEntries.length > 0" class="flex items-center justify-center space-x-3">
          <div v-for="[platform, platformData] in platformEntries" :key="platform"
               :class="`${platformData.color} rounded-xl p-3 text-white text-center shadow-lg hover:shadow-xl transition-shadow duration-200`">
            <div :class="['text-lg font-bold']">
              {{ config.animation_enabled ? (animatedPlatformViewers[platform] || 0).toLocaleString() : platformData.viewers.toLocaleString() }}
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
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Enhanced animations for numbers */
@keyframes countUp {
  from {
    transform: scale(0.95);
    opacity: 0.7;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.viewer-display {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth hover effects */
.hover\:shadow-xl:hover {
  transform: translateY(-1px);
}
</style>