<script setup>
import { Delete } from '@element-plus/icons-vue'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

import { useVideosStore } from '../stores/videos'

const videosStore = useVideosStore()
const { playQueue, currentQueueIndex, currentSong } = storeToRefs(videosStore)

const emit = defineEmits(['songChange'])

defineExpose({
  switchPlayStatus,
  playPreviousSong,
  playNextSong,
})

const webViewRef = ref(null)
const currentUrl = ref('')

let intervalId = null
let isAdvancing = false
let isManualSwitching = false

function syncCurrentSong(song) {
  currentUrl.value = song?.url ?? ''
  emit('songChange', song?.name ?? '')
}

function switchPlayStatus() {
  if (!webViewRef.value) {
    return
  }

  webViewRef.value.executeJavaScript(`
    (() => {
      const playButton = document.querySelector('.bpx-player-ctrl-btn')

      if (!playButton) {
        return false
      }

      playButton.click()
      return true
    })()
  `).catch(() => {})
}

function rebuildPlayQueue() {
  const nextSong = videosStore.createPlayQueue({ prioritizedSong: currentSong.value })
  syncCurrentSong(nextSong)
}

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration)
  })
}

async function resetCurrentVideoBeforeSwitch() {
  if (!webViewRef.value || !currentSong.value) {
    return { ok: false, reason: 'no_webview' }
  }

  try {
    return await webViewRef.value.executeJavaScript(`
      (() => {
        function pickMainVideo(root = document) {
          const videos = Array.from(root.querySelectorAll('video'))

          if (!videos.length) {
            return null
          }

          return videos
            .filter((video) => video.readyState >= 1)
            .sort((left, right) => {
              const leftArea = left.clientWidth * left.clientHeight
              const rightArea = right.clientWidth * right.clientHeight
              return rightArea - leftArea
            })[0] ?? videos[0]
        }

        function triggerProgressReset(progressElement) {
          const rect = progressElement.getBoundingClientRect()

          if (!rect.width || !rect.height) {
            return false
          }

          const clientX = rect.left + Math.min(4, Math.max(1, rect.width * 0.01))
          const clientY = rect.top + (rect.height / 2)
          const mouseEventOptions = {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            clientX,
            clientY,
            buttons: 1,
          }

          if (typeof PointerEvent === 'function') {
            progressElement.dispatchEvent(new PointerEvent('pointerdown', { ...mouseEventOptions, pointerId: 1, pointerType: 'mouse', isPrimary: true }))
            progressElement.dispatchEvent(new PointerEvent('pointermove', { ...mouseEventOptions, pointerId: 1, pointerType: 'mouse', isPrimary: true }))
            progressElement.dispatchEvent(new PointerEvent('pointerup', { ...mouseEventOptions, pointerId: 1, pointerType: 'mouse', isPrimary: true }))
          }

          progressElement.dispatchEvent(new MouseEvent('mousedown', mouseEventOptions))
          progressElement.dispatchEvent(new MouseEvent('mousemove', mouseEventOptions))
          progressElement.dispatchEvent(new MouseEvent('mouseup', mouseEventOptions))
          progressElement.dispatchEvent(new MouseEvent('click', mouseEventOptions))

          return true
        }

        const video = pickMainVideo()
        const progressElement = document.querySelector('.bui-progress-wrap')
          || document.querySelector('.bpx-player-progress-wrap')
          || document.querySelector('.bpx-player-progress')

        if (!video) {
          return { ok: false, reason: 'video_not_found' }
        }

        const progressResetTriggered = progressElement ? triggerProgressReset(progressElement) : false

        video.currentTime = 0
        video.dispatchEvent(new Event('seeking', { bubbles: true }))
        video.dispatchEvent(new Event('timeupdate', { bubbles: true }))
        video.dispatchEvent(new Event('seeked', { bubbles: true }))

        return {
          ok: true,
          progressResetTriggered,
          currentTime: video.currentTime,
        }
      })()
    `)
  } catch (error) {
    return { ok: false, reason: 'execute_failed' }
  }
}

async function switchSongWithReset(moveHandler) {
  if (isManualSwitching || isAdvancing) {
    return
  }

  isManualSwitching = true

  const resetResult = await resetCurrentVideoBeforeSwitch()

  if (!resetResult.ok) {
    isManualSwitching = false
    ElMessage.warning('当前页面还没有找到可控制的视频，暂时不能切歌')
    return
  }

  await wait(500)

  const nextSong = moveHandler()

  if (!nextSong) {
    isManualSwitching = false
    ElMessage.warning('没有可切换的歌曲了')
    return
  }

  syncCurrentSong(nextSong)
}

function canScheduleFromQueue(index) {
  return index > currentQueueIndex.value
}

function handleQueueItemClick(index) {
  if (!canScheduleFromQueue(index)) {
    return
  }

  const result = videosStore.startQueueFromIndex(index)

  if (result.ok) {
    ElMessage.success('下一首播放顺序已调整')
  }
}

function handleRemoveFromQueue(songUrl) {
  const result = videosStore.removeSong(songUrl)

  if (result.ok) {
    syncCurrentSong(videosStore.currentSong)
    ElMessage.success('已从播放列表移除')
  }
}

function stopPolling() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function advanceToNextSong() {
  if (isAdvancing) {
    return
  }

  isAdvancing = true

  const nextSong = videosStore.moveToNextSong()
  syncCurrentSong(nextSong)

  if (!nextSong) {
    isAdvancing = false
  }
}

function playPreviousSong() {
  if (currentQueueIndex.value <= 0) {
    ElMessage.warning('已经是第一首了')
    return
  }

  return switchSongWithReset(() => videosStore.moveToPreviousSong())
}

