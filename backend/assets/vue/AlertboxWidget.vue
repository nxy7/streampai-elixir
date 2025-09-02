<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface AlertEvent {
  id: string
  type: 'donation' | 'follow' | 'subscription' | 'raid'
  username: string
  message?: string
  amount?: number
  currency?: string
  timestamp: Date
  platform: {
    icon: string
    color: string
  }
}

interface AlertConfig {
  animation_type: 'slide' | 'fade' | 'bounce'
  display_duration: number // seconds
  sound_enabled: boolean
  sound_volume: number
  show_message: boolean
  show_amount: boolean
  font_size: 'small' | 'medium' | 'large'
  alert_position: 'top' | 'center' | 'bottom'
}

const props = defineProps<{
  config: AlertConfig
  events: AlertEvent[]
  id?: string
}>()

const widgetId = props.id || 'alertbox-widget'
const currentAlert = ref<AlertEvent | null>(null)
const alertQueue = ref<AlertEvent[]>([])
const isDisplaying = ref(false)
const alertContainer = ref<HTMLElement>()

const fontClass = computed(() => {
  switch (props.config.font_size) {
    case 'small': return 'text-lg'
    case 'large': return 'text-4xl'
    default: return 'text-2xl'
  }
})

const positionClass = computed(() => {
  switch (props.config.alert_position) {
    case 'top': return 'items-start pt-8'
    case 'bottom': return 'items-end pb-8'
    default: return 'items-center'
  }
})

const animationClass = computed(() => {
  if (!isDisplaying.value) return 'opacity-0 scale-75'
  
  switch (props.config.animation_type) {
    case 'slide': return 'animate-slide-in'
    case 'bounce': return 'animate-bounce-in'
    default: return 'animate-fade-in'
  }
})

const getAlertIcon = (type: string) => {
  const icons = {
    donation: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V16h.59c.66 0 1.2-.54 1.2-1.2s-.54-1.2-1.2-1.2H13v-1.59c1.75-.27 3.1-1.8 3.1-3.61 0-2.02-1.64-3.66-3.66-3.66S8.78 6.38 8.78 8.4c0 1.81 1.35 3.34 3.1 3.61V12h-.59c-.66 0-1.2.54-1.2 1.2s.54 1.2 1.2 1.2h.59v2.09c-3.13-.27-5.61-2.9-5.61-6.09 0-3.37 2.74-6.11 6.11-6.11s6.11 2.74 6.11 6.11c0 3.19-2.48 5.82-5.61 6.09z",
    follow: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    subscription: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    raid: "M13 10V3L4 14h7v7l9-11h-7z"
  }
  return icons[type as keyof typeof icons] || icons.donation
}

const getAlertColor = (type: string) => {
  const colors = {
    donation: 'text-green-400',
    follow: 'text-blue-400',
    subscription: 'text-purple-400',
    raid: 'text-yellow-400'
  }
  return colors[type as keyof typeof colors] || colors.donation
}

const formatAmount = (amount?: number, currency?: string) => {
  if (!amount) return ''
  return `${currency || '$'}${amount.toFixed(2)}`
}

const processAlertQueue = () => {
  if (isDisplaying.value || alertQueue.value.length === 0) return
  
  const nextAlert = alertQueue.value.shift()
  if (!nextAlert) return
  
  currentAlert.value = nextAlert
  isDisplaying.value = true
  
  // Auto-hide after display duration
  setTimeout(() => {
    isDisplaying.value = false
    currentAlert.value = null
    
    // Process next alert after hide animation
    setTimeout(() => {
      processAlertQueue()
    }, 500)
  }, props.config.display_duration * 1000)
}

// Watch for new events and add to queue
const addToQueue = (events: AlertEvent[]) => {
  const newEvents = events.filter(event => 
    !alertQueue.value.some(queued => queued.id === event.id) &&
    (!currentAlert.value || currentAlert.value.id !== event.id)
  )
  
  alertQueue.value.push(...newEvents)
  processAlertQueue()
}

// Initialize and watch props.events
onMounted(() => {
  addToQueue(props.events)
})

// Watch for new events (reactive)
computed(() => {
  addToQueue(props.events)
})
</script>

<template>
  <div class="alertbox-widget h-full w-full relative overflow-hidden">
    <!-- Alert Display Container -->
    <div
      ref="alertContainer"
      :id="`alert-container-${widgetId}`"
      :class="`absolute inset-0 flex justify-center ${positionClass} transition-all duration-500 ease-out ${animationClass}`"
    >
      <!-- Alert Card -->
      <div
        v-if="currentAlert"
        :class="`bg-gray-900 bg-opacity-95 rounded-xl border-2 border-gray-700 backdrop-blur-sm p-6 max-w-md mx-4 ${fontClass}`"
      >
        <!-- Alert Header -->
        <div class="flex items-center justify-center mb-4">
          <div :class="`w-16 h-16 rounded-full ${currentAlert.platform.color} flex items-center justify-center mr-4`">
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path :d="getAlertIcon(currentAlert.type)" />
            </svg>
          </div>
          <div class="text-center flex-1">
            <div :class="`font-bold ${getAlertColor(currentAlert.type)}`">
              {{ currentAlert.type.toUpperCase() }}
            </div>
            <div class="text-white font-semibold text-lg">
              {{ currentAlert.username }}
            </div>
          </div>
        </div>

        <!-- Amount (for donations) -->
        <div
          v-if="config.show_amount && currentAlert.amount"
          class="text-center mb-4"
        >
          <div class="text-3xl font-bold text-green-400">
            {{ formatAmount(currentAlert.amount, currentAlert.currency) }}
          </div>
        </div>

        <!-- Message -->
        <div
          v-if="config.show_message && currentAlert.message"
          class="text-center text-gray-300 italic"
        >
          "{{ currentAlert.message }}"
        </div>

        <!-- Platform Badge -->
        <div class="flex justify-center mt-4">
          <div :class="`px-3 py-1 rounded-full text-xs font-semibold ${currentAlert.platform.color}`">
            via {{ currentAlert.platform.icon }}
          </div>
        </div>
      </div>
    </div>

    <!-- Queue Counter (for debugging/preview) -->
    <div
      v-if="alertQueue.length > 0"
      class="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold"
    >
      {{ alertQueue.length }} queued
    </div>
  </div>
</template>

<style scoped>
.alertbox-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animate-slide-in {
  animation: slide-in 0.5s ease-out;
}

.animate-bounce-in {
  animation: bounce-in 0.6s ease-out;
}
</style>