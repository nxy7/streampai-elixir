<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'

interface StreamMetadata {
  title: string
  description: string
  thumbnail_url?: string | null
  thumbnail_file_id?: string | null
  category?: string | null
  subcategory?: string | null
  language?: string | null
  tags?: string[]
}

const props = defineProps<{
  metadata: StreamMetadata
  uploadId: string
}>()

const emit = defineEmits<{
  updateMetadata: [{
    title: string
    description: string
    category: string
    subcategory: string
    language: string
    tags: string[]
  }]
}>()

const streamSettings = ref({
  title: '',
  description: '',
  category: '',
  subcategory: '',
  language: '',
  tags: [] as string[]
})

const newTag = ref('')

const categories = [
  { value: '', label: 'Select Category' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Music' },
  { value: 'tech', label: 'Tech' },
  { value: 'art', label: 'Art' },
  { value: 'talk', label: 'Talk' },
  { value: 'irl', label: 'IRL' },
  { value: 'just_chatting', label: 'Just Chatting' }
]

const categorySubcategories: Record<string, string[]> = {
  gaming: [
    'league_of_legends', 'dota_2', 'counter_strike', 'valorant', 'minecraft',
    'fortnite', 'world_of_warcraft', 'overwatch', 'apex_legends', 'call_of_duty',
    'gta_v', 'among_us', 'rust', 'dead_by_daylight', 'hearthstone',
    'starcraft', 'diablo_4', 'elden_ring', 'baldurs_gate_3', 'other'
  ],
  music: [
    'rock', 'pop', 'hip_hop', 'electronic', 'jazz', 'classical', 'metal',
    'country', 'r_and_b', 'indie', 'folk', 'reggae', 'blues', 'edm',
    'house', 'techno', 'dubstep', 'ambient', 'lo_fi', 'other'
  ],
  tech: [
    'programming', 'web_development', 'game_development', 'mobile_development',
    'data_science', 'machine_learning', 'cybersecurity', 'devops', 'cloud_computing',
    'blockchain', 'hardware', '3d_printing', 'robotics', 'networking', 'databases', 'other'
  ],
  art: [
    'digital_art', 'traditional_art', '3d_modeling', 'animation', 'pixel_art',
    'character_design', 'landscape', 'portrait', 'abstract', 'illustration',
    'concept_art', 'painting', 'drawing', 'sculpture', 'photography', 'graphic_design', 'other'
  ],
  talk: [
    'podcast', 'interview', 'debate', 'news', 'politics', 'sports', 'entertainment',
    'lifestyle', 'education', 'science', 'philosophy', 'self_improvement',
    'business', 'finance', 'health', 'fitness', 'other'
  ],
  irl: [
    'cooking', 'travel', 'outdoor', 'sports', 'fitness', 'asmr', 'social_eating',
    'shopping', 'events', 'vlog', 'pranks', 'challenges', 'unboxing', 'diy', 'pets', 'other'
  ],
  just_chatting: [
    'casual', 'q_and_a', 'gaming_talk', 'creative_talk', 'news_discussion', 'social', 'other'
  ]
}

const availableSubcategories = computed(() => {
  if (!streamSettings.value.category) {
    return []
  }
  const subcats = categorySubcategories[streamSettings.value.category] || []
  return [
    { value: '', label: 'Select Subcategory' },
    ...subcats.map(subcat => ({
      value: subcat,
      label: formatSubcategoryLabel(subcat)
    }))
  ]
})

const formatSubcategoryLabel = (value: string): string => {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const languages = [
  { code: '', name: 'Select Language' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'tr', name: 'Turkish' }
]

onMounted(() => {
  streamSettings.value.title = props.metadata.title || ''
  streamSettings.value.description = props.metadata.description || ''
  streamSettings.value.category = props.metadata.category || ''
  streamSettings.value.subcategory = props.metadata.subcategory || ''
  streamSettings.value.language = props.metadata.language || ''
  streamSettings.value.tags = [...(props.metadata.tags || [])]
})

const emitUpdate = () => {
  emit('updateMetadata', {
    title: streamSettings.value.title,
    description: streamSettings.value.description,
    category: streamSettings.value.category,
    subcategory: streamSettings.value.subcategory,
    language: streamSettings.value.language,
    tags: [...streamSettings.value.tags]
  })
}

// Clear subcategory when category changes
watch(() => streamSettings.value.category, () => {
  streamSettings.value.subcategory = ''
})

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !streamSettings.value.tags.includes(tag) && streamSettings.value.tags.length < 10) {
    // Create a new array instead of mutating
    streamSettings.value.tags = [...streamSettings.value.tags, tag]
    newTag.value = ''
    emitUpdate()
  }
}

const removeTag = (index: number) => {
  // Create a new array instead of mutating
  streamSettings.value.tags = streamSettings.value.tags.filter((_, i) => i !== index)
  emitUpdate()
}

const handleTagKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    addTag()
  }
}
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
        @blur="emitUpdate"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea
        v-model="streamSettings.description"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder="Enter stream description"
        @blur="emitUpdate"
      ></textarea>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          v-model="streamSettings.category"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          @change="emitUpdate"
        >
          <option v-for="cat in categories" :key="cat.value" :value="cat.value">
            {{ cat.label }}
          </option>
        </select>
      </div>

      <div v-if="availableSubcategories.length > 0">
        <label class="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
        <select
          v-model="streamSettings.subcategory"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          @change="emitUpdate"
        >
          <option v-for="subcat in availableSubcategories" :key="subcat.value" :value="subcat.value">
            {{ subcat.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Language</label>
        <select
          v-model="streamSettings.language"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          @change="emitUpdate"
        >
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Tags
        <span class="text-xs text-gray-500">({{ streamSettings.tags.length }}/10)</span>
      </label>
      <div class="flex gap-2 mb-2">
        <input
          v-model="newTag"
          type="text"
          @keydown="handleTagKeydown"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Add a tag and press Enter"
          :disabled="streamSettings.tags.length >= 10"
        />
        <button
          @click="addTag"
          :disabled="!newTag.trim() || streamSettings.tags.length >= 10"
          class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>
      <div v-if="streamSettings.tags.length > 0" class="flex flex-wrap gap-2">
        <span
          v-for="(tag, index) in streamSettings.tags"
          :key="index"
          class="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
        >
          {{ tag }}
          <button
            @click="removeTag(index)"
            class="ml-2 text-purple-600 hover:text-purple-800 focus:outline-none"
            type="button"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      </div>
      <p v-else class="text-xs text-gray-500 mt-1">No tags added yet</p>
    </div>
  </div>
</template>