function playNextSong() {
  if (!playQueue.value.length) {
    ElMessage.warning('当前没有可播放的歌单')
    return
  }

  return switchSongWithReset(() => videosStore.moveToNextSong())
}

function handleDidStopLoading() {
  isManualSwitching = false
  isAdvancing = false
  stopPolling()

  intervalId = window.setInterval(async () => {
    if (!webViewRef.value) {
      return
    }

    try {
      const playState = await webViewRef.value.executeJavaScript(`
        (() => {
          const endWrap = document.querySelector('.bpx-player-ending-wrap')
          const playWrap = document.querySelector('.bpx-player-row-dm-wrap')

          return {
            ended: Boolean(endWrap && endWrap.getAttribute('data-select') !== '0'),
            paused: !playWrap || playWrap.className.includes('bili-paused'),
          }
        })()
      `)

      videosStore.videosPlayStatus = playState.paused ? '0' : '1'

      if (playState.ended) {
        advanceToNextSong()
      }
    } catch (error) {
      videosStore.videosPlayStatus = '0'
    }
  }, 1000)
}

function bindWebViewEvents() {
  const webView = webViewRef.value

  if (!webView) {
    return
  }

  webView.removeEventListener('did-stop-loading', handleDidStopLoading)
  webView.addEventListener('did-stop-loading', handleDidStopLoading)
}

watch(currentSong, async (song) => {
  syncCurrentSong(song)
  await nextTick()
  bindWebViewEvents()
}, { immediate: true })

onMounted(() => {
  const firstSong = videosStore.ensureQueue()
  syncCurrentSong(firstSong)
})

onBeforeUnmount(() => {
  stopPolling()

  if (webViewRef.value) {
    webViewRef.value.removeEventListener('did-stop-loading', handleDidStopLoading)
  }
})
</script>

<template>
  <div class="playerPageContainer">
    <div class="playerLayout">
      <div class="playerSurface">
        <webview
          v-if="currentSong"
          ref="webViewRef"
          class="webPageContainer"
          :src="currentUrl"
        ></webview>
        <div v-else class="emptySurface">
          <el-empty description="暂无可播放视频"></el-empty>
        </div>
      </div>

      <div class="queuePanel">
        <div class="queueHeader">
          <div>
            <div class="queueTitle">播放列表</div>
            <div class="queueCount">{{ playQueue.length }} 首</div>
          </div>
          <el-button text type="primary" @click="rebuildPlayQueue" :disabled="!playQueue.length">
            重新生成
          </el-button>
        </div>

        <div v-if="currentSong" class="currentSongCard">
          <div class="currentSongLabel">当前播放</div>
          <div class="currentSongName">{{ currentSong.name }}</div>
        </div>

        <el-empty v-if="!playQueue.length" description="歌单里还没有可播放内容"></el-empty>

        <el-scrollbar v-else class="queueList">
          <div
            v-for="(song, index) in playQueue"
            :key="`${song.url}-${index}`"
            class="queueItem"
            :class="{
              active: index === currentQueueIndex,
              clickable: canScheduleFromQueue(index),
            }"
            @click="handleQueueItemClick(index)"
          >
            <div class="queueOrder">{{ index + 1 }}</div>
            <div class="queueInfo">
              <div class="queueName">{{ song.name }}</div>
              <div class="queueUrl">{{ song.url }}</div>
            </div>
            <div class="queueActions">
              <el-tag v-if="index === currentQueueIndex" size="small">当前</el-tag>
              <el-tag v-else-if="index === currentQueueIndex + 1" type="success" size="small">下一首</el-tag>
              <el-tooltip content="移除" placement="top">
                <el-icon class="queueActionIcon" @click.stop="handleRemoveFromQueue(song.url)">
                  <Delete />
                </el-icon>
              </el-tooltip>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playerPageContainer {
  height: calc(100% - 45px);
  width: calc(100% - 65px);
  position: relative;
  top: 45px;
  left: 65px;
  overflow: hidden;
}

.playerLayout {
  width: 100%;
  height: 100%;
  display: flex;
  background-color: #ffffff;
}

.playerSurface {
  flex: 1;
  min-width: 0;
  border-right: 1px solid rgb(220, 223, 230);
}

.webPageContainer,
.emptySurface {
  width: 100%;
  height: 100%;
}

.emptySurface {
  display: flex;
  align-items: center;
  justify-content: center;
}

.queuePanel {
  width: 360px;
  min-width: 360px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

.queueHeader {
  height: 72px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgb(220, 223, 230);
}

.queueTitle {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.queueCount {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.currentSongCard {
  margin: 16px;
  padding: 12px;
  border-radius: 8px;
  background-color: #ecf5ff;
}

.currentSongLabel {
  font-size: 12px;
  color: #409eff;
}

.currentSongName {
  margin-top: 8px;
  font-size: 14px;
  color: #303133;
  word-break: break-word;
}

.queueList {
  flex: 1;
  padding: 0 16px 16px;
}

.queueItem {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 8px;
  background-color: #ffffff;
}

.queueItem.active {
  background-color: #ecf5ff;
}

.queueItem.clickable {
  cursor: pointer;
}

.queueItem.clickable:hover {
  background-color: #f5f7fa;
}

.queueOrder {
  width: 24px;
  flex: 0 0 24px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  line-height: 20px;
}

.queueInfo {
  flex: 1;
  min-width: 0;
}

.queueName {
  font-size: 14px;
  color: #303133;
  word-break: break-word;
}

.queueUrl {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  word-break: break-all;
}

.queueActions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.queueActionIcon {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}

.queueActionIcon:hover {
  color: #f56c6c;
}
</style>
