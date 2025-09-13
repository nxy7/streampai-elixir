<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface DonationEvent {
  id: string
  amount: number
  currency: string
  username: string
  timestamp: Date
}

interface DonationGoalConfig {
  goal_amount: number
  starting_amount: number
  currency: string
  start_date: string
  end_date: string
  title: string
  show_percentage: boolean
  show_amount_raised: boolean
  show_days_left: boolean
  theme: 'default' | 'minimal' | 'modern'
  bar_color: string
  background_color: string
  text_color: string
  animation_enabled: boolean
}

interface FloatingBubble {
  id: string
  amount: number
  currency: string
  x: number
  y: number
}

const props = defineProps<{
  config: DonationGoalConfig
  currentAmount: number
  donation?: DonationEvent | null
}>()

const progressBarRef = ref<HTMLElement>()
const floatingBubbles = ref<FloatingBubble[]>([])
const animatedAmount = ref(props.currentAmount || props.config.starting_amount || 0)

const progressPercentage = computed(() => {
  const total = animatedAmount.value
  const goal = props.config.goal_amount || 1000
  return Math.min((total / goal) * 100, 100)
})

const formattedGoal = computed(() => {
  const currency = props.config.currency || '$'
  const amount = props.config.goal_amount || 1000
  return `${currency}${amount.toLocaleString()}`
})

const formattedCurrent = computed(() => {
  const currency = props.config.currency || '$'
  return `${currency}${animatedAmount.value.toLocaleString()}`
})

const daysLeft = computed(() => {
  if (!props.config.end_date) return null
  const end = new Date(props.config.end_date)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 0
})

const themeClasses = computed(() => {
  switch (props.config.theme) {
    case 'minimal':
      return 'theme-minimal'
    case 'modern':
      return 'theme-modern'
    default:
      return 'theme-default'
  }
})

const widgetStyle = computed(() => ({
  '--bar-color': props.config.bar_color || '#10b981',
  '--bg-color': props.config.background_color || '#e5e7eb',
  '--text-color': props.config.text_color || '#1f2937'
}))

const progressBarStyle = computed(() => ({
  width: `${progressPercentage.value}%`
}))

watch(() => props.currentAmount, (newAmount, oldAmount) => {
  if (newAmount > oldAmount && props.config.animation_enabled) {
    animateAmountChange(oldAmount, newAmount)
  } else {
    animatedAmount.value = newAmount
  }
})

watch(() => props.donation, (newDonation) => {
  if (newDonation && props.config.animation_enabled) {
    createFloatingBubble(newDonation)
  }
})


function animateAmountChange(from: number, to: number) {
  const duration = 1000
  const steps = 60
  const increment = (to - from) / steps
  let current = from
  let step = 0

  const timer = setInterval(() => {
    step++
    current += increment

    if (step >= steps) {
      animatedAmount.value = to
      clearInterval(timer)
    } else {
      animatedAmount.value = Math.round(current * 100) / 100
    }
  }, duration / steps)
}

function createFloatingBubble(donation: DonationEvent) {
  if (!progressBarRef.value) return

  const rect = progressBarRef.value.getBoundingClientRect()
  const x = Math.random() * (rect.width - 100) + 50
  const y = rect.height / 2

  const bubble: FloatingBubble = {
    id: donation.id,
    amount: donation.amount,
    currency: donation.currency || props.config.currency || '$',
    x,
    y
  }

  floatingBubbles.value.push(bubble)

  setTimeout(() => {
    floatingBubbles.value = floatingBubbles.value.filter(b => b.id !== bubble.id)
  }, 3000)
}

onMounted(() => {
  animatedAmount.value = props.currentAmount || props.config.starting_amount || 0
})
</script>

