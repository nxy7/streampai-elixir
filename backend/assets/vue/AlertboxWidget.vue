<script setup lang="ts">
import { ref, computed, onMounted, watch, watchEffect, toRaw } from 'vue'

interface AlertEvent {
  id: string
  type: 'donation' | 'follow' | 'subscription' | 'raid'
  username: string
  message?: string
  amount?: number
  currency?: string
  timestamp: Date
  display_time?: number
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
  event: AlertEvent | null
  id?: string
}>()

const widgetId = props.id || 'alertbox-widget'
const alertContainer = ref<HTMLElement>()
const progressWidth = ref(0)
const progressInterval = ref<number | null>(null)

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
  if (!props.event) return 'opacity-0 scale-75'
  
  switch (props.config.animation_type) {
    case 'slide': return 'animate-slide-in'
    case 'bounce': return 'animate-bounce-in'
    default: return 'animate-fade-in'
  }
})


const getAlertColor = (type: string) => {
  const colors = {
    donation: 'text-green-400',
    follow: 'text-blue-400',
    subscription: 'text-purple-400',
    raid: 'text-yellow-400'
  }
  return colors[type as keyof typeof colors] || colors.donation
}

const getGradientColor = (type: string) => {
  const gradients = {
    donation: 'from-green-500 to-emerald-600',
    follow: 'from-blue-500 to-cyan-600',
    subscription: 'from-purple-500 to-violet-600',
    raid: 'from-yellow-500 to-orange-600'
  }
  return gradients[type as keyof typeof gradients] || gradients.donation
}

const getAlertTypeLabel = (type: string) => {
  const labels = {
    donation: 'Donation',
    follow: 'New Follower',
    subscription: 'New Subscriber',
    raid: 'Raid'
  }
  return labels[type as keyof typeof labels] || 'Alert'
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

const eventVisible = ref(true)
const hideTimeout = ref<number | null>(null)

// Handle progress bar animation and event hiding
const startProgressBar = (displayTime: number) => {
  // Clear any existing interval/timeout
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
  }
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
  }
  
  // Reset progress and show event
  progressWidth.value = 100
  eventVisible.value = true
  
  // Hide event after exactly displayTime seconds (perfect sync with progress bar)
  hideTimeout.value = setTimeout(() => {
    eventVisible.value = false
  }, displayTime * 1000)
  
  // Update progress every 50ms
  const updateFrequency = 50
  const totalUpdates = (displayTime * 1000) / updateFrequency
  let currentUpdate = 0
  
  progressInterval.value = setInterval(() => {
    currentUpdate++
    progressWidth.value = ((totalUpdates - currentUpdate) / totalUpdates) * 100
    
    if (currentUpdate >= totalUpdates) {
      clearInterval(progressInterval.value!)
      progressInterval.value = null
    }
  }, updateFrequency)
}

const stopProgressBar = () => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
    hideTimeout.value = null
  }
  progressWidth.value = 0
  eventVisible.value = false
}

// Watch for event changes and manage progress bar
watch(() => props.event, (newEvent, oldEvent) => {
  // Convert proxy objects to raw objects for proper comparison and access
  const rawNewEvent = newEvent ? toRaw(newEvent) : null
  const rawOldEvent = oldEvent ? toRaw(oldEvent) : null
  
  console.log("new",newEvent, rawNewEvent)
  
  // Skip if it's the same event (by ID comparison)
  if (rawNewEvent?.id && rawOldEvent?.id && rawNewEvent.id === rawOldEvent.id) {
    console.log('Vue: Same event ID, skipping')
    return
  }
  
  if (rawNewEvent && rawNewEvent.display_time) {
    console.log('Vue: Starting progress bar for event:', rawNewEvent.id)
    startProgressBar(rawNewEvent.display_time)
  } else {
    console.log('Vue: Stopping progress bar, event is null or has no display_time')
    stopProgressBar()
  }
}, {immediate: true})
</script>

