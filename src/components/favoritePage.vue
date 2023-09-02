<script setup>
import { onMounted } from 'vue';

let favList = []

function readSinglePage(web){
  setTimeout(() => {
      web.executeJavaScript(`
        var title = document.querySelectorAll('.fav-video-list .title');
        var info = []
        title.forEach((item)=>{
          info.push({
            name:item.title,
            url:item.href
          })
        })
        info
      `).then((result)=>{
        favList.push(...result)
        web.executeJavaScript(`
        var a = document.querySelector('.be-pager-next').click()
      `)

        if(result.length===20){
          readSinglePage(web)
        }else{
          console.log(favList)
        }
      })
    }, 2000);
}

onMounted(()=>{

  let web = document.getElementsByClassName('webPageContainer')[0]
  web.addEventListener('did-stop-loading',readSinglePage(web))
  web.addEventListener('did-stop-loading',()=>{
    web.openDevTools()
  })
})

</script>

<template>
    <div class="biliContainer">
      <webView class="webPageContainer" src="https://space.bilibili.com/9358935/favlist"></webView>
    </div>
</template>

<style scoped>
.biliContainer{
  height: 100%;
  width: 100%;
  overflow: hidden;

}

.webPageContainer{
  width: 100%;
  height: 100%;
}
</style>
