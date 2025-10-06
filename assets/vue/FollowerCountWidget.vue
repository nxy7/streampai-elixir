<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useNumberAnimation } from '../js/composables/useNumberAnimation'

interface FollowerData {
  id: string
  total_followers: number
  platform_breakdown: {
    [platform: string]: {
      followers: number
      icon: string
      color: string
    }
  }
  timestamp: Date
}

interface FollowerCountConfig {
  show_total: boolean
  show_platforms: boolean
  font_size: 'small' | 'medium' | 'large'
  display_style: 'minimal' | 'detailed' | 'cards'
  animation_enabled: boolean
  total_label: string
  icon_color: string
}

const props = defineProps<{
  config: FollowerCountConfig
  data: FollowerData | null
  id?: string
}>()

const widgetId = props.id || 'follower-count-widget'
const { animateNumber } = useNumberAnimation()

const animatedTotalFollowers = ref(0)
const animatedPlatformFollowers = ref<Record<string, number>>({})

watch(() => props.data?.total_followers, (newTotal, oldTotal) => {
  if (props.config.animation_enabled && newTotal !== undefined) {
    if (oldTotal !== undefined && oldTotal !== newTotal) {
      const startValue = animatedTotalFollowers.value
      animateNumber(startValue, newTotal, (value) => {
        animatedTotalFollowers.value = value
      })
    } else {
      animatedTotalFollowers.value = newTotal
    }
  } else if (newTotal !== undefined) {
    animatedTotalFollowers.value = newTotal
  }
}, { immediate: true })

watch(() => props.data?.platform_breakdown, (newPlatforms) => {
  if (props.config.animation_enabled && newPlatforms) {
    Object.entries(newPlatforms).forEach(([platform, data]) => {
      const startValue = animatedPlatformFollowers.value[platform] || 0
      const newValue = data.followers

      if (startValue !== newValue) {
        animateNumber(startValue, newValue, (value) => {
          animatedPlatformFollowers.value = {
            ...animatedPlatformFollowers.value,
            [platform]: value
          }
        })
      } else {
        animatedPlatformFollowers.value = {
          ...animatedPlatformFollowers.value,
          [platform]: newValue
        }
      }
    })
  } else if (newPlatforms) {
    const directValues: Record<string, number> = {}
    Object.entries(newPlatforms).forEach(([platform, data]) => {
      directValues[platform] = data.followers
    })
    animatedPlatformFollowers.value = directValues
  }
}, { immediate: true, deep: true })

onMounted(() => {
  if (props.data) {
    animatedTotalFollowers.value = props.data.total_followers
    if (props.data.platform_breakdown) {
      const initialValues: Record<string, number> = {}
      Object.entries(props.data.platform_breakdown).forEach(([platform, data]) => {
        initialValues[platform] = data.followers
      })
      animatedPlatformFollowers.value = initialValues
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
  return Object.entries(props.data.platform_breakdown).filter(([_, data]) => data.followers > 0)
})

const followerIcon = computed(() => ({
  viewBox: "0 0 24 24",
  path: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
}))

</script>

<template>
  <div :id="widgetId" class="follower-count-widget h-full flex items-center justify-center p-4">
    <div v-if="data" class="follower-display">
      <!-- Minimal Style: Just total count with icon -->
      <div v-if="config.display_style === 'minimal'" class="flex items-center space-x-3 text-white bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl px-6 py-4 shadow-lg border border-gray-700">
        <svg class="w-8 h-8" :style="{ color: config.icon_color || '#9333ea' }" fill="currentColor" :viewBox="followerIcon.viewBox">
          <path :d="followerIcon.path"/>
        </svg>
        <span :class="[fontClass, 'font-bold']">
          {{ config.animation_enabled ? animatedTotalFollowers.toLocaleString() : data.total_followers.toLocaleString() }}
        </span>
        <span v-if="config.total_label" class="text-sm text-gray-300 font-medium">{{ config.total_label }}</span>
      </div>

      <!-- Detailed Style: Total + platform breakdown -->
      <div v-else-if="config.display_style === 'detailed'" class="space-y-3">
        <!-- Total Count -->
        <div v-if="config.show_total" class="flex items-center justify-center space-x-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 shadow-lg">
          <svg class="w-10 h-10" :style="{ color: config.icon_color || '#9333ea' }" fill="currentColor" :viewBox="followerIcon.viewBox">
            <path :d="followerIcon.path"/>
          </svg>
          <div class="text-center">
            <div :class="[fontClass, 'font-bold']">
              {{ config.animation_enabled ? animatedTotalFollowers.toLocaleString() : data.total_followers.toLocaleString() }}
            </div>
            <div v-if="config.total_label" class="text-sm text-purple-100">{{ config.total_label }}</div>
          </div>
        </div>

        <!-- Platform Breakdown -->
        <div v-if="config.show_platforms && platformEntries.length > 0" class="flex items-center justify-center space-x-4">
          <div v-for="[platform, platformData] in platformEntries" :key="platform"
               class="flex items-center space-x-2 text-white bg-gray-900 bg-opacity-80 rounded-lg px-3 py-2 border border-gray-700">
            <div :class="`w-4 h-4 rounded-full ${platformData.color} shadow-lg`"></div>
            <span :class="['font-bold']">
              {{ config.animation_enabled ? (animatedPlatformFollowers[platform] || 0).toLocaleString() : platformData.followers.toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Cards Style: Each platform as separate card -->
      <div v-else-if="config.display_style === 'cards'" class="space-y-3">
        <!-- Total Card -->
        <div v-if="config.show_total" class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-5 text-white text-center shadow-lg">
          <div class="flex items-center justify-center space-x-2 mb-2">
            <svg class="w-7 h-7" :style="{ color: config.icon_color || '#9333ea' }" fill="currentColor" :viewBox="followerIcon.viewBox">
              <path :d="followerIcon.path"/>
            </svg>
            <span v-if="config.total_label" class="text-sm font-medium">{{ config.total_label }}</span>
          </div>
          <div :class="[fontClass, 'font-bold']">
            {{ config.animation_enabled ? animatedTotalFollowers.toLocaleString() : data.total_followers.toLocaleString() }}
          </div>
        </div>

        <!-- Platform Cards -->
        <div v-if="config.show_platforms && platformEntries.length > 0" class="flex items-center justify-center space-x-3">
          <div v-for="[platform, platformData] in platformEntries" :key="platform"
               :class="`${platformData.color} rounded-xl p-3 text-white text-center shadow-lg hover:shadow-xl transition-shadow duration-200`">
            <div :class="['text-lg font-bold']">
              {{ config.animation_enabled ? (animatedPlatformFollowers[platform] || 0).toLocaleString() : platformData.followers.toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center space-x-2 text-gray-400">
      <svg class="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>Loading followers...</span>
    </div>
  </div>
</template>

<style scoped>
.follower-count-widget {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

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

.follower-display {
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

.hover\:shadow-xl:hover {
  transform: translateY(-1px);
}
</style>