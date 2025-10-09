<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface StreamMetadata {
  title: string
  description: string
  thumbnail_url?: string | null
  thumbnail_file_id?: string | null
}

const props = defineProps<{
  metadata: StreamMetadata
  uploadId: string
}>()

const emit = defineEmits<{
  updateMetadata: [{ title: string; description: string }]
}>()

const streamSettings = ref({
  title: '',
  description: ''
})

onMounted(() => {
  streamSettings.value.title = props.metadata.title || ''
  streamSettings.value.description = props.metadata.description || ''
})

// Auto-update on change
watch(() => streamSettings.value.title, (newTitle) => {
  emit('updateMetadata', {
    title: newTitle,
    description: streamSettings.value.description
  })
})

watch(() => streamSettings.value.description, (newDescription) => {
  emit('updateMetadata', {
    title: streamSettings.value.title,
    description: newDescription
  })
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
      <input
        v-model="streamSettings.title"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder="Enter stream title"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea
        v-model="streamSettings.description"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder="Enter stream description"
      ></textarea>
    </div>
  </div>
</template>
