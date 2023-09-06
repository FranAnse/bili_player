<script setup>
import { onMounted, ref, onBeforeUnmount, watch } from 'vue';
import { useVideosStore } from '../stores/videos';
import { ElMessageBox } from 'element-plus'

const Store = require('electron-store');

const store = new Store()

const videosList = useVideosStore()

const isLoading = ref(false)

const currentUrl = ref('')

const currentUrlInput = ref('')

currentUrl.value = store.get('spaceUrl')

watch(currentUrl,(value)=>{
  currentUrlInput.value = value
})

currentUrlInput.value = currentUrl.value

let favList = []

let web

onBeforeUnmount(() => {
  if (web) {
    web.removeEventListener('did-stop-loading', readSinglePage)
  }
})

function readList() {
  changeUrl()
  isLoading.value = true
  web = document.getElementsByClassName('webPageContainer')[0]
  web.addEventListener('did-stop-loading', readSinglePage(web))
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
          store.set('favList', JSON.stringify(favList))
          ElMessageBox.alert('收藏夹已导出到列表', '已完成', {
            confirmButtonText: 'OK',
          })
          isLoading.value = false
          // downloadAsTXT(JSON.stringify(favList))
        }
      }).catch((e) => {
        isLoading.value = false
        ElMessageBox.alert('发生错误，请检查当前地址是否为收藏夹地址', '错误')
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

function changeUrl() {
  if (!currentUrlInput.value.startsWith('http')) {
    ElMessageBox.alert('请输入http开头的完整链接', '错误')
    throw new Error()
  }
  store.set('spaceUrl', currentUrlInput.value);
  currentUrl.value = currentUrlInput.value
}

</script>

<template>
  <div class="biliContainer">
    <div class="mask" v-if="isLoading">读取中</div>
    <webView class="webPageContainer" :src="currentUrl"></webView>
    <div class="headLine">
      <el-input class="urlInput" v-model="currentUrlInput" placeholder="输入你的b站空间地址" size="default"></el-input>

      <el-button class="btn" type="primary" size="default" @click="readList">读取收藏夹</el-button>
    </div>

  </div>
</template>

<style scoped>
.biliContainer {
  height: 100%;
  width: calc(100% - 65px);
  left: 65px;
  top:45px;
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

.urlInput {
  margin-left: 10px;
  width: calc(100% - 130px);
}
</style>
