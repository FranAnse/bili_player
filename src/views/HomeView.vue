<script setup>
import { ref } from 'vue';

import { useRouter } from "vue-router"

const router = useRouter()

const menus = ref([{
  index: '0',
  key: 'home',
  title: '首页',
  route: '/'
}, {
  index: '1',
  key: 'favorite',
  title: '收藏夹',
  route: '/favorite'
}])
</script>

<template>
  <div class="mainContainer">
    <el-menu default-active="0">
      <el-menu-item v-for="menu in menus" :index="menu.index" :key="menu.key" @click="router.push(menu.route)">
        {{ menu.title }}
      </el-menu-item>
      
    </el-menu>
    <div class="contentContainer">
      <RouterView></RouterView>
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

.contentContainer{
  width: 100%;
  height: 100%;
}
</style>
