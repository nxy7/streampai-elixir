<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'

interface TopDonor {
  id: string
  username: string
  amount: number
  currency: string
}

interface TopDonorsConfig {
  display_count: number
  currency: string
  theme: 'default' | 'minimal' | 'modern'
  background_color: string
  text_color: string
  animation_enabled: boolean
}

const props = defineProps<{
  config: TopDonorsConfig
  donors: TopDonor[]
}>()

const donorElements = ref<HTMLElement[]>([])
const animatingDonors = ref<Set<string>>(new Set())
const animatedAmounts = ref<Map<string, number>>(new Map())
const previousAmounts = ref<Map<string, number>>(new Map())
const animatingAmountIds = ref<Set<string>>(new Set())

const displayedDonors = computed(() => {
  return props.donors.slice(0, props.config.display_count || 10)
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
  '--bg-color': props.config.background_color || '#1f2937',
  '--text-color': props.config.text_color || '#ffffff'
}))

function getDonorRankEmoji(index: number): string {
  switch (index) {
    case 0: return '👑'
    case 1: return '🥈'
    case 2: return '🥉'
    default: return '🎖️'
  }
}

function getDonorSizeClass(index: number): string {
  switch (index) {
    case 0: return 'top-1'
    case 1: return 'top-2'
    case 2: return 'top-3'
    default: return 'regular'
  }
}

