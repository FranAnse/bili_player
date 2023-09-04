<script setup>
import { ref, onMounted, onBeforeUnmount, defineEmits } from 'vue';

import { useVideosStore } from '../stores/videos'

const videosStore = useVideosStore()

defineExpose({ switchPlayStatus })

const Store = require('electron-store');

const store = new Store()

const urlList = ref([])
const currentUrl = ref('')
const currentPlayName = ref('')

const emit = defineEmits(['songChange'])

let web
let interval

onBeforeUnmount(() => {
    web.removeEventListener('did-stop-loading', readPlayStatus)
    clearInterval(interval)
})

function switchPlayStatus(){
    web.executeJavaScript(`
                document.getElementsByClassName('bpx-player-ctrl-btn')[0].click()
            `)
}

function readPlayStatus(web) {
    interval = setInterval(() => {
        web.executeJavaScript(`
                var isEnd = document.querySelector('.bpx-player-ending-wrap');
                if(isEnd.getAttribute('data-select') === '0'){
                    false
                }else{
                    true
                }
            `).then((result) => {
            if (result) {
                let songInfo = urlList.value[Math.floor(Math.random() * urlList.value.length)]
                currentUrl.value = songInfo.url
                emit('songChange', songInfo.name)
            }
        })

        web.executeJavaScript(`
                var isEnd = document.getElementsByClassName('bpx-player-row-dm-wrap')[0].getAttribute('class')
                isEnd.includes('bili-paused')
            `).then((result) => {
            if (!result) {
                videosStore.videosPlayStatus = '1'
            }else{
                videosStore.videosPlayStatus = '0'
            }
        })
    }, 1000);
}

urlList.value = JSON.parse(store.get('favList'))
if (urlList.value) {
    let songInfo = urlList.value[Math.floor(Math.random() * urlList.value.length)]
    currentUrl.value = songInfo.url
    emit('songChange', songInfo.name)
} else {
    console.log(1);
}
onMounted(() => {
    web = document.getElementsByClassName('webPageContainer')[0]
    web.addEventListener('did-stop-loading', readPlayStatus(web))
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