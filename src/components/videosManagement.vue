<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref,onMounted } from 'vue';

const Store = require('electron-store');

const store = new Store()

const tableData = ref([])

const searchParams = ref('')

const columns = ref([
// {
//     id:'index',
//     label:'',
// },
{
    id:'name',
    label:'标题',
},{
    id:'url',
    label:'地址'
},
// {
//     id:'operations',
//     label:'操作',
// }
])


onMounted(()=>{ 
    tableData.value.push(...(JSON.parse(store.get('favList'))))
})

function load(){

}
</script>

<template>
    <div class="playListPageContainer">
        <div class="headLine">
            <div style="font-weight: bold;">播放列表</div>
            <el-input class="searchLine" v-model="searchParams" placeholder="" size="normal" clearable :suffix-icon="Search">
            </el-input>
        </div>
        <div class="playListContainer">

            <el-table table-layout="auto" v-infinite-scroll="load" class="dataTable" :data="tableData">
                <el-table-column v-for="col in columns"
                    :prop="col.id"
                    :key="col.id"
                    :label="col.label">
                </el-table-column>
            </el-table>
            <!-- 分页组件 -->
            <el-pagination
                class="pagination"
                background
                layout="prev, pager, next"
                :total="1000">
            </el-pagination>
        </div>
    </div>
</template>

<style scoped>
.playListPageContainer {
    height: 100%;
    width: calc(100% - 65px);
    position: relative;
    top: 45px;
    left: 65px;
    overflow: hidden;

}

.playListContainer {
    width: 100%;
    height: calc(100% - 90px);
}
.dataTable{
    height: 100%;
}

.headLine {
    height: 45px;
    border-top: 1px solid rgb(220, 223, 230);
    display: flex;
    align-items: center;
    padding: 0 10px;
    justify-content: space-between
}

.searchLine{
    width: 200px;
    border-radius: 10px;
}

:deep(.el-input__wrapper){
    border-radius: 50px;
}

:deep(.cell){
    text-align: left;
}
</style>