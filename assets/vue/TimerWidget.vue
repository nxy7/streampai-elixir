<template>
  <div class="timer-widget" :class="widgetClasses">
    <div class="timer-container">
      <div class="timer-display">
        <div class="timer-value">{{ formattedTime }}</div>
        <div v-if="showLabel && timerLabel" class="timer-label">{{ timerLabel }}</div>
      </div>

      <div v-if="showProgressBar" class="timer-progress">
        <div class="timer-progress-bar" :style="progressBarStyle"></div>
      </div>

      <div v-if="lastExtension" class="timer-extension" :class="extensionClass">
        <span class="extension-text">+{{ lastExtension.amount }}s</span>
        <span class="extension-user">{{ lastExtension.username }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface TimerConfig {
  initial_duration: number
  count_direction: 'up' | 'down'
  show_label: boolean
  timer_label: string
  show_progress_bar: boolean
  timer_color: string
  background_color: string
  font_size: 'small' | 'medium' | 'large' | 'extra-large'
  timer_format: 'mm:ss' | 'hh:mm:ss' | 'seconds'
  auto_restart: boolean
  restart_duration: number
  extension_animation: 'slide' | 'fade' | 'bounce'
  sound_enabled: boolean
  sound_volume: number
  warning_threshold: number
  warning_color: string
}

interface TimerEvent {
  type: 'start' | 'stop' | 'resume' | 'reset' | 'extend' | 'set_time'
  duration?: number
  username?: string
  amount?: number
  time?: number
}

interface ExtensionInfo {
  amount: number
  username: string
  timestamp: number
}

const props = defineProps<{
  config: TimerConfig
  event?: TimerEvent
}>()

// Timer state
const currentTime = ref(0)
const isRunning = ref(false)
const isPaused = ref(false)
const totalDuration = ref(props.config.initial_duration || 300)
const lastExtension = ref<ExtensionInfo | null>(null)
const extensionClass = ref('')

let timerInterval: number | null = null
let extensionTimeout: number | null = null

// Computed properties
const formattedTime = computed(() => {
  const time = Math.max(0, currentTime.value)
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.floor(time % 60)

  switch (props.config.timer_format) {
    case 'hh:mm:ss':
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    case 'seconds':
      return time.toString()
    case 'mm:ss':
    default:
      const totalMinutes = Math.floor(time / 60)
      return `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
})

const progressBarStyle = computed(() => {
  if (props.config.count_direction === 'down') {
    const progress = (currentTime.value / totalDuration.value) * 100
    return {
      width: `${Math.max(0, Math.min(100, progress))}%`,
      backgroundColor: isInWarning.value ? props.config.warning_color : props.config.timer_color
    }
  } else {
    const progress = (currentTime.value / totalDuration.value) * 100
    return {
      width: `${Math.min(100, progress)}%`,
      backgroundColor: props.config.timer_color
    }
  }
})

const isInWarning = computed(() => {
  if (props.config.count_direction === 'down' && props.config.warning_threshold > 0) {
    return currentTime.value <= props.config.warning_threshold && currentTime.value > 0
  }
  return false
})

const widgetClasses = computed(() => {
  return {
    [`font-${props.config.font_size}`]: true,
    'warning': isInWarning.value,
    'paused': isPaused.value
  }
})

const showLabel = computed(() => props.config.show_label)
const timerLabel = computed(() => props.config.timer_label)
const showProgressBar = computed(() => props.config.show_progress_bar)

// Timer control functions
const startTimer = () => {
  // Always clear any existing timer first
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  isRunning.value = true
  isPaused.value = false

  timerInterval = setInterval(() => {
    if (props.config.count_direction === 'down') {
      currentTime.value--
      if (currentTime.value <= 0) {
        currentTime.value = 0
        stopTimer()
        if (props.config.auto_restart) {
          setTimeout(() => {
            resetTimer(props.config.restart_duration || totalDuration.value)
            startTimer()
          }, 1000)
        }
      }
    } else {
      currentTime.value++
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  isRunning.value = false
  isPaused.value = false
}

const pauseTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  isRunning.value = false
  isPaused.value = true
}

const resumeTimer = () => {
  if (isPaused.value && !isRunning.value) {
    startTimer()
  }
}

const resetTimer = (duration?: number) => {
  // Stop any running timer
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  // Reset state
  isRunning.value = false
  isPaused.value = false

  // Reset time
  const resetDuration = duration || totalDuration.value
  if (props.config.count_direction === 'down') {
    currentTime.value = resetDuration
  } else {
    currentTime.value = 0
  }
  totalDuration.value = resetDuration
}

const extendTimer = (amount: number, username: string) => {
  if (props.config.count_direction === 'down') {
    currentTime.value += amount
  } else {
    totalDuration.value += amount
  }

  // Show extension animation
  lastExtension.value = { amount, username, timestamp: Date.now() }
  extensionClass.value = `extension-${props.config.extension_animation}`

  // Clear any existing timeout
  if (extensionTimeout) {
    clearTimeout(extensionTimeout)
  }

  extensionTimeout = setTimeout(() => {
    lastExtension.value = null
    extensionClass.value = ''
    extensionTimeout = null
  }, 3000)

  // TODO: Implement sound effects when needed
}

const setTime = (time: number) => {
  currentTime.value = time
}


// Watch for events
watch(() => props.event, (newEvent, oldEvent) => {
  if (!newEvent) return

  switch (newEvent.type) {
    case 'start':
    case 'resume':
      // Just start/resume the timer without resetting time
      startTimer()
      break
    case 'stop':
      pauseTimer()
      break
    case 'reset':
      resetTimer(newEvent.duration)
      break
    case 'extend':
      if (newEvent.amount && newEvent.username) {
        extendTimer(newEvent.amount, newEvent.username)
      }
      break
    case 'set_time':
      if (newEvent.time !== undefined) {
        setTime(newEvent.time)
      }
      break
  }
}, { deep: true })

// Initialize timer on mount
onMounted(() => {
  if (props.config.count_direction === 'down') {
    currentTime.value = props.config.initial_duration || 300
  } else {
    currentTime.value = 0
  }
})

// Cleanup function
const cleanup = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  if (extensionTimeout) {
    clearTimeout(extensionTimeout)
    extensionTimeout = null
  }
}

// Cleanup on unmount
onUnmounted(cleanup)
</script>

<style scoped>
.timer-widget {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: v-bind('config.timer_color');
  padding: 1rem;
}

.timer-container {
  background-color: v-bind('config.background_color');
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.timer-display {
  text-align: center;
  margin-bottom: 1rem;
}

.timer-value {
  font-weight: bold;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  transition: color 0.3s ease;
}

.timer-label {
  margin-top: 0.5rem;
  opacity: 0.8;
  font-size: 0.875em;
}

.timer-progress {
  width: 100%;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
}

.timer-progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 1s linear, background-color 0.3s ease;
}

.timer-extension {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.extension-text {
  font-weight: bold;
  font-size: 1.125em;
}

.extension-user {
  opacity: 0.9;
  font-size: 0.875em;
}

/* Animation classes */
.extension-slide {
  animation: slideIn 0.5s ease-out;
}

.extension-fade {
  animation: fadeIn 0.5s ease-out;
}

.extension-bounce {
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Font size classes */
.font-small .timer-value {
  font-size: 2rem;
}

.font-medium .timer-value {
  font-size: 3rem;
}

.font-large .timer-value {
  font-size: 4rem;
}

.font-extra-large .timer-value {
  font-size: 5rem;
}

/* Warning state */
.warning .timer-value {
  animation: pulse 1s infinite;
}

.warning .timer-container {
  border: 2px solid v-bind('config.warning_color');
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Paused state */
.paused .timer-value {
  opacity: 0.6;
}

.paused .timer-container::after {
  content: 'PAUSED';
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
  color: v-bind('config.timer_color');
  opacity: 0.7;
  letter-spacing: 0.1em;
}
</style>