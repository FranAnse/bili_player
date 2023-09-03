<script setup>
import { ref } from 'vue';


import favoritePage from '../components/favoritePage.vue'
import homePage from '../components/homePage.vue'
import playerPage from '../components/playerPage.vue';

const currentPage = ref('home')

const playList = ref()


const isMenuExpand = ref(true)
</script>

<template>
  <div class="mainContainer">

    <div class="contentContainer">

      <el-menu :collapse="!isMenuExpand" active-text-color="#66CCFF" collapse-transition class="menu" default-active="0">
        <el-menu-item index="0" @click="currentPage ='home';isMenuExpand = true">
          <el-icon><House/></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="1" @click="currentPage ='player';isMenuExpand = false">
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
        <homePage v-if="currentPage === 'home'"></homePage>
        <playerPage v-if="currentPage === 'player'"></playerPage>
        <favoritePage v-if="currentPage === 'favorite'"></favoritePage>
        
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.menu {
  position: fixed;
  backdrop-filter: blur(10px);
  height: 100%;
  z-index: 100;
  background-color: #66ccff11;
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
