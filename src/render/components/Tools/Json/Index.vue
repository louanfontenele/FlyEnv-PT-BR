<template>
  <div class="json-parse tools host-edit">
    <div class="nav p-0">
      <div class="left">
        <span class="text-xl">{{ $t('tools.jsonParseTitle') }}</span>
        <slot name="like"></slot>
      </div>
    </div>

    <div class="main-wapper">
      <el-tabs v-model="JSONStore.currentTab" :editable="true" type="card" @edit="handleTabsEdit">
        <template v-for="(_, key) in JSONStore.tabs" :key="key">
          <el-tab-pane :label="key" :name="key" :class="key" :closable="key !== 'tab-1'">
          </el-tab-pane>
        </template>
      </el-tabs>
      <div ref="mainRef" class="main pb-0">
        <div class="left" :style="leftStyle">
          <div class="top">
            <span>{{ currentType }}</span>
            <el-button :icon="Document" @click.stop="openFile"></el-button>
          </div>
          <div ref="fromRef" class="editor el-input__wrapper"></div>
        </div>
        <div ref="moveRef" class="handle" @mousedown.stop="HandleMoveMouseDown"></div>
        <div class="right">
          <div class="top">
            <el-select v-model="to" filterable @change="onToChange">
              <el-option label="JSON" value="json"></el-option>
              <el-option label="JSON Minify" value="json-minify"></el-option>
              <el-option label="PHP Array" value="php"></el-option>
              <el-option label="JavaScript" value="js"></el-option>
              <el-option label="TypeScript" value="ts"></el-option>
              <el-option label="YAML" value="yaml"></el-option>
              <el-option label="XML" value="xml"></el-option>
              <el-option label="PList" value="plist"></el-option>
              <el-option label="TOML" value="toml"></el-option>
              <el-option label="Go Struct" value="goStruct"></el-option>
              <el-option label="Go Bson" value="goBson"></el-option>
              <el-option label="Rust Serde" value="rustSerde"></el-option>
              <el-option label="Java" value="Java"></el-option>
              <el-option label="Kotlin" value="Kotlin"></el-option>
              <el-option label="MySQL" value="MySQL"></el-option>
              <el-option label="JSDoc" value="JSDoc"></el-option>
            </el-select>
            <el-button-group>
              <el-button @click.stop="currentTab.transformTo('asc')">
                <yb-icon :svg="import('@/svg/asc1.svg?raw')" width="18" height="18" />
              </el-button>
              <el-button @click.stop="currentTab.transformTo('desc')">
                <yb-icon :svg="import('@/svg/desc1.svg?raw')" width="18" height="18" />
              </el-button>
              <el-button @click.stop="currentTab.transformTo(undefined)">
                <yb-icon :svg="import('@/svg/nosort.svg?raw')" width="18" height="18" />
              </el-button>
              <el-button @click.stop="saveToLocal">
                <yb-icon :svg="import('@/svg/save.svg?raw')" width="18" height="18" />
              </el-button>
            </el-button-group>
          </div>
          <div ref="toRef" class="editor el-input__wrapper"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
  import { editor, languages } from 'monaco-editor/esm/vs/editor/editor.api.js'

  import TomlRules from '@/util/transform/TomlRules'
  import { AppStore } from '@/store/app'
  import JSONStore, { JSONStoreTab } from '@/components/Tools/Json/store'
  import type { TabPaneName } from 'element-plus'
  import { MessageSuccess } from '@/util/Element'
  import { I18nT } from '@lang/index'
  import { Document } from '@element-plus/icons-vue'
  import { EditorCreate, EditorDestroy } from '@/util/Editor'
  import { dialog, shell, nativeTheme, fs } from '@/util/NodeFn'

  // Register custom language
  languages.register({ id: 'toml' })
  // Provide basic tokens for the custom language
  languages.setMonarchTokensProvider('toml', TomlRules as any)

  const moveRef = ref()
  const fromRef = ref()
  const toRef = ref()
  const mainRef = ref()

  const to = computed({
    get() {
      console.log('JSONStore: ', JSONStore)
      return JSONStore.tabs[JSONStore.currentTab].to
    },
    set(v: string) {
      JSONStore.tabs[JSONStore.currentTab].to = v
    }
  })
  const currentValue = computed({
    get() {
      return JSONStore.tabs[JSONStore.currentTab].value
    },
    set(v) {
      JSONStore.tabs[JSONStore.currentTab].value = v
    }
  })
  const currentType = computed({
    get() {
      return JSONStore.tabs[JSONStore.currentTab].type
    },
    set(v) {
      JSONStore.tabs[JSONStore.currentTab].type = v
    }
  })
  const currentToValue = computed({
    get() {
      return JSONStore.tabs[JSONStore.currentTab].toValue
    },
    set(v) {
      JSONStore.tabs[JSONStore.currentTab].toValue = v
    }
  })

  const currentToLang = computed({
    get() {
      return JSONStore.tabs[JSONStore.currentTab].toLang
    },
    set(v) {
      JSONStore.tabs[JSONStore.currentTab].toLang = v
    }
  })

  const currentTab = computed(() => {
    return JSONStore.tabs[JSONStore.currentTab]
  })

  const handleTabsEdit = (targetName: TabPaneName | undefined, action: 'remove' | 'add') => {
    if (action === 'add') {
      JSONStore.index += 1
      const tabName = `tab-${JSONStore.index}`
      const tab = new JSONStoreTab()
      tab.editor = () => toEditor!
      JSONStore.tabs[tabName] = reactive(tab)
      JSONStore.currentTab = tabName
    } else if (action === 'remove') {
      if (targetName === 'tab-1') {
        return
      }
      const allKeys = Object.keys(JSONStore.tabs)
      const index = allKeys.findIndex((k) => k === targetName)
      delete JSONStore.tabs?.[targetName!]
      if (targetName === JSONStore.currentTab) {
        JSONStore.currentTab = allKeys[index - 1]
      }
    }
  }

  let tabChanging = false

  let fromEditor: editor.IStandaloneCodeEditor | undefined
  let toEditor: editor.IStandaloneCodeEditor | undefined

  const EditorConfigMake = async (
    value: string
  ): Promise<editor.IStandaloneEditorConstructionOptions> => {
    const appStore = AppStore()
    const editorConfig = appStore.editorConfig
    let theme = editorConfig.theme
    if (theme === 'auto') {
      let appTheme = appStore?.config?.setup?.theme ?? ''
      if (!appTheme || appTheme === 'system') {
        const t = await nativeTheme.shouldUseDarkColors()
        appTheme = t ? 'dark' : 'light'
      }
      if (appTheme === 'light') {
        theme = 'vs-light'
      } else {
        theme = 'vs-dark'
      }
    }
    return {
      value,
      language: 'javascript',
      scrollBeyondLastLine: false,
      overviewRulerBorder: true,
      automaticLayout: true,
      wordWrap: 'on',
      theme: theme,
      fontSize: editorConfig.fontSize,
      lineHeight: editorConfig.lineHeight,
      lineNumbersMinChars: 2,
      folding: true,
      showFoldingControls: 'always',
      foldingStrategy: 'indentation',
      foldingImportsByDefault: true,
      formatOnPaste: true,
      formatOnType: true
    }
  }

  const initFromEditor = async () => {
    if (!fromEditor) {
      if (!fromRef?.value?.style) {
        return
      }
      fromEditor = EditorCreate(fromRef.value, await EditorConfigMake(currentValue.value))
      fromEditor.onDidChangeModelContent(() => {
        if (!tabChanging) {
          currentValue.value = fromEditor?.getValue() ?? ''
          currentTab.value.checkFrom().catch()
        }
      })
    }
  }

  const initToEditor = async () => {
    if (!toEditor) {
      if (!toRef?.value?.style) {
        return
      }
      toEditor = EditorCreate(toRef.value, await EditorConfigMake(currentToValue.value))
      toEditor.onDidChangeModelContent(() => {
        if (!tabChanging) {
          currentToValue.value = toEditor?.getValue() ?? ''
        }
      })
      currentTab.value.editor = () => toEditor!
      console.log('actions: ', toEditor?.getSupportedActions())
    }
  }

  const handleMoving = ref(false)
  let wapperRect: DOMRect = new DOMRect()
  const leftStyle = computed({
    get() {
      return JSONStore.style
    },
    set(v) {
      JSONStore.style = v
    }
  })

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
    handleMoving.value = false
    localStorage.setItem('PWS-JSON-LeftStle', JSON.stringify(leftStyle.value))
  }
  const HandleMoveMouseDown = (e: MouseEvent) => {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    handleMoving.value = true
    const mainDom: HTMLElement = mainRef.value as any
    wapperRect = mainDom.getBoundingClientRect()
    document.body.append(maskDom)
    document.addEventListener('mousemove', mouseMove)
    document.addEventListener('mouseup', mouseUp)
  }

  const openFile = () => {
    const opt = ['openFile']
    const filters = [
      {
        name: 'Parse File',
        extensions: [
          'txt',
          'json',
          'js',
          'xml',
          'plist',
          'yml',
          'yaml',
          'php',
          'ts',
          'mjs',
          'ini',
          'conf',
          'cnf'
        ]
      }
    ]
    dialog
      .showOpenDialog({
        properties: opt,
        filters: filters
      })
      .then(async ({ canceled, filePaths }: any) => {
        if (canceled || filePaths.length === 0) {
          return
        }
        const [path] = filePaths
        currentValue.value = await fs.readFile(path)
        fromEditor?.setValue(currentValue.value)
      })
  }

  const saveToLocal = () => {
    const opt = ['showHiddenFiles', 'createDirectory', 'showOverwriteConfirmation']
    dialog
      .showSaveDialog({
        properties: opt
      })
      .then(async ({ canceled, filePath }: any) => {
        if (canceled || !filePath) {
          return
        }
        const content = toEditor?.getValue() ?? ''
        await fs.writeFile(filePath, content)
        MessageSuccess(I18nT('base.success'))
        shell.showItemInFolder(filePath)
      })
  }

  onMounted(() => {
    initFromEditor()
    initToEditor()
  })

  onUnmounted(() => {
    EditorDestroy(fromEditor)
    EditorDestroy(toEditor)
  })

  const onToChange = (v: any) => {
    console.log('onToChange !!!', v)
    if (!tabChanging) {
      currentTab.value.transformTo()
    }
  }

  watch(
    () => JSONStore.currentTab,
    () => {
      tabChanging = true
      currentTab.value.editor = () => toEditor!
      fromEditor?.setValue(currentValue.value)
      toEditor?.setValue(currentToValue.value)
      const model = toEditor!.getModel()!
      editor.setModelLanguage(model, currentToLang.value)
      nextTick().then(() => {
        tabChanging = false
      })
    }
  )
</script>