<template>
  <div class="alertbox-widget h-full w-full relative overflow-hidden">
    <!-- Alert Display Container -->
    <div
      ref="alertContainer"
      :id="`alert-container-${widgetId}`"
      :class="`absolute inset-0 flex justify-center ${positionClass} transition-all duration-500 ease-out ${animationClass}`"
    >
      <!-- Alert Card with constant width -->
      <div
        v-if="props.event && eventVisible"
        :class="`alert-card relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-lg border border-white/20 backdrop-blur-lg shadow-2xl p-8 w-96 mx-4 ${fontClass}`"
      >
        <!-- Glowing border effect -->
        <div class="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/50 to-pink-500/50 opacity-20 blur-sm"></div>
        
        <!-- Animated background glow -->
        <div :class="`absolute inset-0 rounded-lg bg-gradient-to-r ${getGradientColor(props.event.type)} opacity-10 animate-pulse`"></div>
        
        <!-- Content -->
        <div class="relative z-10">
          <!-- Alert Header -->
          <div class="text-center mb-6">
            <div :class="`font-extrabold text-sm tracking-wider uppercase ${getAlertColor(props.event.type)} drop-shadow-sm mb-2`">
              {{ getAlertTypeLabel(props.event.type) }}
            </div>
            <div class="text-white font-bold text-2xl drop-shadow-sm">
              {{ props.event.username }}
            </div>
            <!-- Platform badge -->
            <div class="flex justify-center mt-3">
              <div :class="`px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-white`">
                <span class="opacity-70">via</span> <span class="font-bold">{{ getPlatformName(props.event.platform.icon) }}</span>
              </div>
            </div>
          </div>

          <!-- Amount (for donations) with enhanced styling -->
          <div
            v-if="config.show_amount && props.event.amount"
            class="text-center mb-6"
          >
            <div class="relative inline-block">
              <!-- Glowing text effect -->
              <div class="absolute inset-0 text-4xl font-black text-green-400 blur-sm opacity-50">
                {{ formatAmount(props.event.amount, props.event.currency) }}
              </div>
              <div class="relative text-4xl font-black text-green-400 drop-shadow-lg">
                {{ formatAmount(props.event.amount, props.event.currency) }}
              </div>
            </div>
          </div>

          <!-- Message with better typography -->
          <div
            v-if="config.show_message && props.event.message"
            class="text-center mb-4"
          >
            <div class="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
              <div class="text-gray-200 font-medium leading-relaxed">
                {{ props.event.message }}
              </div>
            </div>
          </div>

          <!-- Decorative elements -->
          <div class="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          <div class="absolute bottom-4 left-4 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-300"></div>
        </div>
        
        <!-- Progress bar at bottom -->
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75 ease-linear"
            :style="{ width: `${progressWidth}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alertbox-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
}

.alert-card {
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.5),
    0 10px 10px -5px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.85) translateY(20px);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0px);
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-60px) scale(0.8) rotateX(15deg);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0deg);
    filter: blur(0px);
  }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.2) translateY(-100px) rotateZ(-5deg);
    filter: blur(4px);
  }
  50% {
    opacity: 1;
    transform: scale(1.15) translateY(-10px) rotateZ(2deg);
    filter: blur(1px);
  }
  75% {
    transform: scale(0.95) translateY(5px) rotateZ(-1deg);
    filter: blur(0px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0) rotateZ(0deg);
    filter: blur(0px);
  }
}

.animate-fade-in {
  animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slide-in {
  animation: slide-in 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-bounce-in {
  animation: bounce-in 1s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Enhanced glow effects */
@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* Shimmer effect for text */
@keyframes text-shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.text-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: text-shimmer 2s ease-in-out infinite;
  -webkit-background-clip: text;
  background-clip: text;
}

/* Floating particles effect */
.floating-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.6;
  }
}
</style>