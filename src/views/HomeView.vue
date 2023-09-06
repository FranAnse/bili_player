<script setup>
import { ref } from 'vue';


import favoritePage from '../components/favoritePage.vue'
import homePage from '../components/homePage.vue'
import playerPage from '../components/playerPage.vue';

const player = ref(null)

const currentPage = ref('home')

const playList = ref()

const oncePlay = ref(false)

const isMenuExpand = ref(true)

const currentTitle = ref('')

let ipcRenderer = require('electron').ipcRenderer

function closeWindow(){
  ipcRenderer.send('window-close')
}

function songChanged(song){
  currentTitle.value = song
}

function miniSize(params) {
  ipcRenderer.send('window-minisize')
}

function changePlayStatus(status){
  if(status){
    if(!oncePlay.value){
      oncePlay.value = true
    }else{
      player.value.switchPlayStatus()
    }
  }else{
    player.value.switchPlayStatus()
  }
}
</script>

<template>
  <div class="mainContainer">
    <div class="headLine" :class="currentPage === 'home'?'':'headInPage'">
      <el-icon class="iconBtn" @click="closeWindow"><CloseBold /></el-icon>
      <el-icon class="iconBtn" @click="miniSize"><Minus /></el-icon>
    </div>
    <div class="contentContainer">

      <el-menu :collapse="!isMenuExpand" active-text-color="#66CCFF" collapse-transition class="menu" :class="currentPage === 'home'?'glassEffect':''" default-active="0">
        <el-menu-item index="0" @click="currentPage ='home';isMenuExpand = true">
          <el-icon><House/></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="1" @click="currentPage ='player';isMenuExpand = false;oncePlay=true">
          <el-icon><Headset/></el-icon>
          <template #title>播放器</template>
        </el-menu-item>
        <el-menu-item index="2" @click="currentPage ='favorite';isMenuExpand = false">
          <el-icon><StarFilled/></el-icon>
          <template #title>收藏夹</template>
        </el-menu-item>
        <el-icon @click="isMenuExpand = !isMenuExpand" class="collapseBtn">
          <Expand v-if="!isMenuExpand"/>
          <Fold v-if="isMenuExpand"/>
        </el-icon>
      </el-menu>
      <div class="pageContainer">
        <homePage @change-play-status="changePlayStatus" :current-play-name="currentTitle" style="position: relative;z-index: 10;" v-if="currentPage === 'home'"></homePage>
        <favoritePage style="position: relative;z-index: 10;" v-if="currentPage === 'favorite'"></favoritePage>
        <playerPage ref="player" @song-change="songChanged" style="position: relative;z-index: 1;" v-if="currentPage === 'player'||oncePlay"></playerPage>
        
      </div>
    </div>
  </div>
</template>

<style scoped>
.headLine{
  position: fixed;
  top: 0;
  height: 45px;
  width: 100%;

  -webkit-app-region: drag;

  display: flex;
  flex-direction: row-reverse;

  z-index: 100;
}

.headInPage{
  border-bottom: 1px solid rgb(220, 223, 230);
}

.iconBtn{
  margin: 15px;
  cursor: pointer;
  -webkit-app-region: no-drag;
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
.glassEffect{
  backdrop-filter: blur(10px);
  background-color: #66ccff11;
}
.menu {
  position: fixed;
  height: 100%;
  z-index: 100;

  -webkit-app-region: no-drag;
}

.menu:not(.el-menu--collapse){
  width: 200px;
  min-height: 400px;
}

.menu.el-menu--collapse{
  width: 65px
}

.collapseBtn{
  position: absolute;
  bottom: 30px;
  left:25px;
  cursor: pointer;
}

.pageContainer{
  width: 100%;
}
</style>
