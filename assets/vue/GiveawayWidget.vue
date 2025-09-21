<template>
  <div class="giveaway-widget" :class="widgetClasses">
    <div class="giveaway-container">
      <!-- Title -->
      <div v-if="config.show_title && config.title" class="giveaway-title">
        {{ config.title }}
      </div>

      <!-- Description -->
      <div v-if="config.show_description && config.description" class="giveaway-description">
        {{ config.description }}
      </div>

      <!-- Giveaway Status -->
      <div class="giveaway-status">
        <div v-if="isActive" class="status-active">
          <div class="status-label">{{ config.active_label || 'Giveaway Active' }}</div>

          <!-- Participant Count -->
          <div class="participant-count">
            <div class="count-value">{{ participantCount }}</div>
            <div class="count-label">{{ participantCount === 1 ? 'Participant' : 'Participants' }}</div>
          </div>

          <!-- Patreon Multiplier Info -->
          <div v-if="config.patreon_multiplier > 1 && patreonCount > 0" class="patreon-info">
            <div class="patreon-count">{{ patreonCount }} Patreons ({{ config.patreon_multiplier }}x entries)</div>
          </div>

          <!-- Entry Method -->
          <div v-if="config.show_entry_method" class="entry-method">
            {{ config.entry_method_text || 'Type !join to enter' }}
          </div>
        </div>

        <!-- Winner Display -->
        <div v-else-if="winner" class="status-winner" :class="winnerAnimationClass">
          <div class="winner-label">{{ config.winner_label || 'Winner!' }}</div>
          <div class="winner-name">{{ winner.username }}</div>
          <div v-if="winner.isPatreon" class="winner-patreon-badge">
            {{ config.patreon_badge_text || 'Patreon' }}
          </div>
        </div>

        <!-- Inactive Status -->
        <div v-else class="status-inactive">
          <div class="inactive-label">{{ config.inactive_label || 'No Active Giveaway' }}</div>
        </div>
      </div>

      <!-- Progress Bar (if enabled) -->
      <div v-if="config.show_progress_bar && config.target_participants > 0" class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="progressBarStyle"></div>
        </div>
        <div class="progress-text">
          {{ participantCount }} / {{ config.target_participants }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface GiveawayConfig {
  show_title: boolean
  title: string
  show_description: boolean
  description: string
  active_label: string
  inactive_label: string
  winner_label: string
  entry_method_text: string
  show_entry_method: boolean
  show_progress_bar: boolean
  target_participants: number
  patreon_multiplier: number
  patreon_badge_text: string
  winner_animation: 'fade' | 'slide' | 'bounce' | 'confetti'
  title_color: string
  text_color: string
  background_color: string
  accent_color: string
  font_size: 'small' | 'medium' | 'large' | 'extra-large'
  show_patreon_info: boolean
}

interface GiveawayUpdate {
  type: 'update'
  participants: number
  patreons: number
  isActive: boolean
}

interface GiveawayResult {
  type: 'result'
  winner: {
    username: string
    isPatreon: boolean
  }
  totalParticipants: number
  patreonParticipants: number
}

type GiveawayEvent = GiveawayUpdate | GiveawayResult

const props = defineProps<{
  config: GiveawayConfig
  event?: GiveawayEvent
}>()

// Widget state
const participantCount = ref(0)
const patreonCount = ref(0)
const isActive = ref(false)
const winner = ref<{ username: string; isPatreon: boolean } | null>(null)
const winnerAnimationClass = ref('')

let animationTimeout: number | null = null

// Computed properties
const progressBarStyle = computed(() => {
  if (!props.config.show_progress_bar || props.config.target_participants <= 0) {
    return { width: '0%' }
  }

  const progress = Math.min(100, (participantCount.value / props.config.target_participants) * 100)
  return {
    width: `${progress}%`,
    backgroundColor: props.config.accent_color
  }
})

const widgetClasses = computed(() => {
  return {
    [`font-${props.config.font_size}`]: true,
    'has-winner': !!winner.value,
    'is-active': isActive.value
  }
})

// Watch for events
watch(() => props.event, (newEvent) => {
  if (!newEvent) return

  if (newEvent.type === 'update') {
    participantCount.value = newEvent.participants
    patreonCount.value = newEvent.patreons
    isActive.value = newEvent.isActive
    winner.value = null
    winnerAnimationClass.value = ''
  } else if (newEvent.type === 'result') {
    participantCount.value = newEvent.totalParticipants
    patreonCount.value = newEvent.patreonParticipants
    isActive.value = false
    winner.value = newEvent.winner

    // Apply winner animation
    winnerAnimationClass.value = `winner-${props.config.winner_animation}`

    // Clear animation class after animation completes
    if (animationTimeout) {
      clearTimeout(animationTimeout)
    }

    animationTimeout = setTimeout(() => {
      winnerAnimationClass.value = ''
      animationTimeout = null
    }, 2000)
  }
}, { deep: true })

// Cleanup function
const cleanup = () => {
  if (animationTimeout) {
    clearTimeout(animationTimeout)
    animationTimeout = null
  }
}

// Cleanup on unmount
onUnmounted(cleanup)
</script>

<style scoped>
.giveaway-widget {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: v-bind('config.text_color');
  padding: 1rem;
}

.giveaway-container {
  background-color: v-bind('config.background_color');
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.giveaway-title {
  font-size: 1.5em;
  font-weight: bold;
  color: v-bind('config.title_color');
  margin-bottom: 0.75rem;
  line-height: 1.2;
}

.giveaway-description {
  font-size: 0.9em;
  opacity: 0.9;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.giveaway-status {
  margin-bottom: 1rem;
}

.status-active {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, v-bind('config.accent_color') 0%, color-mix(in srgb, v-bind('config.accent_color') 80%, transparent) 100%);
  color: white;
}

.status-label {
  font-size: 0.875em;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.participant-count {
  margin: 0.75rem 0;
}

.count-value {
  font-size: 2em;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.count-label {
  font-size: 0.875em;
  opacity: 0.9;
}

.patreon-info {
  margin-top: 0.5rem;
  font-size: 0.8em;
  opacity: 0.9;
  padding: 0.25rem 0.5rem;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  display: inline-block;
}

.entry-method {
  margin-top: 0.75rem;
  font-size: 0.875em;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  display: inline-block;
}

.status-winner {
  padding: 1rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.winner-label {
  font-size: 1.1em;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.winner-name {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 0.5rem;
  line-height: 1.1;
}

.winner-patreon-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 0.375rem;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-inactive {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: rgba(107, 114, 128, 0.1);
  color: v-bind('config.text_color');
  opacity: 0.7;
}

.inactive-label {
  font-size: 1em;
  font-weight: 500;
}

.progress-container {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s ease;
}

.progress-text {
  font-size: 0.875em;
  opacity: 0.8;
  font-weight: 500;
}

/* Winner animations */
.winner-fade {
  animation: fadeIn 1s ease-out;
}

.winner-slide {
  animation: slideInUp 1s ease-out;
}

.winner-bounce {
  animation: bounceIn 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.winner-confetti {
  animation: confettiCelebration 2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
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

@keyframes confettiCelebration {
  0% {
    transform: scale(0.5) rotateZ(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.1) rotateZ(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotateZ(360deg);
    opacity: 1;
  }
}

/* Font size classes */
.font-small .count-value {
  font-size: 1.5em;
}

.font-small .giveaway-title {
  font-size: 1.2em;
}

.font-small .winner-name {
  font-size: 1.4em;
}

.font-medium .count-value {
  font-size: 2em;
}

.font-medium .giveaway-title {
  font-size: 1.5em;
}

.font-medium .winner-name {
  font-size: 1.8em;
}

.font-large .count-value {
  font-size: 2.5em;
}

.font-large .giveaway-title {
  font-size: 1.75em;
}

.font-large .winner-name {
  font-size: 2.2em;
}

.font-extra-large .count-value {
  font-size: 3em;
}

.font-extra-large .giveaway-title {
  font-size: 2em;
}

.font-extra-large .winner-name {
  font-size: 2.5em;
}

/* Responsive adjustments */
@media (max-width: 400px) {
  .giveaway-container {
    padding: 1rem;
  }

  .font-large .count-value,
  .font-extra-large .count-value {
    font-size: 2em;
  }

  .font-large .winner-name,
  .font-extra-large .winner-name {
    font-size: 1.8em;
  }
}
</style>