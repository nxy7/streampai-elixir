<script setup lang="ts">
import { ref, computed, onMounted, watch, toRaw } from 'vue'

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
const currentDisplayTime = ref<number>(0)

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
  if (animationPhase.value === 'hidden') {
    console.log('Vue: Animation class - hidden state')
    return 'opacity-0 scale-75 pointer-events-none'
  }
  
  const baseAnimation = (() => {
    switch (props.config.animation_type) {
      case 'slide': return 'slide'
      case 'bounce': return 'bounce'
      default: return 'fade'
    }
  })()
  
  const result = (() => {
    switch (animationPhase.value) {
      case 'in':
        return `animate-${baseAnimation}-in`
      case 'visible':
        return 'opacity-100 scale-100'
      case 'out':
        return `animate-${baseAnimation}-out`
      default:
        return 'opacity-0 scale-75 pointer-events-none'
    }
  })()
  
  console.log(`Vue: Animation class - phase: ${animationPhase.value}, class: ${result}`)
  return result
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

const eventVisible = ref(false)
const animationPhase = ref<'in' | 'visible' | 'out' | 'hidden'>('hidden')
const currentEventId = ref<string | null>(null)

const startEventDisplay = (displayTime: number, eventId?: string) => {
  // Prevent starting animation for the same event that's already playing
  if (eventId && eventId === currentEventId.value && animationPhase.value !== 'hidden') {
    console.log('Vue: Preventing duplicate animation start for event:', eventId)
    return
  }
  
  // Track the current event
  if (eventId) {
    currentEventId.value = eventId
  }
  
  // Set display time for CSS animation
  currentDisplayTime.value = displayTime
  
  console.log('Vue: Starting event display with CSS animations:', eventId || currentEventId.value, 'display time:', displayTime)
  
  // Start entrance animation
  animationPhase.value = 'in'
  eventVisible.value = true
  
  // Animation sequence handled by CSS
  // After entrance animation, move to visible phase
  setTimeout(() => {
    console.log('Vue: Moving to visible phase')
    animationPhase.value = 'visible'
    
    // After display time, start exit animation
    setTimeout(() => {
      console.log('Vue: Starting exit animation')
      animationPhase.value = 'out'
      
      // After exit animation, hide completely
      setTimeout(() => {
        if (animationPhase.value === 'out') {
          console.log('Vue: Animation complete, hiding')
          animationPhase.value = 'hidden'
          eventVisible.value = false
          currentEventId.value = null
        }
      }, 800) // Exit animation duration
    }, displayTime * 1000) // Display time
  }, 800) // Entrance animation duration
}

const stopEventDisplay = () => {
  eventVisible.value = false
  animationPhase.value = 'hidden'
  currentEventId.value = null
}

// Single watcher for event changes - simplified logic to prevent loops
watch(() => props.event, (newEvent, oldEvent) => {
  // Convert proxy objects to raw objects for proper comparison
  const rawNewEvent = newEvent ? toRaw(newEvent) : null
  const rawOldEvent = oldEvent ? toRaw(oldEvent) : null
  
  // Log every event received by the Vue component
  if (rawNewEvent) {
    console.log("🎯 AlertboxWidget received new event:", rawNewEvent)
  }
  
  console.log("Vue: Event watcher triggered")
  console.log("Vue: Event IDs - new:", rawNewEvent?.id, "old:", rawOldEvent?.id, "current:", currentEventId.value)
  console.log("Vue: Animation phase:", animationPhase.value)
  
  // Only start animation if:
  // 1. We have a new event with display_time
  // 2. The event ID is different from what we're currently showing
  // 3. We're not already in the middle of animating this same event
  if (rawNewEvent && 
      rawNewEvent.display_time && 
      rawNewEvent.id !== currentEventId.value &&
      (animationPhase.value === 'hidden' || rawNewEvent.id !== rawOldEvent?.id)) {
    
    console.log('Vue: Starting new event display:', rawNewEvent.id)
    
    // Clean up any existing animation
    if (animationPhase.value !== 'hidden') {
      console.log('Vue: Cleaning up previous animation')
      stopEventDisplay()
    }
    
    // Start new display
    startEventDisplay(rawNewEvent.display_time, rawNewEvent.id)
  } else if (rawNewEvent) {
    console.log('Vue: Skipping - conditions not met for new animation')
  }
}, {immediate: true, deep: true})

// Initialize animation state
onMounted(() => {
  if (!props.event) {
    animationPhase.value = 'hidden'
    eventVisible.value = false
  }
})
</script>

<template>
  <div class="alertbox-widget h-full w-full relative overflow-hidden">
    <!-- Alert Display Container -->
    <div
      ref="alertContainer"
      :id="`alert-container-${widgetId}`"
      :class="`absolute inset-0 flex justify-center ${positionClass}`"
    >
      <!-- Alert Card with constant width -->
      <div
        v-if="animationPhase !== 'hidden' && props.event"
        :class="`alert-card relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-lg border border-white/20 backdrop-blur-lg shadow-2xl p-8 w-96 mx-4 ${fontClass} ${animationClass}`"
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
        
        <!-- Progress bar at bottom with CSS animation -->
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-purple-500 to-pink-500 progress-bar-active"
            :style="{ 
              'animation-duration': `${currentDisplayTime}s`
            }"
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

/* Exit animations (reverse of entrance animations) */
@keyframes fade-out {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0px);
  }
  to {
    opacity: 0;
    transform: scale(0.85) translateY(-20px);
    filter: blur(4px);
  }
}

@keyframes slide-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0deg);
    filter: blur(0px);
  }
  to {
    opacity: 0;
    transform: translateY(-60px) scale(0.8) rotateX(15deg);
    filter: blur(4px);
  }
}

@keyframes bounce-out {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0) rotateZ(0deg);
    filter: blur(0px);
  }
  25% {
    transform: scale(1.05) translateY(-5px) rotateZ(1deg);
    filter: blur(0px);
  }
  50% {
    opacity: 1;
    transform: scale(0.95) translateY(10px) rotateZ(-2deg);
    filter: blur(1px);
  }
  100% {
    opacity: 0;
    transform: scale(0.2) translateY(100px) rotateZ(5deg);
    filter: blur(4px);
  }
}

.animate-fade-in {
  animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-slide-in {
  animation: slide-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-bounce-in {
  animation: bounce-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fade-out {
  animation: fade-out 0.6s cubic-bezier(0.3, 0, 0.8, 0.15) forwards;
}

.animate-slide-out {
  animation: slide-out 0.5s cubic-bezier(0.3, 0, 0.8, 0.15) forwards;
}

.animate-bounce-out {
  animation: bounce-out 0.8s cubic-bezier(0.3, 0, 0.8, 0.15) forwards;
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

/* CSS-based progress bar animation */
.progress-bar-active {
  width: 100%; /* Start full width */
  height: 100%;
  animation: progress-width-shrink 4s ease-in-out forwards; /* Default duration, overridden by style */
  animation-fill-mode: forwards; /* Keep the final state (0% width) */
}

@keyframes progress-width-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>