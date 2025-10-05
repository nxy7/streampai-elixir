<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import StreamSettingsFormFields from './StreamSettingsFormFields.vue'

interface StreamMetadata {
  title: string
  description: string
  thumbnail_url?: string | null
}

const props = defineProps<{
  metadata: StreamMetadata
}>()

const emit = defineEmits<{
  updateMetadata: [{ title: string; description: string }]
  uploadThumbnail: [Event]
}>()

const streamSettings = ref({
  title: '',
  description: '',
  thumbnailFile: null as File | null
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

const handleThumbnailChange = (event: Event) => {
  emit('uploadThumbnail', event)
}
</script>

<template>
  <div class="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
    <StreamSettingsFormFields
      v-model="streamSettings"
      @thumbnail-change="handleThumbnailChange"
    />

    <div v-if="metadata.thumbnail_url" class="mt-2">
      <img
        :src="metadata.thumbnail_url"
        alt="Thumbnail preview"
        class="h-20 rounded border border-gray-200"
      />
    </div>
  </div>
</template>
