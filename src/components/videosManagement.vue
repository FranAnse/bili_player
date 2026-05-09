<script setup>
import { Delete, Edit, Plus, Search, VideoPlay } from '@element-plus/icons-vue'
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'

import { useVideosStore } from '../stores/videos'

const videosStore = useVideosStore()
const { playlist, playQueue, currentQueueIndex, currentSong } = storeToRefs(videosStore)

const searchParams = ref('')

const addForm = ref({
  name: '',
  url: '',
})

const renameDialogVisible = ref(false)
const renameForm = ref({
  name: '',
  url: '',
})

onMounted(() => {
  videosStore.loadPlaylist()
})

const nextSongUrl = computed(() => {
  const nextIndex = currentQueueIndex.value + 1

  if (nextIndex < 0 || nextIndex >= playQueue.value.length) {
    return ''
  }

  return playQueue.value[nextIndex]?.url ?? ''
})

const filteredTableData = computed(() => {
  const keyword = searchParams.value.trim().toLowerCase()

  if (!keyword) {
    return playlist.value
  }

  return playlist.value.filter((song) => {
    return song.name.toLowerCase().includes(keyword) || song.url.toLowerCase().includes(keyword)
  })
})

function isCurrentRow(row) {
  return currentSong.value?.url === row.url
}

function isNextRow(row) {
  return nextSongUrl.value === row.url
}

function handleAddSong() {
  if (!addForm.value.url.trim().startsWith('http')) {
    ElMessage.warning('请输入完整的视频链接')
    return
  }

  const result = videosStore.addSong(addForm.value)

  if (!result.ok) {
    if (result.reason === 'duplicate') {
      ElMessage.warning('这个视频已经在歌单里了')
      return
    }

    ElMessage.warning('请填写完整的视频名称和链接')
    return
  }

  addForm.value = {
    name: '',
    url: '',
  }

  ElMessage.success('已添加到歌单')
}

function openRenameDialog(row) {
  renameForm.value = {
    name: row.name,
    url: row.url,
  }
  renameDialogVisible.value = true
}

function handleRenameSong() {
  const result = videosStore.renameSong(renameForm.value.url, renameForm.value.name)

  if (!result.ok) {
    ElMessage.warning('名称不能为空')
    return
  }

  renameDialogVisible.value = false
  ElMessage.success('歌曲名称已更新')
}

async function handleDeleteSong(row) {
  try {
    await ElMessageBox.confirm(`确认从歌单中删除《${row.name}》吗？`, '删除歌曲', {
      type: 'warning',
    })
  } catch (error) {
    return
  }

  const result = videosStore.removeSong(row.url)

  if (!result.ok) {
    ElMessage.error('删除失败')
    return
  }

  ElMessage.success('已从歌单中删除')
}

function handlePlayNext(row) {
  const result = videosStore.insertSongAsNext(row)

  if (!result.ok) {
    ElMessage.error('加入下一首失败')
    return
  }

  ElMessage.success('已加入下一首播放')
}
</script>

<template>
  <div class="playListPageContainer">
    <div class="headLine">
      <div class="headlineTitle">歌单管理</div>
      <el-input
        v-model="searchParams"
        class="searchLine"
        placeholder="搜索标题或链接"
        clearable
        :suffix-icon="Search"
      ></el-input>
    </div>

    <div class="toolBar">
      <el-input v-model="addForm.name" class="toolInput nameInput" placeholder="视频名称"></el-input>
      <el-input v-model="addForm.url" class="toolInput urlInput" placeholder="视频链接"></el-input>
      <el-button type="primary" :icon="Plus" @click="handleAddSong">添加到歌单</el-button>
    </div>

    <div class="playListContainer">
      <el-table table-layout="fixed" height="100%" class="dataTable" :data="filteredTableData" empty-text="歌单里还没有内容">
        <el-table-column label="#" width="70">
          <template #default="scope">
            {{ scope.$index + 1 }}
          </template>
        </el-table-column>

        <el-table-column label="标题" min-width="280">
          <template #default="scope">
            <div class="songNameCell">
              <span class="songName">{{ scope.row.name }}</span>
              <el-tag v-if="isCurrentRow(scope.row)" size="small">当前播放</el-tag>
              <el-tag v-else-if="isNextRow(scope.row)" size="small" type="success">下一首</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="url" label="链接" min-width="360">
          <template #default="scope">
            <div class="songUrl">{{ scope.row.url }}</div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <div class="actionButtons">
              <el-tooltip content="加入下一首播放" placement="top">
                <el-icon class="actionIcon" @click="handlePlayNext(scope.row)">
                  <VideoPlay />
                </el-icon>
              </el-tooltip>
              <el-tooltip content="重命名" placement="top">
                <el-icon class="actionIcon" @click="openRenameDialog(scope.row)">
                  <Edit />
                </el-icon>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-icon class="actionIcon dangerIcon" @click="handleDeleteSong(scope.row)">
                  <Delete />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="renameDialogVisible" title="重命名歌曲" width="420px">
      <el-input v-model="renameForm.name" placeholder="输入新的歌曲名称"></el-input>
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRenameSong">保存</el-button>
      </template>
    </el-dialog>
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
  background-color: #ffffff;
}

.headLine {
  height: 56px;
  border-top: 1px solid rgb(220, 223, 230);
  border-bottom: 1px solid rgb(235, 238, 245);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.headlineTitle {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.searchLine {
  width: 240px;
}

.toolBar {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid rgb(235, 238, 245);
}

.toolInput {
  max-width: 420px;
}

.nameInput {
  width: 260px;
}

.urlInput {
  flex: 1;
}

.playListContainer {
  height: calc(100% - 128px);
}

.dataTable {
  height: 100%;
}

.songNameCell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.songName {
  word-break: break-word;
}

.songUrl {
  color: #606266;
  word-break: break-all;
}

.actionButtons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.actionIcon {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}

.actionIcon:hover {
  color: #606266;
}

.dangerIcon:hover {
  color: #f56c6c;
}

:deep(.cell) {
  text-align: left;
}
</style>
