<script setup>
import { onMounted, ref } from 'vue';
import { useVideosStore } from '../stores/videos';
import { ElMessageBox } from 'element-plus'

const videosList = useVideosStore()

const isLoading = ref(false)

let favList = []

function readList() {
  isLoading.value = true
  let web = document.getElementsByClassName('webPageContainer')[0]
  web.addEventListener('did-stop-loading', readSinglePage(web))
  web.addEventListener('did-stop-loading', () => {
    web.openDevTools()
  })
}

function readSinglePage(web) {
  setTimeout(() => {
    web.executeJavaScript(`
        var title = document.querySelectorAll('.fav-video-list .title');
        var info = []
        title.forEach((item)=>{
          if(item.title !== '已失效视频'){
            info.push({
              name:item.title,
              url:item.href
            })
          }
        })
        info
      `).then((result) => {
      favList.push(...result)
      web.executeJavaScript(`
        var a = document.querySelector('.be-pager-next').click()
        var a = document.querySelector('.be-pager-item-active')
        var b = document.querySelector('.be-pager-total')
        console.log(a.innerHTML.replace(/[^0-9]/ig,""))
        if(b.innerHTML.replace(/[^0-9]/ig,"") === a.innerHTML.replace(/[^0-9]/ig,"")){
          false
        }else{
          true
        }
      `).then((hasNext) => {
        if (hasNext) {
          readSinglePage(web)
        } else {
          videosList.videosList = favList
          sessionStorage.setItem('favList', JSON.stringify(favList))
          ElMessageBox.alert('收藏夹已导出到列表', '已完成', {
            confirmButtonText: 'OK',
          })
          isLoading.value = false
          // downloadAsTXT(JSON.stringify(favList))
        }
      })
    })
  }, 2000);
}

function downloadAsTXT(text) {

  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', 'favoriteList.txt');

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

onMounted(() => {

  // let web = document.getElementsByClassName('webPageContainer')[0]
  // web.addEventListener('did-stop-loading', readSinglePage(web))
  // web.addEventListener('did-stop-loading', () => {
  //   web.openDevTools()
  // })
})

</script>

<template>
  <div class="biliContainer">
    <div class="mask" v-if="isLoading">读取中</div>
    <webView class="webPageContainer" src="https://space.bilibili.com/3284588"></webView>
    <div class="headLine">
      <el-button class="btn" type="primary" size="default" @click="readList">读取收藏夹</el-button>
    </div>

  </div>
</template>

<style scoped>
.biliContainer {
  height: 100%;
  width: calc(100% - 65px);
  left: 65px;
  position: relative;
  overflow: hidden;

}

.headLine {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 50px;
  border-top: 1px solid whitesmoke;
  display: flex;
  align-items: center;
}

.webPageContainer {
  width: 100%;
  height: calc(100% - 50px);
}

.btn {
  position: absolute;
  right: 10px;
}

.mask {
  position: fixed;
  backdrop-filter: blur(5px);
  width: 100%;
  height: calc(100% - 50px);
  background-color: transparent;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bolder;
}
</style>
