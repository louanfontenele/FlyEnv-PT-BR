<template>
  <div
    :style="
      {
        marginTop: index === 0 ? '15px' : null
      } as any
    "
    class="flex items-center justify-between pr-6 module-type pb-3 pl-1 text-sm mb-3 mt-7 text-zinc-600 dark:text-gray-300 border-b border-zinc-200 dark:border-zinc-700"
  >
    <div class="flex items-center">
      <span>{{ item.label }}</span>
      <template v-if="index === 0">
        <el-tooltip :content="I18nT('setup.moduleCateAddTips')" :placement="'top'">
          <el-button class="ml-3" size="small" link @click.stop="addGroup">
            <yb-icon :svg="import('@/svg/add-cate.svg?raw')" width="15" height="15" />
          </el-button>
        </el-tooltip>
      </template>
    </div>

    <div class="inline-flex items-center gap-4">
      <el-button style="margin-left: 0" size="small" link>
        <Plus class="w-[15px] h-[15px]" />
      </el-button>
      <el-switch
        v-model="groupState"
        :loading="groupSetting"
        :disabled="groupSetting"
        size="small"
      ></el-switch>
    </div>
  </div>
  <template v-if="!item.sub.length">
    <div class="flex items-center justify-center p-5">
      <el-button :icon="Plus">{{ I18nT('setup.moduleAdd') }}</el-button>
    </div>
  </template>
  <template v-else>
    <div class="grid grid-cols-3 2xl:grid-cols-4 gap-4">
      <template v-for="(i, _j) in item.sub" :key="_j">
        <div class="flex items-center justify-center w-full">
          <ModuleShowHide :label="i.label" :type-flag="i.typeFlag"></ModuleShowHide>
        </div>
      </template>
    </div>
  </template>
</template>
<script lang="ts" setup>
  import { computed, ref, nextTick } from 'vue'
  import ModuleShowHide from '@/components/Setup/ModuleShowHide/index.vue'
  import type { AppModuleItem } from '@/core/type'
  import { Plus } from '@element-plus/icons-vue'
  import { AppStore } from '@/store/app'
  import { I18nT } from '@lang/index'
  import { ElMessageBox } from 'element-plus'
  import { AppCustomerModule, type CustomerModuleItem } from '@/core/Module'
  import { uuid } from '@/util/Index'

  const props = defineProps<{
    index: number
    item: {
      label: string
      sub: AppModuleItem[]
    }
  }>()

  const appStore = AppStore()

  const groupSetting = ref(false)

  const groupState = computed({
    get() {
      return props.item.sub.some(
        (s) => appStore.config.setup.common.showItem?.[s.typeFlag] !== false
      )
    },
    set(v) {
      groupSetting.value = true
      for (const s of props.item.sub) {
        appStore.config.setup.common.showItem[s.typeFlag] = v
      }
      appStore.saveConfig().then(() => {
        nextTick().then(() => {
          groupSetting.value = false
        })
      })
    }
  })

  const addGroup = () => {
    ElMessageBox.prompt(I18nT('setup.moduleCateName'), I18nT('setup.moduleCateAddTips'), {
      confirmButtonText: I18nT('base.confirm'),
      cancelButtonText: I18nT('base.cancel')
    })
      .then(({ value }) => {
        const id = uuid()
        const item: CustomerModuleItem = {
          id,
          label: value,
          moduleType: id
        }
        AppCustomerModule.addModule(item)
      })
      .catch()
  }
</script>
