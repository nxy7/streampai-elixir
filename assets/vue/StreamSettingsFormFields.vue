<script setup lang="ts">
import { computed } from 'vue'

interface StreamSettings {
  title: string
  description: string
  thumbnailFile: File | null
}

const props = defineProps<{
  modelValue: StreamSettings
}>()

const emit = defineEmits<{
  'update:modelValue': [StreamSettings]
  thumbnailChange: [Event]
}>()

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleThumbnailChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const newSettings = {
      ...localValue.value,
      thumbnailFile: target.files[0]
    }
    emit('update:modelValue', newSettings)
  }
  emit('thumbnailChange', event)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
      <input
        v-model="localValue.title"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        placeholder="Enter stream title"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea
        v-model="localValue.description"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        placeholder="Enter stream description"
      ></textarea>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
      <input
        type="file"
        accept="image/*"
        @change="handleThumbnailChange"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
      />
      <p v-if="localValue.thumbnailFile" class="mt-1 text-sm text-gray-600">
        Selected: {{ localValue.thumbnailFile.name }}
      </p>
    </div>
  </div>
</template>
