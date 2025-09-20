<template>
  <div class="poll-widget" :class="widgetClasses">
    <div class="poll-container">
      <div v-if="showTitle && pollStatus?.title" class="poll-title">{{ pollStatus.title }}</div>

      <div v-if="pollStatus?.status === 'active'" class="poll-active">
        <div class="poll-options">
          <div
            v-for="option in pollStatus.options"
            :key="option.id"
            class="poll-option"
            :class="{ 'winning': isWinning(option) }"
          >
            <div class="option-content">
              <div class="option-text">{{ option.text }}</div>
              <div class="option-stats">
                <span class="option-votes">{{ option.votes }} votes</span>
                <span class="option-percentage">{{ getPercentage(option) }}%</span>
              </div>
            </div>
            <div class="option-bar">
              <div
                class="option-progress"
                :style="{ width: getPercentage(option) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="poll-footer">
          <div class="total-votes">{{ totalVotes }} total votes</div>
          <div v-if="pollStatus.ends_at" class="time-remaining">
            Ends {{ formatTimeRemaining(pollStatus.ends_at) }}
          </div>
        </div>
      </div>

      <div v-else-if="pollStatus?.status === 'ended'" class="poll-ended">
        <div class="poll-results">
          <div class="winner-announcement">Poll Results</div>
          <div
            v-for="(option, index) in sortedResults"
            :key="option.id"
            class="result-option"
            :class="{ 'winner': index === 0, 'runner-up': index === 1 }"
          >
            <div class="result-content">
              <div class="result-position">#{{ index + 1 }}</div>
              <div class="result-text">{{ option.text }}</div>
              <div class="result-stats">
                <span class="result-votes">{{ option.votes }} votes</span>
                <span class="result-percentage">{{ getPercentage(option) }}%</span>
              </div>
            </div>
            <div class="result-bar">
              <div
                class="result-progress"
                :style="{ width: getPercentage(option) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="poll-footer">
          <div class="total-votes">{{ totalVotes }} total votes</div>
          <div class="poll-ended-text">Poll ended</div>
        </div>
      </div>

      <div v-else class="poll-waiting">
        <div class="waiting-message">Waiting for poll...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface PollOption {
  id: string
  text: string
  votes: number
}

interface PollStatus {
  id: string
  title?: string
  status: 'waiting' | 'active' | 'ended'
  options: PollOption[]
  total_votes: number
  created_at: Date
  ends_at?: Date
  platform?: string
}

interface PollConfig {
  show_title: boolean
  show_percentages: boolean
  show_vote_counts: boolean
  font_size: 'small' | 'medium' | 'large' | 'extra-large'
  primary_color: string
  secondary_color: string
  background_color: string
  text_color: string
  winner_color: string
  animation_type: 'none' | 'smooth' | 'bounce'
  highlight_winner: boolean
  auto_hide_after_end: boolean
  hide_delay: number
}

const props = defineProps<{
  config: PollConfig
  pollStatus?: PollStatus
}>()

const totalVotes = computed(() => {
  if (!props.pollStatus?.options) return 0
  return props.pollStatus.options.reduce((sum, option) => sum + option.votes, 0)
})

const showTitle = computed(() => props.config.show_title)

const widgetClasses = computed(() => {
  return {
    [`font-${props.config.font_size}`]: true,
    [`animation-${props.config.animation_type}`]: true
  }
})

const sortedResults = computed(() => {
  if (!props.pollStatus?.options) return []
  return [...props.pollStatus.options].sort((a, b) => b.votes - a.votes)
})

const getPercentage = (option: PollOption): number => {
  if (totalVotes.value === 0) return 0
  return Math.round((option.votes / totalVotes.value) * 100)
}

const isWinning = (option: PollOption): boolean => {
  if (!props.config.highlight_winner || totalVotes.value === 0) return false
  const maxVotes = Math.max(...(props.pollStatus?.options.map(o => o.votes) || [0]))
  return option.votes === maxVotes && option.votes > 0
}

const formatTimeRemaining = (endsAt: Date): string => {
  const now = new Date()
  const end = new Date(endsAt)
  const diffMs = end.getTime() - now.getTime()

  if (diffMs <= 0) return 'now'

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  if (diffMinutes > 0) {
    return `in ${diffMinutes}m ${diffSeconds}s`
  } else {
    return `in ${diffSeconds}s`
  }
}
</script>

<style scoped>
.poll-widget {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: v-bind('config.text_color');
  padding: 1rem;
}

.poll-container {
  background-color: v-bind('config.background_color');
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.poll-title {
  font-size: 1.25em;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1.5rem;
  color: v-bind('config.primary_color');
}

.poll-active {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.poll-options {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.poll-option {
  position: relative;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.poll-option.winning {
  border-color: v-bind('config.winner_color');
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.option-content {
  position: relative;
  z-index: 2;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-text {
  font-weight: 500;
  flex: 1;
}

.option-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875em;
  opacity: 0.8;
}

.option-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.05);
}

.option-progress {
  height: 100%;
  background-color: v-bind('config.primary_color');
  opacity: 0.2;
  transition: width 0.8s ease;
}

.poll-option.winning .option-progress {
  background-color: v-bind('config.winner_color');
  opacity: 0.3;
}

.poll-ended {
  flex: 1;
}

.winner-announcement {
  text-align: center;
  font-size: 1.125em;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: v-bind('config.primary_color');
}

.poll-results {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-option {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 2px solid transparent;
}

.result-option.winner {
  border-color: v-bind('config.winner_color');
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
}

.result-option.runner-up {
  border-color: v-bind('config.secondary_color');
}

.result-content {
  position: relative;
  z-index: 2;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.result-position {
  font-weight: bold;
  font-size: 1.125em;
  min-width: 2rem;
}

.result-option.winner .result-position {
  color: v-bind('config.winner_color');
}

.result-text {
  font-weight: 500;
  flex: 1;
}

.result-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875em;
  opacity: 0.8;
}

.result-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.03);
}

.result-progress {
  height: 100%;
  background-color: v-bind('config.primary_color');
  opacity: 0.15;
  transition: width 1s ease;
}

.result-option.winner .result-progress {
  background-color: v-bind('config.winner_color');
  opacity: 0.25;
}

.poll-footer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875em;
  opacity: 0.7;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.poll-waiting {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.waiting-message {
  font-size: 1.125em;
  opacity: 0.6;
  text-align: center;
}

/* Font size classes */
.font-small {
  font-size: 0.875rem;
}

.font-medium {
  font-size: 1rem;
}

.font-large {
  font-size: 1.125rem;
}

.font-extra-large {
  font-size: 1.25rem;
}

.font-small .poll-title {
  font-size: 1.125em;
}

.font-large .poll-title {
  font-size: 1.375em;
}

.font-extra-large .poll-title {
  font-size: 1.5em;
}

/* Animation classes */
.animation-smooth .option-progress,
.animation-smooth .result-progress {
  transition: width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.animation-bounce .option-progress,
.animation-bounce .result-progress {
  transition: width 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animation-none .option-progress,
.animation-none .result-progress {
  transition: width 0.3s ease;
}

/* Winner highlighting animations */
.poll-option.winning {
  animation: winnerGlow 2s infinite alternate;
}

@keyframes winnerGlow {
  0% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
  }
  100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  }
}

.result-option.winner {
  animation: resultWinner 1s ease-in-out;
}

@keyframes resultWinner {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}
</style>