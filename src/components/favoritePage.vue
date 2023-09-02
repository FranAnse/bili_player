<script setup>
import { onMounted } from 'vue';

let favList = []

function readSinglePage(web) {
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
          downloadAsTXT(JSON.stringify(favList))
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

  let web = document.getElementsByClassName('webPageContainer')[0]
  web.addEventListener('did-stop-loading', readSinglePage(web))
  web.addEventListener('did-stop-loading', () => {
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
.biliContainer {
  height: 100%;
  width: 100%;
  overflow: hidden;

}

.webPageContainer {
  width: 100%;
  height: 100%;
}
</style>
