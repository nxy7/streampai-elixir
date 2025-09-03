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
const hideTimeout = ref<number | null>(null)
const animationPhase = ref<'in' | 'visible' | 'out' | 'hidden'>('hidden')

// Handle progress bar animation and event hiding
const startProgressBar = (displayTime: number) => {
  // Clear any existing interval/timeout
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
  }
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
  }
  
  // Start with entrance animation
  console.log('Vue: Starting entrance animation')
  animationPhase.value = 'in'
  eventVisible.value = true
  progressWidth.value = 100
  
  // Animation durations (in ms) - match CSS durations
  const animationInDuration = (() => {
    switch (props.config.animation_type) {
      case 'slide': return 700
      case 'bounce': return 1000
      default: return 800 // fade
    }
  })()
  
  const animationOutDuration = (() => {
    switch (props.config.animation_type) {
      case 'slide': return 500
      case 'bounce': return 800
      default: return 600 // fade
    }
  })()
  
  // Wait for entrance animation to complete, then start progress
  setTimeout(() => {
    console.log('Vue: Entrance animation complete, starting progress')
    animationPhase.value = 'visible'
    
    // Use smooth easing instead of linear with hard padding
    const totalProgressTime = displayTime * 1000
    
    // Update progress every 16ms for smooth 60fps animation
    const updateFrequency = 16
    const totalUpdates = totalProgressTime / updateFrequency
    
    let currentUpdate = 0
    
    // Ease-in-out cubic function for smooth acceleration/deceleration
    const easeInOutCubic = (t: number): number => {
      if (t < 0.5) {
        return 4 * t * t * t
      } else {
        return 1 - Math.pow(-2 * t + 2, 3) / 2
      }
    }
    
    progressInterval.value = setInterval(() => {
      currentUpdate++
      
      // Calculate progress from 0 to 1
      const rawProgress = currentUpdate / totalUpdates
      
      if (rawProgress >= 1) {
        // Progress complete
        clearInterval(progressInterval.value!)
        progressInterval.value = null
        
        console.log('Vue: Progress complete with easing')
        progressWidth.value = 0
        
        // Start exit animation after brief moment
        setTimeout(() => {
          console.log('Vue: Starting exit animation')
          animationPhase.value = 'out'
          
          // Hide after exit animation completes
          setTimeout(() => {
            console.log('Vue: Exit animation complete, hiding')
            animationPhase.value = 'hidden'
            eventVisible.value = false
          }, animationOutDuration)
        }, 100)
      } else {
        // Apply easing to create smooth start/end
        const easedProgress = easeInOutCubic(rawProgress)
        progressWidth.value = Math.max(0, (1 - easedProgress) * 100)
      }
    }, updateFrequency)
  }, animationInDuration)
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
  // Reset progress immediately to prevent flash
  progressWidth.value = 0
  eventVisible.value = false
  animationPhase.value = 'hidden'
}

// Watch for event changes and manage progress bar
watch(() => props.event, (newEvent, oldEvent) => {
  // Convert proxy objects to raw objects for proper comparison and access
  const rawNewEvent = newEvent ? toRaw(newEvent) : null
  const rawOldEvent = oldEvent ? toRaw(oldEvent) : null
  
  console.log("Vue: Event change - new:", rawNewEvent?.id, "old:", rawOldEvent?.id)
  
  // Skip if it's the same event (by ID comparison)
  if (rawNewEvent?.id && rawOldEvent?.id && rawNewEvent.id === rawOldEvent.id) {
    console.log('Vue: Same event ID, skipping')
    return
  }
  
  // Start animation for new events
  if (rawNewEvent && rawNewEvent.display_time) {
    console.log('Vue: Starting animation cycle for new event:', rawNewEvent.id)
    startProgressBar(rawNewEvent.display_time)
  }
  
  // Note: We no longer stop animations when event becomes null
  // The animation cycle will complete naturally via internal timing
}, {immediate: true})

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
        v-if="animationPhase !== 'hidden'"
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
        
        <!-- Progress bar at bottom -->
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75 ease-linear"
            :style="{ 
              width: `${progressWidth}%`,
              opacity: progressWidth > 0 ? 1 : 0
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
  animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slide-in {
  animation: slide-in 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-bounce-in {
  animation: bounce-in 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-fade-out {
  animation: fade-out 0.6s cubic-bezier(0.3, 0, 0.8, 0.15);
}

.animate-slide-out {
  animation: slide-out 0.5s cubic-bezier(0.3, 0, 0.8, 0.15);
}

.animate-bounce-out {
  animation: bounce-out 0.8s cubic-bezier(0.3, 0, 0.8, 0.15);
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