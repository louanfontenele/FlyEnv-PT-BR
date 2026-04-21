<template>
  <el-card class="version-manager">
    <template #header>
      <div class="card-header">
        <span>{{ I18nT('hermes.sessions') }}</span>
        <el-button link :disabled="HermesSetup.loading" @click="HermesSetup.refreshSessions()">
          <yb-icon
            :svg="import('@/svg/icon_refresh.svg?raw')"
            class="refresh-icon"
            :class="{ 'fa-spin': HermesSetup.loading }"
          ></yb-icon>
        </el-button>
      </div>
    </template>
    <div class="p-5 h-full overflow-hidden flex flex-col">
      <el-input
        v-model="search"
        :placeholder="I18nT('hermes.searchSession')"
        clearable
        class="mb-3"
      />
      <el-scrollbar class="flex-1">
        <el-table :data="filteredSessions" stripe style="width: 100%">
          <el-table-column prop="name" :label="I18nT('hermes.sessionName')" />
          <el-table-column prop="lastActive" :label="I18nT('hermes.lastActive')" width="140" />
          <el-table-column prop="src" :label="I18nT('hermes.source')" width="100" />
          <el-table-column prop="id" :label="I18nT('hermes.id')" width="220" />
          <el-table-column width="120" :label="I18nT('base.operation')" align="center">
            <template #default="{ row }">
              <el-button link type="danger" :icon="Delete" @click="deleteSession(row)"> </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="filteredSessions.length === 0" />
      </el-scrollbar>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue'
  import { I18nT } from '@lang/index'
  import { HermesSetup, SessionItem } from './setup'
  import { Delete } from '@element-plus/icons-vue'
  import { ElMessageBox } from 'element-plus'

  const search = ref('')

  const filteredSessions = computed(() => {
    if (!search.value) return HermesSetup.sessions
    return HermesSetup.sessions.filter((s) =>
      s.name.toLowerCase().includes(search.value.toLowerCase())
    )
  })

  const deleteSession = (row: SessionItem) => {
    ElMessageBox.confirm(I18nT('base.delAlertContent'), I18nT('base.delAlertTitle'), {
      confirmButtonText: I18nT('base.confirm'),
      cancelButtonText: I18nT('base.cancel'),
      type: 'warning'
    })
      .then(() => {
        HermesSetup.deleteSession(row.id)
      })
      .catch(() => {})
  }

  onMounted(() => {
    HermesSetup.refreshSessions()
  })
</script>
