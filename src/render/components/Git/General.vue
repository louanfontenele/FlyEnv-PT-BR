<template>
  <el-card class="app-base-el-card version-manager">
    <template #header>
      <div class="flex items-center justify-between">
        <span>Git Environment</span>
        <el-button
          :disabled="GitSetup.fetching || GitSetup.installing"
          class="button"
          link
          @click="reFetch"
        >
          <yb-icon
            :svg="import('@/svg/icon_refresh.svg?raw')"
            class="refresh-icon w-[24px] h-[24px]"
            :class="{ 'fa-spin': GitSetup.fetching }"
          ></yb-icon>
        </el-button>
      </div>
    </template>
    <template v-if="GitSetup.installing">
      <div class="w-full h-full overflow-hidden p-5">
        <div ref="xtermDom" class="w-full h-full overflow-hidden"></div>
      </div>
    </template>
    <template v-else-if="showInstall">
      <div class="p-5">
        <pre class="app-html-block mb-6 text-xl" v-html="I18nT('nodejs.installGit')"></pre>
        <el-form label-position="top" label-width="150px">
          <el-form-item :label="I18nT('util.nodeToolInstallBy')">
            <el-radio-group v-model="GitSetup.installLib">
              <el-radio-button key="shell" label="shell">{{
                I18nT('base.Official')
              }}</el-radio-button>
              <template v-if="!isWindows">
                <el-radio-button key="brew" :disabled="!hasBrew" label="brew"
                  >Homebrew</el-radio-button
                >
              </template>
              <template v-if="isMacOS">
                <el-radio-button key="port" :disabled="!hasPort" label="port"
                  >Macports</el-radio-button
                >
              </template>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button class="mt-3" type="primary" @click.stop="installGit">{{
              I18nT('base.install')
            }}</el-button>
          </el-form-item>
        </el-form>
      </div>
    </template>
    <template v-else>
      <el-table
        v-loading="GitSetup.fetching || GitSetup.checking"
        :data="GitSetup.info.items"
        show-overflow-tooltip
      >
        <el-table-column label="Item" prop="label" width="160">
          <template #header>
            <span style="padding: 2px 12px 2px 24px; display: block">Item</span>
          </template>
          <template #default="scope">
            <span class="truncate" style="padding: 2px 12px 2px 24px">{{ scope.row.label }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Status" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.ok ? 'success' : 'danger'">
              {{ scope.row.ok ? 'OK' : 'Missing' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Command / Path" prop="value" />
        <el-table-column label="Result" prop="message" />
      </el-table>
    </template>
    <template v-if="showFooter" #footer>
      <template v-if="taskEnd">
        <el-button type="primary" @click.stop="taskConfirm">{{ I18nT('base.confirm') }}</el-button>
      </template>
      <template v-else>
        <el-button @click.stop="taskCancel">{{ I18nT('base.cancel') }}</el-button>
      </template>
    </template>
  </el-card>
</template>

<script lang="ts" setup>
  import { I18nT } from '@lang/index'
  import { GitSetup, Setup } from './setup'

  const {
    xtermDom,
    hasBrew,
    hasPort,
    installGit,
    showInstall,
    showFooter,
    taskEnd,
    taskConfirm,
    taskCancel,
    isWindows,
    isMacOS
  } = Setup()

  const reFetch = () => {
    GitSetup.reFetch()
  }
</script>
