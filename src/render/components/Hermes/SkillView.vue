<template>
  <el-drawer
    v-model="show"
    :with-header="false"
    size="80%"
    :destroy-on-close="true"
    :close-on-click-modal="false"
    class="host-edit-drawer"
    @closed="closedFn"
  >
    <div class="host-vhost">
      <div class="nav px-3 pr-5 overflow-hidden flex items-center">
        <div class="flex flex-s items-center gap-3">
          <yb-icon
            :svg="import('@/svg/delete.svg?raw')"
            class="w-[24px] h-[24px] p-[3px] cursor-pointer hover:text-yellow-500"
            @click="show = false"
          />
          <span class="truncate">{{ title }}</span>
        </div>
        <div class="flex-shrink-0 flex items-center gap-2">
          <div
            :class="{
              'hover:bg-gray-200': tab !== 'code',
              'bg-gray-300': tab === 'code'
            }"
            class="w-[28px] h-[28px] rounded-[4px] flex items-center justify-center"
            @click.stop="tab = 'code'"
          >
            <yb-icon
              :svg="import('@/svg/markdown-left.svg?raw')"
              class="w-[22px] h-[22px] p-[2px] cursor-pointer hover:text-yellow-500"
            />
          </div>
          <div
            :class="{
              'hover:bg-gray-200': tab !== 'both',
              'bg-gray-300': tab === 'both'
            }"
            class="w-[28px] h-[28px] rounded-[4px] flex items-center justify-center"
            @click.stop="tab = 'both'"
          >
            <yb-icon
              :svg="import('@/svg/markdown-center.svg?raw')"
              :raw-color="true"
              class="w-[28px] h-[28px] p-[2px] cursor-pointer hover:text-yellow-500"
            />
          </div>
          <div
            :class="{
              'hover:bg-gray-200': tab !== 'preview',
              'bg-gray-300': tab === 'preview'
            }"
            class="w-[28px] h-[28px] rounded-[4px] flex items-center justify-center"
            @click.stop="tab = 'preview'"
          >
            <Picture class="w-[23px] h-[23px] p-[2px] cursor-pointer hover:text-yellow-500" />
          </div>

          <div
            class="w-[28px] h-[28px] ml-3 rounded-[4px] flex items-center justify-center hover:bg-gray-200"
            @click.stop="doSave"
          >
            <el-badge is-dot :offset="[-3, 5]" :hidden="!hasChanged">
              <yb-icon
                :svg="import('@/svg/save.svg?raw')"
                :raw-color="true"
                :class="{
                  'opacity-50': !canSave
                }"
                class="w-[23px] h-[23px] p-[2px] cursor-pointer hover:text-yellow-500"
              />
            </el-badge>
          </div>
        </div>
      </div>

      <div ref="mainRef" class="skill-view-content flex-1 overflow-hidden flex">
        <div v-show="tab !== 'preview'" class="left" :style="leftStyle">
          <div ref="editorRef" class="editor"></div>
        </div>
        <div v-show="tab === 'both'" class="handle" @mousedown.stop="HandleMoveMouseDown"></div>
        <div
          v-show="tab !== 'code'"
          class="flex-1 h-full overflow-hidden bg-white dark:bg-slate-900 rounded-md"
        >
          <el-scrollbar class="p-5">
            <div class="vp-doc select-text pointer-events-auto" v-html="html"></div>
          </el-scrollbar>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js'
  import { AsyncComponentSetup } from '@/util/AsyncComponent'
  import { EditorCreate, EditorDestroy, EditorConfigMake } from '@/util/Editor'
  import { app, fs, md } from '@/util/NodeFn'
  import { Picture } from '@element-plus/icons-vue'
  import { HermesSetup } from './setup'
  import { MessageError, MessageSuccess } from '@/util/Element'
  import { I18nT } from '@lang/index'
  import { KeyCode, KeyMod } from 'monaco-editor/esm/vs/editor/editor.api.js'

  const { show, onClosed, onSubmit, closedFn } = AsyncComponentSetup()

  const props = defineProps<{
    category: string
    name: string
  }>()

  const tab = computed({
    get() {
      return HermesSetup.skillViewTab
    },
    set(value) {
      HermesSetup.skillViewTab = value
    }
  })

  const title = computed(() => `${props.category}/${props.name}`)

  const canSave = ref(false)
  const contentBackup = ref('')
  const content = ref('')
  const html = ref('')

  const editorRef = ref<HTMLElement>()
  const mainRef = ref<HTMLElement>()
  let monacoEditor: editor.IStandaloneCodeEditor | undefined

  const leftStyle = ref({
    width: '50%',
    flex: 'unset'
  })

  watch(
    tab,
    (v) => {
      if (v === 'code') {
        leftStyle.value.width = '100%'
      } else if (v === 'both') {
        leftStyle.value.width = '50%'
      }
    },
    {
      immediate: true
    }
  )

  const hasChanged = computed(() => {
    return canSave.value && content.value !== contentBackup.value
  })

  const initEditor = async () => {
    if (!editorRef.value) return
    const config = await EditorConfigMake(content.value, false, 'on', 'markdown')
    monacoEditor = EditorCreate(editorRef.value, config)
    monacoEditor?.addAction({
      id: 'save',
      label: 'save',
      keybindings: [KeyMod.CtrlCmd | KeyCode.KeyS],
      run: () => {
        doSave().catch()
      }
    })
    monacoEditor?.onDidChangeModelContent(() => {
      content.value = monacoEditor?.getValue() ?? ''
    })
  }

  const renderHtml = async () => {
    if (!content.value) {
      html.value = ''
      return
    }
    html.value = await md.render(content.value)
  }

  watch(content, () => {
    renderHtml()
  })
  let filePath = ''
  onMounted(async () => {
    try {
      const home = await app.getPath('home')
      const path = `${home}/.hermes/skills/${props.category}/${props.name}/SKILL.md`
      filePath = path
      const exists = await fs.existsSync(path)
      if (exists) {
        content.value = await fs.readFile(path)
        canSave.value = true
      } else {
        content.value = '# SKILL.md not found'
      }
    } catch {
      content.value = '# Error loading file'
    }
    contentBackup.value = content.value
    await nextTick()
    initEditor().catch()
  })

  onUnmounted(() => {
    EditorDestroy(monacoEditor)
  })

  let wapperRect: DOMRect = new DOMRect()
  const maskDom = document.createElement('div')
  maskDom.classList.add('app-move-mask')

  const mouseMove = (e: MouseEvent) => {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    const left = e.clientX - wapperRect.left - 5
    leftStyle.value = {
      width: `${left}px`,
      flex: 'unset'
    }
  }
  const mouseUp = () => {
    document.removeEventListener('mousemove', mouseMove)
    document.removeEventListener('mouseup', mouseUp)
    maskDom.remove()
  }
  const HandleMoveMouseDown = (e: MouseEvent) => {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    const mainDom: HTMLElement = mainRef.value as any
    wapperRect = mainDom.getBoundingClientRect()
    document.body.append(maskDom)
    document.addEventListener('mousemove', mouseMove)
    document.addEventListener('mouseup', mouseUp)
  }

  const doSave = async () => {
    if (!canSave.value || !hasChanged.value) return
    const str = monacoEditor?.getValue() ?? content.value
    try {
      await fs.writeFile(filePath, str)
      content.value = str
      contentBackup.value = str
      MessageSuccess(I18nT('base.success'))
    } catch (e) {
      MessageError(`${e}`)
    }
  }

  defineExpose({
    show,
    onSubmit,
    onClosed
  })
</script>

<style scoped>
  .left {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .editor {
    flex: 1;
    overflow: hidden;
  }
  .handle {
    width: 5px;
    cursor: col-resize;
    background: #ddd;
    flex-shrink: 0;
  }
</style>
