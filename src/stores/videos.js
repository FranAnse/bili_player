import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useVideosStore = defineStore('videos', () => {
  const videosPlayStatus = ref('')

  return { videosPlayStatus }
})
