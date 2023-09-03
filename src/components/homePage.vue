<script setup>
import img from '../assets/image/Q20230903100504.png';
import {ref} from 'vue';

const cover = ref(img)
</script>

<template>
    <div class="biliContainer">
        <el-image class="imageContainer" :src="cover" fit="cover" :lazy="true">
        </el-image>
        <div class="mask">
          <div class="playBtnContainer">
            <el-icon size="30px"><VideoPause /></el-icon>
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
  width: 100px;
  height: 70px;
  position: absolute;
  right: 0%;
  bottom: 0%;
  color: aliceblue;
  text-shadow: 0 0 4px #32003C;
}
</style>