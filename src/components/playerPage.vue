<script setup>
import { ref } from 'vue';

const currentUrl = ref('')

</script>

<template>
    <div class="biliContainer">
        <KeepAlive>
            <webView class="webPageContainer" src="https://www.bilibili.com/video/BV1Rp4y1P7Qe"></webView>
        </KeepAlive>
    </div>
</template>

<style scoped>
.biliContainer{
  height: 100%;
  width: calc(100% - 65px);
  position: relative;
  left: 65px;
  overflow: hidden;
}

.webPageContainer{
  width: 100%;
  height: 100%;
}
</style>