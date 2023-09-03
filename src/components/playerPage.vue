<script setup>
import { ref, onMounted } from 'vue';

const urlList = ref([])
const currentUrl = ref('')

urlList.value = JSON.parse(sessionStorage.getItem('favList'))
if (urlList.value) {
    console.log(urlList.value);
    currentUrl.value = urlList.value[Math.floor(Math.random() * urlList.value.length)].url
} else {
    console.log(1);
}
onMounted(() => {
    let web = document.getElementsByClassName('webPageContainer')[0]
    web.addEventListener('did-stop-loading', () => {
        setInterval(() => {
            web.executeJavaScript(`
                var isEnd = document.querySelector('.bpx-player-ending-wrap');
                if(isEnd.getAttribute('data-select') === '0'){
                    false
                }else{
                    true
                }
            `).then((result) => {
                if(result){
                    currentUrl.value = urlList.value[Math.floor(Math.random() * urlList.value.length)].url
                }
            })
        }, 1000);
    })
})

</script>

<template>
    <div class="biliContainer">
        <webView class="webPageContainer" :src="currentUrl"></webView>
    </div>
</template>

<style scoped>
.biliContainer {
    height: 100%;
    width: calc(100% - 65px);
    position: relative;
    left: 65px;
    overflow: hidden;
}

.webPageContainer {
    width: 100%;
    height: 100%;
}
</style>