function formatAmount(amount: number, currency: string): string {
  return `${currency}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function getAnimatedAmount(donorId: string, actualAmount: number): number {
  return animatedAmounts.value.get(donorId) ?? actualAmount
}

function animateAmountChange(donorId: string, fromAmount: number, toAmount: number) {
  if (!props.config.animation_enabled || Math.abs(toAmount - fromAmount) < 0.01) {
    animatedAmounts.value.set(donorId, toAmount)
    return
  }

  // Add to animating set for visual feedback
  animatingAmountIds.value.add(donorId)

  const duration = 1200 // 1.2 seconds
  const steps = 60
  const increment = (toAmount - fromAmount) / steps
  let currentAmount = fromAmount
  let step = 0

  const timer = setInterval(() => {
    step++
    currentAmount += increment

    if (step >= steps) {
      animatedAmounts.value.set(donorId, toAmount)
      animatingAmountIds.value.delete(donorId)
      clearInterval(timer)
    } else {
      animatedAmounts.value.set(donorId, Math.round(currentAmount * 100) / 100)
    }
  }, duration / steps)
}

function isAnimatingAmount(donorId: string): boolean {
  return animatingAmountIds.value.has(donorId)
}

async function animateDonorChanges() {
  if (!props.config.animation_enabled) return

  await nextTick()

  const currentDonors = new Set(displayedDonors.value.map(d => d.id))
  const previousDonors = new Set(animatingDonors.value)

  const newDonors = [...currentDonors].filter(id => !previousDonors.has(id))
  const removedDonors = [...previousDonors].filter(id => !currentDonors.has(id))

  // Handle amount changes for existing donors
  displayedDonors.value.forEach(donor => {
    const previousAmount = previousAmounts.value.get(donor.id)
    if (previousAmount !== undefined && previousAmount !== donor.amount) {
      animateAmountChange(donor.id, previousAmount, donor.amount)
    } else if (previousAmount === undefined) {
      // New donor - set initial amount without animation
      animatedAmounts.value.set(donor.id, donor.amount)
    }
    previousAmounts.value.set(donor.id, donor.amount)
  })

  // Clean up removed donors
  removedDonors.forEach(id => {
    animatedAmounts.value.delete(id)
    previousAmounts.value.delete(id)
  })

  if (newDonors.length > 0 || removedDonors.length > 0) {
    animatingDonors.value = new Set([...animatingDonors.value, ...newDonors])

    setTimeout(() => {
      removedDonors.forEach(id => animatingDonors.value.delete(id))
    }, 600)
  }
}

watch(() => displayedDonors.value, animateDonorChanges, { deep: true })

onMounted(() => {
  // Initialize animated amounts with current values
  displayedDonors.value.forEach(donor => {
    animatedAmounts.value.set(donor.id, donor.amount)
    previousAmounts.value.set(donor.id, donor.amount)
  })
  animatingDonors.value = new Set(displayedDonors.value.map(d => d.id))
})
</script>

<template>
  <div class="widget-container">
    <div :class="['top-donors-widget', themeClasses]" :style="widgetStyle">
      <div class="widget-title">
        <div class="title-glow"></div>
        <span class="title-text">🏆 Top Donors</span>
        <div class="title-decoration"></div>
      </div>

      <div class="donors-list">
        <TransitionGroup
          name="donor"
          tag="div"
          class="donors-container"
        >
          <div
            v-for="(donor, index) in displayedDonors"
            :key="donor.id"
            :class="['donor-item', getDonorSizeClass(index), { 'last-podium': index === 2 }]"
            ref="donorElements"
          >
            <div class="donor-rank">
              <span class="rank-emoji">{{ getDonorRankEmoji(index) }}</span>
              <span class="rank-number">{{ index + 1 }}</span>
            </div>

            <div class="donor-info">
              <div class="donor-name">{{ donor.username }}</div>
              <div
                :class="['donor-amount', { 'animating': isAnimatingAmount(donor.id) }]"
              >
                {{ formatAmount(getAnimatedAmount(donor.id, donor.amount), donor.currency) }}
              </div>
            </div>

            <div v-if="index < 3" class="donor-glow"></div>
          </div>
        </TransitionGroup>
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

.top-donors-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: linear-gradient(145deg, var(--bg-color), color-mix(in srgb, var(--bg-color) 90%, white));
  backdrop-filter: blur(20px);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  width: 100%;
  max-width: 380px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
}

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
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent);
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
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, var(--text-color), #ffd700);
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
  background: linear-gradient(90deg, #ffd700, #ffed4e, #ffd700);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.donors-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  position: relative;
}

.donors-list::-webkit-scrollbar {
  width: 6px;
}

.donors-list::-webkit-scrollbar-track {
  background: transparent;
}

.donors-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.donors-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.donors-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  min-height: 0;
}

.donor-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* Add extra margin after position 3 to separate top 3 from the rest */
.donor-item.last-podium {
  margin-bottom: 1.5rem;
}

.donor-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.donor-item.top-1 {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
}

.donor-item.top-2 {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1));
  border-color: rgba(192, 192, 192, 0.3);
  box-shadow: 0 0 15px rgba(192, 192, 192, 0.2);
}

.donor-item.top-3 {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1));
  border-color: rgba(205, 127, 50, 0.3);
  box-shadow: 0 0 12px rgba(205, 127, 50, 0.2);
}

.donor-glow {
  position: absolute;
  inset: -2px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  border-radius: 1rem;
  opacity: 0.5;
  filter: blur(8px);
  animation: donorGlow 3s ease-in-out infinite;
  z-index: -1;
}

@keyframes donorGlow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

.donor-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3rem;
}

.rank-emoji {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.rank-number {
  font-size: 0.875rem;
  font-weight: 700;
  color: color-mix(in srgb, var(--text-color) 70%, transparent);
  line-height: 1;
}

.donor-info {
  flex: 1;
  min-width: 0;
}

.donor-name {
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.25rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  word-break: break-word;
}

.donor-amount {
  font-size: 0.875rem;
  font-weight: 600;
  color: #10b981;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.donor-amount.animating {
  color: #fbbf24;
  transform: scale(1.05);
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}

.donor-amount.animating::after {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, transparent, rgba(251, 191, 36, 0.2), transparent);
  border-radius: 4px;
  opacity: 0;
  animation: numberPulse 1.2s ease-in-out;
  pointer-events: none;
}

@keyframes numberPulse {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1); }
}

.top-1 .donor-name {
  font-size: 1.125rem;
}

.top-2 .donor-name {
  font-size: 1.0625rem;
}

.top-3 .donor-name {
  font-size: 1.03125rem;
}

.donor-enter-active {
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  max-height: 100px;
  overflow: hidden;
}

.donor-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0.06, 0.68, 0.19);
  position: absolute !important;
  left: 0;
  right: 0;
  width: 100%;
  z-index: -1;
}

.donor-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  max-height: 0;
  overflow: hidden;
}

.donor-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
  max-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden;
}

.donor-move {
  transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Ensure smooth height transitions for container */
.donors-container {
  transition: height 0.6s ease-out;
}

/* Reserve space to prevent layout shifts */
.donor-item {
  position: relative;
}

.theme-minimal {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.theme-minimal .donor-item {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
}

.theme-modern {
  background: linear-gradient(145deg,
    rgba(15, 23, 42, 0.95),
    rgba(30, 41, 59, 0.9)
  );
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.theme-modern .donor-item {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(148, 163, 184, 0.1);
}

@container widget (max-width: 300px) {
  .top-donors-widget {
    padding: 1rem;
  }

  .donor-item {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .rank-emoji {
    font-size: 1.25rem;
  }

  .donor-name {
    font-size: 0.9375rem;
  }

  .top-1 .donor-name {
    font-size: 1rem;
  }
}

@container widget (max-height: 400px) {
  .donors-container {
    gap: 0.5rem;
  }

  .donor-item {
    padding: 0.75rem;
  }
}

@container widget (max-width: 300px) {
  .top-donors-widget {
    padding: 1rem;
  }

  .donor-item {
    padding: 0.75rem;
  }
}
</style>
