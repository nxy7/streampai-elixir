<script setup lang="ts">
import { useWidgetRegistration } from '../composables/useWidgetRegistry'

interface Widget {
  id: string
  type: string
  x: number
  y: number
}

interface Props {
  widget: Widget
}

const props = defineProps<Props>()

const { widgetId, elementRef } = useWidgetRegistration(
  props.widget.type,
  { x: props.widget.x, y: props.widget.y },
  { id: props.widget.id }
)
</script>

<template>
  <div
    ref="elementRef"
    class="placeholder-widget"
  >
    <div class="widget-header">
      <div class="widget-icon">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      </div>
      <span class="widget-title">Placeholder Widget</span>
    </div>
    <div class="widget-content">
      <p class="text-xs text-gray-400">ID: {{ widget.id }}</p>
      <p class="text-xs text-gray-400">Position: ({{ widget.x }}, {{ widget.y }})</p>
    </div>
  </div>
</template>

<style scoped>
.placeholder-widget {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  min-width: 200px;
  min-height: 120px;
  cursor: move;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.placeholder-widget:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.3);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: white;
}

.widget-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.375rem;
  border-radius: 0.375rem;
}

.widget-title {
  font-size: 0.875rem;
  font-weight: 600;
}

.widget-content {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.375rem;
  padding: 0.5rem;
}
</style>
