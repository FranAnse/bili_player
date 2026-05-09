<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';


import favoritePage from '../components/favoritePage.vue'
import homePage from '../components/homePage.vue'
import miniPlayerPanel from '../components/miniPlayerPanel.vue'
import playerPage from '../components/playerPage.vue';
import VideosManagement from '../components/videosManagement.vue';

const player = ref(null)

const currentPage = ref('home')

const playList = ref()

const oncePlay = ref(false)

const isMenuExpand = ref(true)

const currentTitle = ref('')
const isMiniPlayerMode = ref(false)
const isAppClosing = ref(false)
const playerPageKey = ref(0)
const visiblePlayerStyle = {
  position: 'relative',
  zIndex: 1,
}
const hiddenPlayerStyle = {
  position: 'fixed',
  left: '-10000px',
  top: '-10000px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  zIndex: -1,
}
const shouldMountPlayer = computed(() => currentPage.value === 'player' || oncePlay.value)
const playerDisplayStyle = computed(() => {
  if (!isMiniPlayerMode.value && currentPage.value === 'player') {
    return visiblePlayerStyle
  }

  return hiddenPlayerStyle
})

let ipcRenderer = require('electron').ipcRenderer

function closeWindow() {
  ipcRenderer.send('window-close')
}

function songChanged(song) {
  currentTitle.value = song
}

function miniSize(params) {
  ipcRenderer.send('window-minisize')
}

function markPlayerMounted() {
  if (oncePlay.value) {
    return
  }

  oncePlay.value = true
  playerPageKey.value += 1
}

function openPlayerPage() {
  currentPage.value = 'player'
  isMenuExpand.value = false
  markPlayerMounted()
}

async function ensurePlayerReady() {
  markPlayerMounted()

  await nextTick()
  if (!player.value) {
    await nextTick()
  }
  return player.value
}

async function changePlayStatus(status) {
  if (status && !oncePlay.value) {
    markPlayerMounted()
    return
  }

  const playerInstance = await ensurePlayerReady()

  if (playerInstance) {
    playerInstance.switchPlayStatus()
  }
}

async function playPreviousSong() {
  const playerInstance = await ensurePlayerReady()

  if (!playerInstance) {
    return
  }

  playerInstance.playPreviousSong()
}

async function playNextSong() {
  const playerInstance = await ensurePlayerReady()

  if (!playerInstance) {
    return
  }

  playerInstance.playNextSong()
}

function toggleMiniPlayerMode() {
  const nextMode = !isMiniPlayerMode.value

  isMiniPlayerMode.value = nextMode
  ipcRenderer.send('window-set-mini-playlist-open', false)
  ipcRenderer.send('window-toggle-mini-player', nextMode)
}

function handleMiniPlaylistVisibilityChange(isOpen) {
  ipcRenderer.send('window-set-mini-playlist-open', isOpen)
}

async function handleBeforeCloseRequest() {
  if (isAppClosing.value) {
    return
  }

  isAppClosing.value = true

  try {
    const playerInstance = player.value

    if (playerInstance?.prepareBeforeClose) {
      await playerInstance.prepareBeforeClose()
    }
  } finally {
    ipcRenderer.send('window-close-confirmed')
  }
}

onMounted(() => {
  ipcRenderer.on('app-before-close-request', handleBeforeCloseRequest)
})

onBeforeUnmount(() => {
  ipcRenderer.removeListener('app-before-close-request', handleBeforeCloseRequest)
})
</script>