<template>
  <div class="widget-container">
    <div :class="['donation-goal-widget', themeClasses]" :style="widgetStyle">
    <!-- Title Section with Enhanced Styling -->
    <div v-if="config.title" class="widget-title">
      <div class="title-glow"></div>
      <span class="title-text">{{ config.title }}</span>
      <div class="title-decoration"></div>
    </div>

    <!-- Main Progress Section -->
    <div class="progress-section">
      <!-- Progress Bar Container with Enhanced Design -->
      <div class="progress-container" ref="progressBarRef">
        <!-- Progress Label -->
        <div class="progress-labels">
          <div class="current-amount">{{ formattedCurrent }}</div>
          <div class="goal-amount">{{ formattedGoal }}</div>
        </div>

        <!-- Enhanced Progress Bar -->
        <div class="progress-track">
          <!-- Background with gradient -->
          <div class="progress-background">
            <div class="progress-texture"></div>
          </div>

          <!-- Filled Progress Bar with Glow -->
          <div class="progress-bar" :style="progressBarStyle">
            <div v-if="config.animation_enabled" class="progress-shimmer"></div>
            <div class="progress-glow"></div>
            <div class="progress-highlight"></div>
          </div>

          <!-- Progress Percentage Indicator -->
          <div
            v-if="config.show_percentage"
            class="progress-indicator"
            :style="{ left: `${Math.min(progressPercentage, 95)}%` }"
          >
            <div class="indicator-bubble">
              {{ Math.round(progressPercentage) }}%
            </div>
            <div class="indicator-arrow"></div>
          </div>
        </div>

        <!-- Floating Donation Bubbles -->
        <div
          v-for="bubble in floatingBubbles"
          :key="bubble.id"
          class="floating-bubble"
          :style="{ left: `${bubble.x}px`, bottom: `${bubble.y}px` }"
        >
          <div class="bubble-content">
            <div class="bubble-plus">+</div>
            <div class="bubble-amount">{{ bubble.currency }}{{ bubble.amount }}</div>
          </div>
          <div class="bubble-glow"></div>
        </div>
      </div>

      <!-- Enhanced Stats Section -->
      <div class="stats-container">
        <!-- Days Left with Subtle Styling -->
        <div v-if="config.show_days_left && daysLeft !== null" class="days-left-subtle">
          {{ daysLeft }} days left
        </div>

      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.widget-container {
  width: 100%;
  height: 100%;
  container-type: size;
  container-name: widget;
}

.donation-goal-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  backdrop-filter: blur(20px);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-color);
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
}

.donation-goal-widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--bar-color), transparent);
  animation: titleShine 3s ease-in-out infinite;
}

@keyframes titleShine {
  0%, 100% { left: -100%; opacity: 0; }
  50% { left: 100%; opacity: 1; }
}

/* Enhanced Title */
.widget-title {
  position: relative;
  text-align: center;
  margin-bottom: 1rem;
  overflow: hidden;
  flex-shrink: 0;
}

.title-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.3), transparent);
  border-radius: 0.5rem;
  opacity: 0;
  animation: titleGlow 4s ease-in-out infinite;
}

@keyframes titleGlow {
  0%, 100% { transform: translateX(-100%); opacity: 0; }
  50% { transform: translateX(100%); opacity: 1; }
}

.title-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-color);
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, var(--text-color), color-mix(in srgb, var(--text-color) 70%, var(--bar-color)));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-decoration {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--bar-color), color-mix(in srgb, var(--bar-color) 50%, white), var(--bar-color));
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
}

/* Enhanced Progress Section */
.progress-section {
  position: relative;
}

.progress-container {
  position: relative;
  margin-bottom: 1rem;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.current-amount {
  color: var(--bar-color);
  font-size: 1.1rem;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.goal-amount {
  color: color-mix(in srgb, var(--text-color) 70%, transparent);
  font-size: 1rem;
}

.progress-track {
  position: relative;
  height: 2.5rem;
  margin-bottom: 1rem;
}

.progress-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--bg-color) 90%, white),
    var(--bg-color),
    color-mix(in srgb, var(--bg-color) 90%, black)
  );
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-texture {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent 0px,
    rgba(255, 255, 255, 0.1) 1px,
    transparent 2px
  );
}

.progress-bar {
  position: relative;
  height: 100%;
  background: linear-gradient(135deg,
    var(--bar-color),
    color-mix(in srgb, var(--bar-color) 80%, white),
    var(--bar-color),
    color-mix(in srgb, var(--bar-color) 90%, white)
  );
  border-radius: 1.25rem;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow:
    0 0 20px rgba(168, 85, 247, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.progress-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(90deg, transparent, var(--bar-color), transparent);
  border-radius: 1.25rem;
  opacity: 0.6;
  filter: blur(6px);
  animation: progressPulse 2s ease-in-out infinite;
}

@keyframes progressPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

.progress-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 1.25rem 1.25rem 0 0;
}

.progress-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  animation: shimmer 3s infinite;
  border-radius: 1.25rem;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 200%; }
}

