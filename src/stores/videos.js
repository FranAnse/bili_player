import { ref } from 'vue'
import { defineStore } from 'pinia'

const Store = require('electron-store')

const storage = new Store()

function parseStoredList(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsedValue = JSON.parse(value)
      return Array.isArray(parsedValue) ? parsedValue : []
    } catch (error) {
      return []
    }
  }

  return []
}

function normalizeSong(song) {
  if (!song || typeof song !== 'object') {
    return null
  }

  const name = `${song.name ?? ''}`.trim()
  const url = `${song.url ?? ''}`.trim()

  if (!name || !url) {
    return null
  }

  return { name, url }
}

function shuffleSongs(list) {
  const queue = list.slice()

  for (let index = queue.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[queue[index], queue[randomIndex]] = [queue[randomIndex], queue[index]]
  }

  return queue
}

export const useVideosStore = defineStore('videos', () => {
  const videosPlayStatus = ref('')
  const playlist = ref([])
  const playQueue = ref([])
  const currentQueueIndex = ref(-1)
  const currentSong = ref(null)
  const isPlaylistLoaded = ref(false)

  function savePlaylist() {
    storage.set('favList', JSON.stringify(playlist.value))
  }

  function resetQueue() {
    playQueue.value = []
    currentQueueIndex.value = -1
    currentSong.value = null
  }

  function syncCurrentSongFromQueue() {
    if (!playQueue.value.length) {
      currentQueueIndex.value = -1
      currentSong.value = null
      return null
    }

    if (currentQueueIndex.value < 0) {
      currentQueueIndex.value = 0
    }

    if (currentQueueIndex.value >= playQueue.value.length) {
      currentQueueIndex.value = playQueue.value.length - 1
    }

    currentSong.value = playQueue.value[currentQueueIndex.value] ?? null
    return currentSong.value
  }

  function loadPlaylist() {
    const nextPlaylist = parseStoredList(storage.get('favList'))
      .map((song) => normalizeSong(song))
      .filter(Boolean)

    playlist.value = nextPlaylist
    isPlaylistLoaded.value = true

    if (!playlist.value.length) {
      resetQueue()
      return playlist.value
    }

    if (currentSong.value?.url && !playlist.value.some((song) => song.url === currentSong.value.url)) {
      resetQueue()
    }

    return playlist.value
  }

  function ensurePlaylistLoaded() {
    if (!isPlaylistLoaded.value) {
      loadPlaylist()
    }

    return playlist.value
  }

  function createPlayQueue(options = {}) {
    ensurePlaylistLoaded()

    if (!playlist.value.length) {
      resetQueue()
      return null
    }

    const prioritizedSong = normalizeSong(options.prioritizedSong)
    const shouldPrioritize = prioritizedSong
      && playlist.value.some((song) => song.url === prioritizedSong.url)
    let nextQueue = shuffleSongs(playlist.value)

    if (shouldPrioritize) {
      nextQueue = [prioritizedSong, ...nextQueue.filter((song) => song.url !== prioritizedSong.url)]
    }

    playQueue.value = nextQueue
    currentQueueIndex.value = nextQueue.length ? 0 : -1

    return syncCurrentSongFromQueue()
  }

  function ensureQueue() {
    ensurePlaylistLoaded()

    if (!playQueue.value.length) {
      return createPlayQueue()
    }

    return syncCurrentSongFromQueue()
  }

  function moveToNextSong() {
    ensurePlaylistLoaded()

    if (!playlist.value.length) {
      resetQueue()
      return null
    }

    if (!playQueue.value.length) {
      return createPlayQueue()
    }

    if (currentQueueIndex.value < playQueue.value.length - 1) {
      currentQueueIndex.value += 1
      return syncCurrentSongFromQueue()
    }

    return createPlayQueue()
  }

  function moveToPreviousSong() {
    ensurePlaylistLoaded()

    if (!playQueue.value.length) {
      return createPlayQueue()
    }

    if (currentQueueIndex.value <= 0) {
      return null
    }

    currentQueueIndex.value -= 1
    return syncCurrentSongFromQueue()
  }

  function startQueueFromIndex(queueIndex) {
    ensurePlaylistLoaded()

    if (!playQueue.value.length) {
      return { ok: false, reason: 'empty' }
    }

    if (!Number.isInteger(queueIndex) || queueIndex < 0 || queueIndex >= playQueue.value.length) {
      return { ok: false, reason: 'invalid_index' }
    }

    if (queueIndex === currentQueueIndex.value) {
      return { ok: false, reason: 'same_song' }
    }

    const currentIndex = currentQueueIndex.value
    const currentQueue = playQueue.value.slice()
    const currentTrack = currentQueue[currentIndex]
    const historyBeforeSelection = currentQueue.slice(0, Math.min(queueIndex, currentIndex))
    const queueAfterCurrent = currentQueue.slice(currentIndex + 1)
    let nextSongs = []

    if (queueIndex > currentIndex) {
      nextSongs = currentQueue
        .slice(queueIndex)
        .concat(currentQueue.slice(currentIndex + 1, queueIndex))
    } else {
      nextSongs = currentQueue
        .slice(queueIndex, currentIndex)
        .concat(queueAfterCurrent)
        .concat(currentQueue.slice(0, queueIndex))
    }

    playQueue.value = [...historyBeforeSelection, currentTrack, ...nextSongs]
    currentQueueIndex.value = historyBeforeSelection.length
    syncCurrentSongFromQueue()

    return { ok: true }
  }

  function setPlaylist(list) {
    playlist.value = (Array.isArray(list) ? list : [])
      .map((song) => normalizeSong(song))
      .filter(Boolean)

    isPlaylistLoaded.value = true
    savePlaylist()

    if (!playlist.value.length) {
      resetQueue()
      return []
    }

    if (currentSong.value && playlist.value.some((song) => song.url === currentSong.value.url)) {
      createPlayQueue({ prioritizedSong: currentSong.value })
    } else {
      resetQueue()
    }

    return playlist.value
  }

  function addSong(song) {
    ensurePlaylistLoaded()

    const normalizedSong = normalizeSong(song)

    if (!normalizedSong) {
      return { ok: false, reason: 'invalid' }
    }

    if (playlist.value.some((item) => item.url === normalizedSong.url)) {
      return { ok: false, reason: 'duplicate' }
    }

    playlist.value = [...playlist.value, normalizedSong]
    savePlaylist()

    if (playQueue.value.length) {
      playQueue.value = [...playQueue.value, normalizedSong]
    }

    return { ok: true, song: normalizedSong }
  }

  function renameSong(url, nextName) {
    ensurePlaylistLoaded()

    const trimmedName = `${nextName ?? ''}`.trim()

    if (!url || !trimmedName) {
      return { ok: false, reason: 'invalid' }
    }

    let isUpdated = false

    playlist.value = playlist.value.map((song) => {
      if (song.url !== url) {
        return song
      }

      isUpdated = true
      return { ...song, name: trimmedName }
    })

    if (!isUpdated) {
      return { ok: false, reason: 'not_found' }
    }

    playQueue.value = playQueue.value.map((song) => {
      if (song.url !== url) {
        return song
      }

      return { ...song, name: trimmedName }
    })

    savePlaylist()
    syncCurrentSongFromQueue()

    return { ok: true }
  }

  function removeSong(url) {
    ensurePlaylistLoaded()

    if (!url) {
      return { ok: false, reason: 'invalid' }
    }

    const hasSong = playlist.value.some((song) => song.url === url)

    if (!hasSong) {
      return { ok: false, reason: 'not_found' }
    }

    const currentUrl = currentSong.value?.url ?? ''
    const previousQueueIndex = currentQueueIndex.value
    const removedQueueIndex = playQueue.value.findIndex((song) => song.url === url)
    const removedCurrent = currentUrl === url

    playlist.value = playlist.value.filter((song) => song.url !== url)
    savePlaylist()

    if (!playlist.value.length) {
      resetQueue()
      return { ok: true, removedCurrent }
    }

    if (playQueue.value.length) {
      playQueue.value = playQueue.value.filter((song) => song.url !== url)

      if (!playQueue.value.length) {
        resetQueue()
        return { ok: true, removedCurrent }
      }

      if (removedCurrent) {
        currentQueueIndex.value = Math.min(previousQueueIndex, playQueue.value.length - 1)
      } else if (removedQueueIndex > -1 && removedQueueIndex < previousQueueIndex) {
        currentQueueIndex.value = previousQueueIndex - 1
      } else if (currentQueueIndex.value >= playQueue.value.length) {
        currentQueueIndex.value = playQueue.value.length - 1
      }

      syncCurrentSongFromQueue()
    }

    return { ok: true, removedCurrent }
  }

  function insertSongAsNext(song) {
    ensurePlaylistLoaded()

    const normalizedSong = normalizeSong(song)

    if (!normalizedSong) {
      return { ok: false, reason: 'invalid' }
    }

    if (!playQueue.value.length) {
      const nextQueue = playlist.value.length
        ? [normalizedSong, ...shuffleSongs(playlist.value).filter((item) => item.url !== normalizedSong.url)]
        : [normalizedSong]

      playQueue.value = nextQueue
      currentQueueIndex.value = -1
      currentSong.value = null

      return { ok: true, position: 0 }
    }

    const nextQueue = []

    playQueue.value.forEach((item, index) => {
      const isCurrentItem = index === currentQueueIndex.value

      if (!isCurrentItem && item.url === normalizedSong.url) {
        return
      }

      nextQueue.push(item)
    })

    const insertAt = currentQueueIndex.value >= 0 ? currentQueueIndex.value + 1 : 0
    nextQueue.splice(insertAt, 0, normalizedSong)

    playQueue.value = nextQueue

    if (currentQueueIndex.value >= playQueue.value.length) {
      currentQueueIndex.value = playQueue.value.length - 1
    }

    syncCurrentSongFromQueue()

    return { ok: true, position: insertAt }
  }

  return {
    videosPlayStatus,
    playlist,
    playQueue,
    currentQueueIndex,
    currentSong,
    loadPlaylist,
    ensureQueue,
    createPlayQueue,
    moveToNextSong,
    moveToPreviousSong,
    startQueueFromIndex,
    setPlaylist,
    addSong,
    renameSong,
    removeSong,
    insertSongAsNext,
  }
})
