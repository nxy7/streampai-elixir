<template>
  <div class="slider-widget" :style="containerStyle">
    <div v-if="slides.length === 0" class="no-slides-message" style="color: white; text-align: center; padding: 20px;">
      <p>No images available for slider</p>
      <p style="font-size: 0.8em; opacity: 0.7;">Upload images or wait for demo images to load</p>
    </div>
    <div v-else class="slide-container" :style="slideContainerStyle">
      <transition
        :name="transitionType"
        :duration="{ enter: transitionDuration, leave: transitionDuration }"
        mode="out-in"
      >
        <div v-if="currentSlide" :key="currentSlide.id" class="slide" :style="slideStyle">
          <img
            :src="currentSlide.url"
            :alt="currentSlide.alt || `Slide ${currentSlide.index + 1}`"
            class="slide-image"
            :style="imageStyle"
            @load="handleImageLoad"
            @error="handleImageError"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface SliderImage {
  id: string
  url: string
  alt?: string
  index: number
}

interface SliderConfig {
  slide_duration: number
  transition_duration: number
  transition_type: string
  fit_mode: string
  background_color: string
  images?: SliderImage[]
}

interface SliderEvent {
  id: string
  type: string
  images?: SliderImage[]
  timestamp: Date
}

const props = defineProps<{
  config: SliderConfig
  event?: SliderEvent
}>()

const currentSlideIndex = ref(0)
const isTransitioning = ref(false)
const intervalId = ref<ReturnType<typeof setInterval> | null>(null)

const slides = computed(() => {
  const eventImages = props.event?.images
  const configImages = props.config.images
  const result = eventImages || configImages || []

  // Debug logging
  console.log('[SliderWidget] Computing slides:', {
    eventImages,
    configImages,
    resultCount: result.length,
    result
  })

  return result
})

const currentSlide = computed(() => {
  if (slides.value.length === 0) return null
  return slides.value[currentSlideIndex.value % slides.value.length]
})

const slideDuration = computed(() => {
  return Math.max(1000, (props.config.slide_duration || 5) * 1000)
})

const transitionDuration = computed(() => {
  return Math.max(200, Math.min(2000, (props.config.transition_duration || 500)))
})

const transitionType = computed(() => {
  return props.config.transition_type || 'fade'
})

const containerStyle = computed(() => ({
  backgroundColor: props.config.background_color || 'transparent',
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden'
}))

const slideContainerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  position: 'relative'
}))

const slideStyle = computed(() => ({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const imageStyle = computed(() => {
  const fitMode = props.config.fit_mode || 'contain'

  switch (fitMode) {
    case 'cover':
      return {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const
      }
    case 'fill':
      return {
        width: '100%',
        height: '100%',
        objectFit: 'fill' as const
      }
    case 'contain':
    default:
      return {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain' as const
      }
  }
})

const nextSlide = () => {
  if (slides.value.length <= 1) return

  isTransitioning.value = true
  currentSlideIndex.value = (currentSlideIndex.value + 1) % slides.value.length

  setTimeout(() => {
    isTransitioning.value = false
  }, transitionDuration.value)
}

const startSlideshow = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }

  if (slides.value.length > 1) {
    intervalId.value = setInterval(nextSlide, slideDuration.value)
  }
}

const stopSlideshow = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
}

const handleImageLoad = () => {
  // Image loaded successfully
}

const handleImageError = () => {
  console.warn('Failed to load slide image:', currentSlide.value?.url)
}

// Watch for config changes to restart slideshow
watch([() => props.config.slide_duration, () => slides.value], () => {
  startSlideshow()
}, { deep: true })

// Watch for event changes (new images uploaded)
watch(() => props.event, (newEvent) => {
  if (newEvent?.images && newEvent.images.length > 0) {
    currentSlideIndex.value = 0
    startSlideshow()
  }
}, { deep: true })

onMounted(() => {
  console.log('[SliderWidget] Mounted with:', {
    config: props.config,
    event: props.event,
    slidesCount: slides.value.length,
    slides: slides.value
  })

  if (slides.value.length > 0) {
    startSlideshow()
  }
})

onUnmounted(() => {
  stopSlideshow()
})
</script>

<style scoped>
.slider-widget {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.slide-container {
  position: relative;
}

.slide-image {
  border-radius: 4px;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-duration, 500ms) ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform var(--transition-duration, 500ms) ease-in-out;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

/* Slide up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform var(--transition-duration, 500ms) ease-in-out;
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(-100%);
}

/* Zoom transition */
.zoom-enter-active,
.zoom-leave-active {
  transition: all var(--transition-duration, 500ms) ease-in-out;
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Flip transition */
.flip-enter-active,
.flip-leave-active {
  transition: transform var(--transition-duration, 500ms) ease-in-out;
}

.flip-enter-from {
  transform: rotateY(90deg);
}

.flip-leave-to {
  transform: rotateY(-90deg);
}
</style>