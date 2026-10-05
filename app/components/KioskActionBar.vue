<template>
  <div class="kiosk-action-bar">
    <!-- Video Mute/Unmute Toggle -->
    <button
      v-if="isVideo"
      type="button"
      class="kiosk-btn control-btn"
      :title="isMuted ? 'Unmute' : 'Mute'"
      @click="$emit('toggle-mute')"
    >
      <img
        :src="isMuted ? '/images/mute.svg' : '/images/unmute.svg'"
        alt="Audio"
        class="action-icon"
      >
    </button>

    <!-- EXIF Info Toggle -->
    <button
      v-if="showExifButton"
      type="button"
      class="kiosk-btn control-btn"
      title="View EXIF photo info"
      @click="$emit('toggle-exif')"
    >
      i
    </button>

    <!-- Fullscreen Toggle -->
    <button
      type="button"
      class="kiosk-btn control-btn"
      title="Toggle Fullscreen"
      @click="toggleFullscreen"
    >
      {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
    </button>

    <!-- Next Image -->
    <button
      v-if="showNavButtons && canSkipImage !== false"
      type="button"
      class="kiosk-btn control-btn"
      title="Skip to next image"
      :disabled="isNavDisabled"
      @click="$emit('next-image')"
    >
      Image
    </button>

    <!-- Next Folder (Local source only) -->
    <button
      v-if="showNavButtons && isLocalSource"
      type="button"
      class="kiosk-btn control-btn"
      title="Skip to next folder"
      :disabled="isNavDisabled"
      @click="$emit('next-folder')"
    >
      Folder
    </button>
  </div>
</template>

<script setup lang="ts">
import { useKioskState } from '~/composables/useKioskState'

defineProps<{
  isVideo: boolean
  isMuted: boolean
  showExifButton: boolean
  showNavButtons: boolean
  isLocalSource: boolean
  isNavDisabled: boolean
  canSkipImage?: boolean
}>()

defineEmits<{
  'toggle-mute': []
  'toggle-exif': []
  'next-image': []
  'next-folder': []
}>()

const { isFullscreen, toggleFullscreen } = useKioskState()
</script>

<style scoped>
.kiosk-action-bar {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 30;
}

.control-btn {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.action-icon {
  width: 1rem;
  height: 1rem;
  object-fit: contain;
}

@media (max-width: 576px) {
  .kiosk-action-bar {
    bottom: 0.75rem;
    right: 0.75rem;
    gap: 0.35rem;
  }
  .control-btn {
    padding: 0.3rem 0.5rem;
    font-size: 0.7rem;
  }
}
</style>
