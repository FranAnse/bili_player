<script setup>
import img from '../assets/image/Q20230903100504.png';
import { ref, onMounted } from 'vue';

import { useVideosStore } from '../stores/videos'

const cover = ref(img)

const props = defineProps(['currentPlayName'])

const playStatus = ref(false)

const videosStore = useVideosStore()

onMounted(()=>{
  if(videosStore.videosPlayStatus === ''){
    playStatus.value = false
  }else{
    playStatus.value = videosStore.videosPlayStatus === '1' ? true : false
  }
})

const emits = defineEmits(['changePlayStatus'])

function changePlayStatus(){
  playStatus.value = !playStatus.value
  emits('changePlayStatus',playStatus.value)
}
</script>

<template>
    <div class="biliContainer">
        <el-image class="imageContainer" :src="cover" fit="cover" :lazy="true">
        </el-image>
        <div class="mask">
          <div class="playBtnContainer">
            <div class="currentPlayName">{{ props.currentPlayName }}</div>
            <el-icon style="cursor: pointer;" @click="changePlayStatus" size="30px"><VideoPause v-if="playStatus"/><VideoPlay v-if="!playStatus"/></el-icon>
          </div>
        </div>
      
    </div>
</template>

<style scoped>
.biliContainer{
  height: 100%;
  width: 100%;
  overflow: hidden;
  
}

.imageContainer{
  width: 100%;
  height: 100%;
  position: fixed;


  /* background: no-repeat center url('/public/image/Q20230903100504.png'); */
}

:deep(.el-image__inner){
  object-position: top left;
}

.webPageContainer{
  width: 100%;
  height: 100%;
}

.mask{
  height: 100%;
  width: 100%;
  background: content-box linear-gradient(transparent, skyblue);
  position: relative;
  z-index: 50;
}

.playBtnContainer{
  width: auto;
  height: 70px;
  position: absolute;
  right: 30px;
  bottom: 0%;
  color: aliceblue;
  text-shadow: 0 0 4px #32003C;

  display: flex;
  align-items: center
}

.currentPlayName{
  margin-right: 20px;
}
</style>