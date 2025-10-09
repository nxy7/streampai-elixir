<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface StreamSettings {
  title: string
  description: string
  thumbnailFile: File | null
}

const props = defineProps<{
  modelValue: StreamSettings
  currentThumbnailUrl?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [StreamSettings]
  thumbnailChange: [Event]
}>()

const thumbnailPreview = ref<string | null>(props.currentThumbnailUrl || null)

// Watch for changes to currentThumbnailUrl and update preview
watch(() => props.currentThumbnailUrl, (newUrl) => {
  if (newUrl && !thumbnailPreview.value) {
    thumbnailPreview.value = newUrl
  }
})

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleThumbnailChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      thumbnailPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    const newSettings = {
      ...localValue.value,
      thumbnailFile: file
    }
    emit('update:modelValue', newSettings)
  }
  emit('thumbnailChange', event)
}

const clearThumbnail = () => {
  // Restore to original thumbnail URL if available
  thumbnailPreview.value = props.currentThumbnailUrl || null
  const newSettings = {
    ...localValue.value,
    thumbnailFile: null
  }
  emit('update:modelValue', newSettings)
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
      <label class="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>

      <div class="flex items-start space-x-4">
        <!-- Thumbnail Preview (16:9 aspect ratio) -->
        <div class="relative">
          <div class="w-48 aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
            <img
              v-if="thumbnailPreview"
              :src="thumbnailPreview"
              alt="Thumbnail preview"
              class="w-full h-full object-cover"
            />
            <svg v-else class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div v-if="localValue.thumbnailFile" class="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <!-- File Selection -->
        <div class="flex-1">
          <label
            for="thumbnail-file-input"
            class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ localValue.thumbnailFile ? 'Change Thumbnail' : 'Select Thumbnail' }}
          </label>
          <input
            id="thumbnail-file-input"
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            @change="handleThumbnailChange"
            class="hidden"
          />

          <button
            v-if="localValue.thumbnailFile"
            type="button"
            @click="clearThumbnail"
            class="ml-2 text-sm text-red-600 hover:text-red-700"
          >
            Remove
          </button>

          <p class="text-xs text-gray-500 mt-1">
            JPG or PNG, max 5MB
          </p>

          <p v-if="localValue.thumbnailFile" class="text-xs text-green-600 mt-1">
            ✓ {{ localValue.thumbnailFile.name }} selected
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
