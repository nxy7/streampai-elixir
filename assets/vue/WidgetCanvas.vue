<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWidgetRegistryProvider } from './composables/useWidgetRegistry'
import PlaceholderWidget from './widgets/PlaceholderWidget.vue'

interface Widget {
  id: string
  type: string
  x: number
  y: number
}

interface Props {
  widgets?: Widget[]
}

const props = withDefaults(defineProps<Props>(), {
  widgets: () => []
})

const registry = useWidgetRegistryProvider()

// 16:9 aspect ratio calculation
const canvasWidth = ref(1920)
const canvasHeight = computed(() => Math.round(canvasWidth.value * (9 / 16)))

const canvasStyle = computed(() => ({
  aspectRatio: '16 / 9',
  maxWidth: '100%',
  margin: '0 auto'
}))

function getWidgetComponent(type: string) {
  switch (type) {
    case 'placeholder':
      return PlaceholderWidget
    default:
      return PlaceholderWidget
  }
}
</script>

<template>
  <div class="widget-canvas-container">
    <div
      class="widget-canvas"
      :style="canvasStyle"
    >
      <div class="canvas-grid">
        <!-- Grid overlay for alignment (optional) -->
        <div class="grid-lines"></div>

        <!-- Render widgets -->
        <component
          v-for="widget in widgets"
          :key="widget.id"
          :is="getWidgetComponent(widget.type)"
          :widget="widget"
          :style="{
            position: 'absolute',
            left: `${widget.x}px`,
            top: `${widget.y}px`
          }"
        />

        <!-- Empty state -->
        <div v-if="widgets.length === 0" class="empty-state">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          <h3 class="text-lg font-medium text-gray-300 mb-2">No Widgets Yet</h3>
          <p class="text-sm text-gray-400">Click "Add Widget" above to start building your overlay</p>
        </div>
      </div>

      <!-- Canvas info overlay -->
      <div class="canvas-info">
        <span class="text-xs text-gray-400">1920x1080 (16:9)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.widget-canvas-container {
  width: 100%;
  background: #1a1a1a;
  border-radius: 0.5rem;
  padding: 1rem;
}

.widget-canvas {
  position: relative;
  background: #0f0f0f;
  border: 2px solid #333;
  border-radius: 0.375rem;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.canvas-grid {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.canvas-info {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  z-index: 10;
}
</style>