<template>
  <div class="mainContainer" :class="{ miniMode: isMiniPlayerMode }">
    <div v-if="!isMiniPlayerMode" class="headLine" :class="[currentPage === 'home' ? '' : 'headInPage']">
      <div class="windowControls">
        <el-icon class="iconBtn" @mousedown.stop @click.stop="closeWindow">
          <CloseBold />
        </el-icon>
        <el-icon class="iconBtn" @mousedown.stop @click.stop="miniSize">
          <Minus />
        </el-icon>
        <el-icon class="iconBtn" @mousedown.stop @click.stop="toggleMiniPlayerMode">
          <ScaleToOriginal />
        </el-icon>
      </div>
    </div>
    <div class="contentContainer">

      <el-menu v-if="!isMiniPlayerMode" :collapse="!isMenuExpand" active-text-color="#66CCFF" collapse-transition class="menu"
        :class="currentPage === 'home' ? 'glassEffect' : ''" default-active="0">
        <el-menu-item index="0" @click="currentPage = 'home'; isMenuExpand = true">
          <el-icon>
            <House />
          </el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="1" @click="openPlayerPage">
          <el-icon>
            <Headset />
          </el-icon>
          <template #title>播放器</template>
        </el-menu-item>
        <el-menu-item index="2" @click="currentPage = 'favorite'; isMenuExpand = false">
          <el-icon>
            <StarFilled />
          </el-icon>
          <template #title>收藏夹</template>
        </el-menu-item>
        <el-menu-item index="3" @click="currentPage = 'playList'; isMenuExpand = false">
          <el-icon>
            <SwitchFilled />
          </el-icon>
          <template #title>歌单管理</template>
        </el-menu-item>
        <el-icon @click="isMenuExpand = !isMenuExpand" class="collapseBtn">
          <Expand v-if="!isMenuExpand" />
          <Fold v-if="isMenuExpand" />
        </el-icon>
      </el-menu>
      <div class="pageContainer">
        <template v-if="!isMiniPlayerMode">
          <homePage
            @change-play-status="changePlayStatus"
            @play-previous-song="playPreviousSong"
            @play-next-song="playNextSong"
            :current-play-name="currentTitle"
            style="position: relative;z-index: 10;" v-if="currentPage === 'home'"></homePage>
          <favoritePage style="position: relative;z-index: 10;" v-if="currentPage === 'favorite'"></favoritePage>
          <VideosManagement v-if="currentPage === 'playList'"></VideosManagement>
        </template>
        <miniPlayerPanel
          v-if="isMiniPlayerMode"
          :current-play-name="currentTitle"
          @change-play-status="changePlayStatus"
          @mini-playlist-visibility-change="handleMiniPlaylistVisibilityChange"
          @play-previous-song="playPreviousSong"
          @play-next-song="playNextSong"
          @toggle-mini-mode="toggleMiniPlayerMode"
        ></miniPlayerPanel>
        <playerPage
          ref="player"
          :key="playerPageKey"
          @song-change="songChanged"
          :style="playerDisplayStyle"
          v-if="shouldMountPlayer"></playerPage>

      </div>
    </div>
  </div>
</template>

<style scoped>
.headLine {
  position: fixed;
  top: 0;
  height: 45px;
  width: 100%;

  -webkit-app-region: drag;

  display: flex;
  flex-direction: row-reverse;

  z-index: 1000;
  pointer-events: auto;
}

.headInPage {
  border-bottom: 1px solid rgb(220, 223, 230);
}

.iconBtn {
  width: 45px;
  height: 45px;
  margin: 0;
  cursor: pointer;
  position: relative;
  z-index: 1001;
  -webkit-app-region: no-drag;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6d6f73;
}

.iconBtn:hover {
  color: #303133;
}

.windowControls {
  display: flex;
  flex-direction: row-reverse;
  -webkit-app-region: no-drag;
}

.iconBtn :deep(svg) {
  pointer-events: none;
}

.mainContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
}

.contentContainer {
  width: 100%;
  height: 100%;
  display: flex;
}

.miniMode .contentContainer {
  display: block;
}

.glassEffect {
  backdrop-filter: blur(10px);
  background-color: #66ccff11;
}

.menu {
  position: fixed;
  height: 100%;
  z-index: 100;

  -webkit-app-region: no-drag;
}

.menu:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}

.menu.el-menu--collapse {
  width: 65px
}

.collapseBtn {
  position: absolute;
  bottom: 30px;
  left: 25px;
  cursor: pointer;
}

.pageContainer {
  width: 100%;
  height: 100%;
  position: relative;
}

.miniMode .pageContainer {
  height: 100%;
}

.miniMode .iconBtn {
  color: #4e6275;
}
</style>