/* Progress Indicator */
.progress-indicator {
  position: absolute;
  top: -45px;
  transform: translateX(-50%);
  z-index: 20;
}

.indicator-bubble {
  background: var(--bar-color);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  animation: indicatorBounce 2s ease-in-out infinite;
}

.indicator-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid var(--bar-color);
}

@keyframes indicatorBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* Enhanced Floating Bubbles */
.floating-bubble {
  position: absolute;
  pointer-events: none;
  animation: floatUp 4s ease-out forwards;
  z-index: 15;
}

.bubble-content {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--bar-color), color-mix(in srgb, var(--bar-color) 80%, white));
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-weight: 800;
  font-size: 0.875rem;
  white-space: nowrap;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 2;
}

.bubble-plus {
  font-size: 1.1rem;
  margin-right: 0.25rem;
  animation: bubblePulse 0.6s ease-out;
}

.bubble-amount {
  font-weight: 900;
}

.bubble-glow {
  position: absolute;
  inset: -4px;
  background: radial-gradient(circle, var(--bar-color) 0%, transparent 70%);
  border-radius: 2rem;
  opacity: 0.8;
  filter: blur(8px);
  animation: bubbleGlow 0.8s ease-out;
}

@keyframes floatUp {
  0% {
    transform: translateY(0) scale(0.7) rotate(-5deg);
    opacity: 0;
  }
  15% {
    transform: translateY(-15px) scale(1.2) rotate(2deg);
    opacity: 1;
  }
  85% {
    transform: translateY(-80px) scale(1) rotate(-2deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-120px) scale(0.8) rotate(5deg);
    opacity: 0;
  }
}

@keyframes bubblePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

@keyframes bubbleGlow {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.8; transform: scale(1); }
}

/* Enhanced Stats */
.stats-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 0.75rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 70px;
  flex: 1;
  max-width: 120px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Subtle Days Left */
.days-left-subtle {
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--text-color) 50%, transparent);
  text-align: center;
  font-weight: 500;
  margin-top: 0.5rem;
}

.stat-content {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-color);
  line-height: 1.2;
  margin-bottom: 0.25rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--text-color) 60%, transparent);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}


/* Theme Variations */
.theme-minimal {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.theme-minimal .progress-track {
  height: 1.5rem;
}

.theme-minimal .title-text {
  font-size: 1.25rem;
}

.theme-modern {
  background: linear-gradient(145deg,
    rgba(15, 23, 42, 0.95),
    rgba(30, 41, 59, 0.9)
  );
  border: 1px solid rgba(148, 163, 184, 0.1);
  color: #e2e8f0;
}

.theme-modern .title-text {
  color: #f8fafc;
}

.theme-modern .stat-item {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(148, 163, 184, 0.1);
}

/* Responsive Design based on container aspect ratio */

/* Horizontal layout for wide containers */
@container widget (min-aspect-ratio: 3/2) {
  .donation-goal-widget {
    flex-direction: column;
    gap: 1.5rem;
  }

  .widget-title {
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .progress-section {
    display: flex;
    flex-direction: column;
  }

  .stats-container {
    justify-content: center;
    margin-top: 0;
  }

  .stat-item {
    min-width: 100px;
    max-width: none;
  }
}

/* Very wide container adjustments */
@container widget (min-aspect-ratio: 4/1) {
  .donation-goal-widget {
    gap: 3rem;
  }

  .stats-container {
    flex-direction: row;
    gap: 1rem;
  }
}

/* Compact adjustments for small containers */
@container widget (max-height: 200px) {
  .donation-goal-widget {
    padding: 1rem;
  }

  .title-text {
    font-size: 1.25rem;
  }

  .progress-track {
    height: 1.5rem;
  }

  .stat-item {
    padding: 0.5rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}

@container widget (max-width: 300px) {
  .donation-goal-widget {
    padding: 1rem;
  }

  .stats-container {
    gap: 0.5rem;
  }

  .stat-item {
    padding: 0.5rem;
    min-width: 60px;
  }

  .stat-value {
    font-size: 1rem;
  }

  .stat-label {
    font-size: 0.625rem;
  }
}

/* Legacy media queries for fallback */
@media (max-width: 480px) {
  .donation-goal-widget {
    padding: 1rem;
  }

  .title-text {
    font-size: 1.25rem;
  }

  .progress-track {
    height: 2rem;
  }

  .stats-container {
    gap: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.625rem;
  }
}
</style>