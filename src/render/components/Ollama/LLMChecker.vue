<template>
  <div class="llm-checker-wrap h-full overflow-auto p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="text-lg font-semibold">{{ I18nT('ollama.llmChecker.title') }}</div>
      <el-button :loading="state.fetching" @click="refresh">{{ I18nT('ollama.llmChecker.recheck') }}</el-button>
    </div>

    <el-alert
      v-if="state.error"
      :title="state.error"
      type="warning"
      :closable="false"
      class="mb-3"
    />

    <el-alert v-if="!ollamaServiceRunning" type="error" :closable="false" class="mb-3">
      <template #title>
        <span>
          {{ I18nT('ollama.llmChecker.serviceHint') }}
          <el-button link type="primary" @click="goToOllamaServiceTab">
            {{ I18nT('ollama.llmChecker.goToServiceTab') }}
          </el-button>
        </span>
      </template>
    </el-alert>

    <el-card class="mb-3" shadow="never">
      <template #header>
        <div class="font-medium">{{ I18nT('ollama.llmChecker.pcReportSummary') }}</div>
      </template>
      <template v-if="state.pcReportLoading">
        <div class="pc-report-loading">
          <div class="pc-report-loading-title">{{ I18nT('ollama.llmChecker.fetchingPcDetails') }}</div>
          <div class="pc-report-skeleton-grid">
            <el-skeleton v-for="i in 8" :key="`pc-row-${i}`" animated>
              <template #template>
                <el-skeleton-item variant="text" style="width: 92%; height: 14px" />
              </template>
            </el-skeleton>
          </div>
          <el-divider class="!my-4" />
          <div class="text-sm font-medium mb-2">{{ I18nT('ollama.llmChecker.graphicsCards') }}</div>
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="text" style="width: 75%; height: 14px" />
              <el-skeleton-item variant="text" style="width: 100%; height: 14px; margin-top: 10px" />
              <el-skeleton-item variant="text" style="width: 100%; height: 14px; margin-top: 8px" />
              <el-skeleton-item variant="text" style="width: 100%; height: 14px; margin-top: 8px" />
            </template>
          </el-skeleton>
        </div>
      </template>
      <template v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm">
          <div v-for="item in summaryItems" :key="item.key" class="summary-row">
            <span class="summary-key">{{ item.key }}:</span>
            <span class="summary-value">{{ item.value }}</span>
          </div>
        </div>
        <div class="mt-3 text-xs text-gray-500">
          {{ machineHint }}
        </div>

        <el-divider class="!my-4" />

        <div class="text-sm font-medium mb-2">{{ I18nT('ollama.llmChecker.graphicsCards') }}</div>
        <el-tabs v-model="state.gpuTab" type="card" class="gpu-tabs">
          <el-tab-pane
            v-for="(item, idx) in gpuRows"
            :key="`${idx}-${item.cardName}`"
            :name="`${idx}`"
            :label="`GPU ${idx + 1}: ${item.cardName}`"
          >
            <el-table :data="[item]" :border="false" size="small" style="width: 100%">
              <el-table-column prop="vendor" :label="I18nT('ollama.llmChecker.cardName')" min-width="140" />
              <el-table-column prop="model" :label="I18nT('base.model')" min-width="180" />
              <el-table-column prop="vram" :label="I18nT('ollama.llmChecker.ram')" width="140" />
              <el-table-column prop="driverVersion" :label="I18nT('ollama.llmChecker.driver')" min-width="120" />
              <el-table-column prop="resolution" :label="I18nT('ollama.llmChecker.resolution')" width="130" />
              <el-table-column prop="processor" :label="I18nT('ollama.llmChecker.videoProcessor')" min-width="180" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane v-if="!gpuRows.length" name="empty" :label="I18nT('ollama.llmChecker.gpuUnknown')">
            <div class="text-xs text-gray-500 py-2">{{ I18nT('ollama.llmChecker.noGraphicsInfo') }}</div>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="font-medium">{{ I18nT('ollama.llmChecker.modelFitSuggestions') }}</div>
      </template>

      <template v-if="state.fetching">
        <div class="pc-report-loading">
          <div class="pc-report-loading-title">{{ I18nT('ollama.llmChecker.preparingModelFit') }}</div>
          <div class="model-fit-skeleton-grid mb-3">
            <el-skeleton v-for="i in 6" :key="`fit-row-${i}`" animated>
              <template #template>
                <el-skeleton-item variant="text" style="width: 100%; height: 14px" />
              </template>
            </el-skeleton>
          </div>
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="text" style="width: 55%; height: 14px" />
              <el-skeleton-item variant="text" style="width: 100%; height: 14px; margin-top: 10px" />
              <el-skeleton-item variant="text" style="width: 100%; height: 14px; margin-top: 8px" />
              <el-skeleton-item variant="text" style="width: 100%; height: 14px; margin-top: 8px" />
              <el-skeleton-item variant="text" style="width: 100%; height: 14px; margin-top: 8px" />
            </template>
          </el-skeleton>
        </div>
      </template>
      <template v-else>

      <div class="mb-3 text-xs text-gray-500">
        {{ I18nT('ollama.llmChecker.devicePerformanceProfile') }}: <b>{{ performanceTier.label }}</b> ·
        {{ I18nT('ollama.llmChecker.gpuVram') }}: <b>{{ performanceTier.maxVramText }}</b> ·
        {{ I18nT('ollama.llmChecker.systemRam') }}: <b>{{ performanceTier.systemRamText }}</b>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <el-card shadow="never">
          <template #header>
            <div class="font-medium text-sm">{{ I18nT('ollama.llmChecker.autoQuantRecommender') }}</div>
          </template>
          <div class="text-xs">
            <div>{{ I18nT('ollama.llmChecker.recommendedQuant') }}: <b>{{ quantRecommendation.quant }}</b></div>
            <div class="text-gray-500 mt-1">{{ quantRecommendation.reason }}</div>
          </div>
        </el-card>

        <el-card shadow="never" class="md:col-span-2">
          <template #header>
            <div class="font-medium text-sm">{{ I18nT('ollama.llmChecker.contextWindowSafety') }}</div>
          </template>
          <el-table :data="contextSafetyRows" :border="false" size="small">
            <el-table-column prop="modelClass" :label="I18nT('ollama.llmChecker.modelClass')" width="120" />
            <el-table-column prop="safeContext" :label="I18nT('ollama.llmChecker.safeContext')" width="130" />
            <el-table-column prop="riskyContext" :label="I18nT('ollama.llmChecker.risky')" width="120" />
            <el-table-column prop="note" :label="I18nT('ollama.llmChecker.note')" min-width="180" />
          </el-table>
        </el-card>
      </div>

      <el-card shadow="never" class="mb-3">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium text-sm">{{ I18nT('ollama.llmChecker.modelQualityScore') }}</span>
            <el-button size="small" :loading="state.qualityRunning" @click="runQualityCheck">
              {{ I18nT('ollama.llmChecker.runQualityCheck') }}
            </el-button>
          </div>
        </template>
        <el-table v-if="state.qualityRows.length" :data="state.qualityRows" :border="false" size="small">
          <el-table-column prop="model" :label="I18nT('ollama.llmChecker.modelLabel')" min-width="220" />
          <el-table-column prop="coding" :label="I18nT('ollama.llmChecker.coding')" width="90" />
          <el-table-column prop="documents" :label="I18nT('ollama.llmChecker.documents')" width="100" />
          <el-table-column prop="chat" :label="I18nT('ollama.llmChecker.chat')" width="80" />
          <el-table-column prop="vision" :label="I18nT('ollama.llmChecker.vision')" width="80" />
          <el-table-column prop="total" :label="I18nT('ollama.llmChecker.total')" width="90" />
        </el-table>
        <div v-else class="text-xs text-gray-500">{{ I18nT('ollama.llmChecker.runQualityHint') }}</div>
      </el-card>

      <div class="mb-3 flex flex-wrap gap-2 items-center">
        <el-button size="small" :loading="state.benchmarkRunning" @click="runBenchmark">
          {{ I18nT('ollama.llmChecker.benchmarkLocalModels') }}
        </el-button>
        <el-button size="small" @click="autoPickBest">{{ I18nT('ollama.llmChecker.autoPickBest') }}</el-button>
        <el-input
          v-model="state.benchmarkBaseUrl"
          size="small"
          style="width: 280px"
          :placeholder="I18nT('ollama.llmChecker.ollamaUrlPlaceholder')"
        />
        <span v-if="state.lastBenchmarkAt" class="text-xs text-gray-500">
          {{ I18nT('ollama.llmChecker.lastBenchmark') }}: {{ state.lastBenchmarkAt }}
        </span>
      </div>

      <el-table
        v-if="state.benchmarkRows.length"
        :data="state.benchmarkRows"
        :border="false"
        size="small"
        class="mb-3"
      >
        <el-table-column prop="model" :label="I18nT('ollama.llmChecker.modelLabel')" min-width="220" />
        <el-table-column prop="tokPerSec" :label="I18nT('ollama.llmChecker.realTokPerSec')" width="120" />
        <el-table-column prop="firstTokenSec" :label="I18nT('ollama.llmChecker.firstTokenSec')" width="130" />
        <el-table-column prop="elapsedSec" :label="I18nT('ollama.llmChecker.elapsedSec')" width="110" />
        <el-table-column :label="I18nT('ollama.llmChecker.status')" width="110">
          <template #default="scope">
            <el-tag v-if="scope.row.ok" type="success" size="small">{{ I18nT('ollama.llmChecker.ok') }}</el-tag>
            <el-tag v-else type="danger" size="small">{{ I18nT('ollama.llmChecker.fail') }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-card shadow="never" class="mb-3">
        <template #header>
          <div class="flex items-center justify-between">
            <span>{{ I18nT('ollama.llmChecker.liveResourceMonitor') }}</span>
            <div class="flex items-center gap-2">
              <el-switch v-model="state.monitorAuto" />
              <el-button size="small" :loading="state.monitorLoading" @click="refreshMonitor"
                >{{ I18nT('ollama.llmChecker.refresh') }}</el-button
              >
            </div>
          </div>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div>{{ I18nT('ollama.llmChecker.cpu') }}: <b>{{ state.monitor.cpu }}%</b></div>
          <div>{{ I18nT('ollama.llmChecker.ramUsed') }}: <b>{{ state.monitor.ramUsedGB }} GB</b></div>
          <div>{{ I18nT('ollama.llmChecker.ramFree') }}: <b>{{ state.monitor.ramFreeGB }} GB</b></div>
          <div>{{ I18nT('ollama.llmChecker.gpuUtil') }}: <b>{{ state.monitor.gpuUtil }}</b></div>
          <div>{{ I18nT('ollama.llmChecker.gpuMem') }}: <b>{{ state.monitor.gpuMem }}</b></div>
          <div>{{ I18nT('ollama.llmChecker.gpuTemp') }}: <b>{{ state.monitor.gpuTemp }}</b></div>
        </div>
        <div v-if="state.autoBest" class="mt-2 text-xs text-gray-500">
          {{ I18nT('ollama.llmChecker.autoBestModel') }}: <b>{{ state.autoBest }}</b>
        </div>
      </el-card>

      <div class="mb-3 flex flex-wrap gap-3 items-center">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">{{ I18nT('ollama.llmChecker.category') }}</span>
          <el-select v-model="state.modelCategory" style="width: 220px" size="small">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">{{ I18nT('ollama.llmChecker.display') }}</span>
          <el-radio-group v-model="state.modelDisplay" size="small">
            <el-radio-button value="table">{{ I18nT('ollama.llmChecker.table') }}</el-radio-button>
            <el-radio-button value="cards">{{ I18nT('ollama.llmChecker.cards') }}</el-radio-button>
          </el-radio-group>
        </div>
        <el-button size="small" type="primary" :loading="state.fitChecking" @click="checkModelFit">
          {{ I18nT('ollama.llmChecker.quickPcBenchmark') }}
        </el-button>
      </div>

      <div class="mb-3" v-if="state.fitChecking || state.fitChecked">
        <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{{ I18nT('ollama.llmChecker.quickBenchmarkProgress') }}</span>
          <span>{{ state.fitDone }}/{{ state.fitTotal }} ({{ state.fitProgress }}%)</span>
        </div>
        <el-progress :percentage="state.fitProgress" :stroke-width="8" />
        <div class="text-xs text-gray-500 mt-1">
          {{ I18nT('ollama.llmChecker.quickBenchmarkHelp') }}
        </div>
      </div>

      <div v-if="showFamilyFilters" class="mb-3 flex flex-wrap gap-2 items-center">
        <span class="text-xs text-gray-500">{{ I18nT('ollama.llmChecker.modelsFamily') }}</span>
        <el-button
          size="small"
          :type="state.modelFamily === 'all' ? 'primary' : 'default'"
          @click="state.modelFamily = 'all'"
        >
          {{ I18nT('ollama.llmChecker.all') }}
        </el-button>
        <el-button
          v-for="family in familyOptions"
          :key="`family-${family}`"
          size="small"
          :type="state.modelFamily === family ? 'primary' : 'default'"
          @click="state.modelFamily = family"
        >
          {{ family }}
        </el-button>
      </div>

      <el-table
        v-if="state.modelDisplay === 'table'"
        :data="displayedModelRows"
        :border="false"
        style="width: 100%"
        size="small"
        class="compact-fit-table"
      >
        <template #empty>
          <span class="text-xs text-gray-500">{{ I18nT('ollama.llmChecker.tableEmptyHint') }}</span>
        </template>
        <el-table-column prop="category" :label="I18nT('ollama.llmChecker.category')" width="120" />
        <el-table-column prop="family" :label="I18nT('ollama.llmChecker.modelsFamily')" width="110" />
        <el-table-column prop="modelName" :label="I18nT('ollama.llmChecker.modelLabel')" min-width="180">
          <template #default="scope">
            <el-button
              link
              type="primary"
              class="!px-0"
              @click="goToModelLibrary(scope.row.modelName)"
            >
              {{ scope.row.modelName }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column align="center" :label="I18nT('ollama.llmChecker.available')" width="90">
          <template #default="scope">
            <el-tag v-if="scope.row.available" type="success" size="small">{{ I18nT('ollama.llmChecker.installed') }}</el-tag>
            <span v-else class="text-xs text-gray-500">{{ I18nT('ollama.llmChecker.no') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="quant" :label="I18nT('ollama.llmChecker.quant')" width="90" />
        <el-table-column prop="context" :label="I18nT('ollama.llmChecker.context')" width="90" />
        <el-table-column prop="confidence" :label="I18nT('ollama.llmChecker.confidenceShort')" width="85">
          <template #default="scope">
            <el-tag
              size="small"
              :type="
                scope.row.confidence === 'High'
                  ? 'success'
                  : scope.row.confidence === 'Medium'
                    ? 'warning'
                    : 'info'
              "
              >{{ scope.row.confidence }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column prop="expectedTokSec" :label="I18nT('ollama.llmChecker.tokPerSecShort')" width="90" />
        <el-table-column prop="firstToken" :label="I18nT('ollama.llmChecker.firstTokenShort')" width="95" />
        <el-table-column prop="fitLevel" :label="I18nT('ollama.llmChecker.fit')" width="85">
          <template #default="scope">
            <el-tag
              size="small"
              :type="
                scope.row.fitLevel === 'Excellent'
                  ? 'success'
                  : scope.row.fitLevel === 'Medium'
                    ? 'warning'
                    : 'info'
              "
            >
              {{ scope.row.fitLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fitReason" :label="I18nT('ollama.llmChecker.explanation')" min-width="170" />
        <el-table-column :label="I18nT('ollama.llmChecker.features')" min-width="140">
          <template #default="scope">
            <div class="flex flex-wrap gap-1.5">
              <el-tag
                v-for="feat in scope.row.features"
                :key="`${scope.row.category}-${feat}`"
                size="small"
                type="info"
                effect="plain"
                >{{ feat }}</el-tag
              >
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <el-card
          v-for="row in cardRows"
          :key="`card-${row.category}`"
          shadow="never"
          class="category-card"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-medium">{{ row.category }}</span>
              <el-tag size="small" effect="plain">{{ row.context }}</el-tag>
            </div>
          </template>

          <div class="mb-2 text-xs">
            <span class="text-gray-500">{{ I18nT('ollama.llmChecker.expectedTokPerSec') }}:</span>
            <span class="font-medium"> {{ row.expectedTokSec }}</span>
          </div>
          <div class="mb-2 text-xs">
            <span class="text-gray-500">{{ I18nT('ollama.llmChecker.firstToken') }}:</span>
            <span class="font-medium"> {{ row.firstToken }}</span>
          </div>
          <div class="mb-2 text-xs">
            <span class="text-gray-500">{{ I18nT('ollama.llmChecker.quant') }}:</span>
            <span class="font-medium"> {{ row.quant }}</span>
          </div>
          <div class="mb-2 text-xs">
            <span class="text-gray-500">{{ I18nT('ollama.llmChecker.confidence') }}:</span>
            <el-tag
              size="small"
              :type="
                row.confidence === 'High'
                  ? 'success'
                  : row.confidence === 'Medium'
                    ? 'warning'
                    : 'info'
              "
              >{{ row.confidence }}</el-tag
            >
          </div>

          <div class="mb-2">
            <div class="text-xs text-gray-500 mb-1">{{ I18nT('ollama.llmChecker.suggestedModels') }}</div>
            <div class="flex flex-wrap gap-1.5">
              <el-tag
                v-for="name in row.suggested"
                :key="`s-${row.category}-${name}`"
                size="small"
                class="cursor-pointer"
                @click="goToModelLibrary(name)"
              >
                {{ name }}
              </el-tag>
            </div>
          </div>

          <div class="mb-2">
            <div class="text-xs text-gray-500 mb-1">{{ I18nT('ollama.llmChecker.availableOnPc') }}</div>
            <div class="flex flex-wrap gap-1.5">
              <template v-if="row.available.length">
                <el-tag
                  v-for="name in row.available"
                  :key="`a-${row.category}-${name}`"
                  size="small"
                  type="success"
                >
                  {{ name }}
                </el-tag>
              </template>
              <template v-else>
                <span class="text-xs text-gray-500">{{ I18nT('ollama.llmChecker.noLocalMatch') }}</span>
              </template>
            </div>
          </div>

          <div>
            <div class="text-xs text-gray-500 mb-1">{{ I18nT('ollama.llmChecker.suggestedFeatures') }}</div>
            <div class="flex flex-wrap gap-1.5">
              <el-tag
                v-for="feat in row.features"
                :key="`f-${row.category}-${feat}`"
                size="small"
                effect="plain"
                type="info"
              >
                {{ feat }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>
      </template>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, onUnmounted, reactive, watch } from 'vue'
  import { I18nT } from '@lang/index'
  import IPC from '@/util/IPC'
  import { BrewStore } from '@/store/brew'
  import { AppStore } from '@/store/app'
  import { AppModuleSetup } from '@/core/Module'
  import { OllamaModelsSetup } from './models/setup'
  import { OllamaAllModelsSetup } from './models/all/setup'

  type LocalModelItem = {
    name: string
    size?: string
  }

  type CatalogItem = {
    name: string
    size?: string
  }

  const state = reactive<{
    fetching: boolean
    error: string
    localModels: LocalModelItem[]
    catalog: Record<string, CatalogItem[]>
    pcReport: any
    pcReportLoading: boolean
    gpuTab: string
    modelCategory: string
    modelDisplay: 'table' | 'cards'
    modelFamily: string
    fitChecking: boolean
    fitChecked: boolean
    fitProgress: number
    fitTotal: number
    fitDone: number
    fitMap: Record<string, { level: 'Excellent' | 'Medium' | 'Low'; reason: string }>
    benchmarkRunning: boolean
    benchmarkBaseUrl: string
    benchmarkRows: Array<{
      model: string
      ok: boolean
      tokPerSec: number
      firstTokenSec: number
      elapsedSec: number
      error?: string
    }>
    qualityRunning: boolean
    qualityRows: Array<{
      model: string
      coding: number
      documents: number
      chat: number
      vision: number
      total: number
    }>
    lastBenchmarkAt: string
    autoBest: string
    monitorAuto: boolean
    monitorLoading: boolean
    monitor: {
      cpu: number
      ramUsedGB: number
      ramFreeGB: number
      gpuUtil: string
      gpuMem: string
      gpuTemp: string
    }
  }>({
    fetching: false,
    error: '',
    localModels: [],
    catalog: {},
    pcReport: {},
    pcReportLoading: true,
    gpuTab: '0',
    modelCategory: 'all',
    modelDisplay: 'table',
    modelFamily: 'all',
    fitChecking: false,
    fitChecked: false,
    fitProgress: 0,
    fitTotal: 0,
    fitDone: 0,
    fitMap: {},
    benchmarkRunning: false,
    benchmarkBaseUrl: 'http://127.0.0.1:11434',
    benchmarkRows: [],
    qualityRunning: false,
    qualityRows: [],
    lastBenchmarkAt: '',
    autoBest: '',
    monitorAuto: false,
    monitorLoading: false,
    monitor: {
      cpu: 0,
      ramUsedGB: 0,
      ramFreeGB: 0,
      gpuUtil: 'N/A',
      gpuMem: 'N/A',
      gpuTemp: 'N/A'
    }
  })

  const { tab } = AppModuleSetup('ollama')

  const callOllama = async (method: string, ...args: any[]) => {
    return new Promise<any>((resolve, reject) => {
      try {
        IPC.send('app-fork:ollama', method, ...args).then((key: string, res: any) => {
          IPC.off(key)
          resolve(res)
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  const toArr = (v: any) => {
    if (!v) return []
    return Array.isArray(v) ? v : [v]
  }

  const fmtGB = (bytesLike: any) => {
    const n = Number(bytesLike || 0)
    if (!n) return 'Unknown'
    return `${Math.round((n / 1024 / 1024 / 1024) * 100) / 100} GB`
  }

  const fmtFromMiB = (miB: any) => {
    const n = Number(miB || 0)
    if (!n) return 'Unknown'
    return `${Math.round((n / 1024) * 100) / 100} GB`
  }

  const fmtGHzFromMHz = (mhz: any) => {
    const n = Number(mhz || 0)
    if (!n) return 'Unknown'
    return `${Math.round((n / 1000) * 100) / 100} GHz`
  }

  const ddrTypeName = (smbiosType: any, memoryType: any) => {
    const map: Record<number, string> = {
      20: 'DDR',
      21: 'DDR2',
      24: 'DDR3',
      26: 'DDR4',
      34: 'DDR5'
    }
    const sm = Number(smbiosType || 0)
    const mt = Number(memoryType || 0)
    return map[sm] || map[mt] || 'DDR (Unknown Gen)'
  }

  const cleanVendor = (name: string) => {
    const n = (name || '').toLowerCase()
    if (n.includes('nvidia')) return 'NVIDIA'
    if (n.includes('amd') || n.includes('advanced micro devices')) return 'AMD'
    if (n.includes('intel')) return 'Intel'
    return name || 'Unknown'
  }

  const extractModel = (fullName: string, vendor: string) => {
    if (!fullName) return 'Unknown'
    const re = new RegExp(`^${vendor}\\s*`, 'i')
    return fullName.replace(re, '').trim() || fullName
  }

  const inferGpuMemoryType = (raw: any) => {
    const text = `${raw?.Name || ''} ${raw?.VideoProcessor || ''}`
    const t = text.toUpperCase()

    const m = text.match(/(GDDR\dX?|DDR\d|HBM\d?)/i)
    if (m?.[1]) {
      return m[1].toUpperCase()
    }

    // Best-effort inference by common GPU naming families when direct data is missing.
    if (t.includes('QUADRO M')) return 'GDDR5'
    if (t.includes('GTX 9')) return 'GDDR5'
    if (t.includes('GTX 10')) return 'GDDR5'
    if (t.includes('RTX 20')) return 'GDDR6'
    if (t.includes('RTX 30')) return 'GDDR6/GDDR6X'
    if (t.includes('RTX 40')) return 'GDDR6/GDDR6X'
    if (t.includes('RTX A')) return 'GDDR6'

    if (t.includes('RX 4') || t.includes('RX 5')) return 'GDDR5'
    if (t.includes('RX 6') || t.includes('RX 7') || t.includes('RADEON PRO W')) return 'GDDR6'

    if (t.includes('ARC A')) return 'GDDR6'

    return 'DDR?'
  }

  const osDisplay = computed(() => {
    const os = state.pcReport?.os || {}
    const caption = `${os?.Caption || 'Windows'}`
    const build = `${os?.BuildNumber || ''}`
    const arch = `${window.Server?.Arch || os?.OSArchitecture || 'Unknown'}`
    let winVer = ''
    const b = Number(build || 0)
    if (caption.toLowerCase().includes('windows')) {
      if (caption.includes('11') || b >= 22000) winVer = '11'
      else if (caption.includes('10') || b >= 10240) winVer = '10'
      else if (caption.includes('8.1')) winVer = '8.1'
      else if (caption.includes('8')) winVer = '8'
      else if (caption.includes('7')) winVer = '7'
    }
    const buildPart = build ? ` (Build ${build})` : ''
    if (winVer) {
      return `Windows ${winVer}${buildPart} ${arch}`
    }
    return `${caption}${buildPart} ${arch}`
  })

  const cpuInfoText = computed(() => {
    const cpu = toArr(state.pcReport?.cpu)
    if (!cpu.length) {
      const fallback = navigator.hardwareConcurrency || '-'
      return {
        model: 'Unknown',
        processorsCount: 1,
        formula: `1 * ${fallback} cores = ${fallback}`,
        threads: `${fallback} * 1 = ${fallback}`
        ,
        logicalProcessors: `${fallback}`,
        speed: 'Unknown'
      }
    }
    const sockets = cpu.length
    const totalCores = cpu.reduce((s: number, c: any) => s + Number(c?.NumberOfCores || 0), 0)
    const totalThreads = cpu.reduce(
      (s: number, c: any) => s + Number(c?.NumberOfLogicalProcessors || 0),
      0
    )
    const totalMhz = cpu.reduce((s: number, c: any) => s + Number(c?.MaxClockSpeed || 0), 0)
    const coresPerSocket = Math.round((totalCores / sockets) * 100) / 100
    const threadsPerCore = totalCores ? Math.round((totalThreads / totalCores) * 100) / 100 : 0
    return {
      model: `${cpu?.[0]?.Name || 'Unknown'}`,
      processorsCount: sockets,
      formula: `${sockets} * ${coresPerSocket} cores = ${totalCores}`,
      threads: `${totalCores} * ${threadsPerCore} = ${totalThreads}`,
      logicalProcessors: `${totalThreads}`,
      speed: fmtGHzFromMHz(sockets ? totalMhz / sockets : 0)
    }
  })

  const ramInfoText = computed(() => {
    const mods = toArr(state.pcReport?.memory)
    const arrays = toArr(state.pcReport?.memoryArray)
    const totalSlots = Number(arrays?.[0]?.MemoryDevices || 0) || mods.length
    const installed = mods.length
    const total = mods.reduce((s: number, m: any) => s + Number(m?.Capacity || 0), 0)
    const speed = Number(mods?.[0]?.ConfiguredClockSpeed || mods?.[0]?.Speed || 0)
    const ddr = ddrTypeName(mods?.[0]?.SMBIOSMemoryType, mods?.[0]?.MemoryType)
    if (!installed) {
      return `Unknown`
    }
    const sameSize = mods.every((m: any) => Number(m?.Capacity || 0) === Number(mods[0]?.Capacity || 0))
    const sizeExpr = sameSize
      ? `${installed} * ${fmtGB(mods[0]?.Capacity)}`
      : mods.map((m: any) => fmtGB(m?.Capacity)).join(' + ')
    const speedText = speed ? ` @ ${speed} MHz` : ''
    return `${totalSlots} slots (${installed} installed): ${sizeExpr} = ${fmtGB(total)} ${ddr}${speedText}`
  })

  const gpuRows = computed(() => {
    const gpus = toArr(state.pcReport?.gpu)
    const nvidia = toArr(state.pcReport?.nvidia)
    return gpus
      .map((g: any) => {
        const vendor = cleanVendor(`${g?.AdapterCompatibility || ''}`)
        const model = extractModel(`${g?.Name || ''}`, vendor)
        const h = Number(g?.CurrentHorizontalResolution || 0)
        const v = Number(g?.CurrentVerticalResolution || 0)
        let vram = fmtGB(g?.AdapterRAM)
        let ramType = inferGpuMemoryType(g)

        if (vendor === 'NVIDIA' && nvidia.length > 0) {
          const nrow = nvidia.find((n: any) => {
            const a = `${n?.Name || ''}`.toLowerCase()
            const b = `${g?.Name || ''}`.toLowerCase()
            return a.includes(b) || b.includes(a)
          })
          if (nrow?.MemoryTotalMiB) {
            vram = fmtFromMiB(nrow.MemoryTotalMiB)
          }
        }

        return {
          cardName: `${vendor} ${model}`.trim(),
          vendor,
          model,
          vram: `${vram} ${ramType}`.trim(),
          driverVersion: `${g?.DriverVersion || 'Unknown'}`,
          resolution: h && v ? `${h}x${v}` : 'Unknown',
          processor: `${g?.VideoProcessor || 'Unknown'}`
        }
      })
      .filter((g: any) => g.vendor !== 'Unknown' || g.model !== 'Unknown')
  })

  const appStore = AppStore()
  const brewStore = BrewStore()

  const currentService = computed(() => {
    const current = appStore.config.server?.ollama?.current
    return brewStore
      .module('ollama')
      .installed.find((o) => o.path === current?.path && o.version === current?.version)
  })

  const ollamaServiceRunning = computed(() => {
    return !!currentService.value?.run
  })

  const goToOllamaServiceTab = () => {
    tab.value = 0
  }

  const goToModelLibrary = (modelName: string) => {
    const keyword = `${modelName || ''}`.trim()
    if (!keyword) return
    tab.value = 2
    OllamaModelsSetup.tab = 'all'
    OllamaAllModelsSetup.search = keyword
  }

  const localModelsCount = computed(() => state.localModels.length)

  const totalSystemRamGB = computed(() => {
    const mods = toArr(state.pcReport?.memory)
    const total = mods.reduce((s: number, m: any) => s + Number(m?.Capacity || 0), 0)
    if (!total) return 0
    return Math.round((total / 1024 / 1024 / 1024) * 100) / 100
  })

  const maxGpuVramGB = computed(() => {
    let max = 0
    const nvidia = toArr(state.pcReport?.nvidia)
    nvidia.forEach((row: any) => {
      const gb = Number(row?.MemoryTotalMiB || 0) / 1024
      if (gb > max) max = gb
    })
    if (max > 0) return Math.round(max * 100) / 100

    const gpus = toArr(state.pcReport?.gpu)
    gpus.forEach((g: any) => {
      const gb = Number(g?.AdapterRAM || 0) / 1024 / 1024 / 1024
      if (gb > max) max = gb
    })
    return Math.round(max * 100) / 100
  })

  const performanceTier = computed(() => {
    const ram = totalSystemRamGB.value
    const vram = maxGpuVramGB.value
    const logical = Number(cpuInfoText.value.logicalProcessors || 0)

    if (vram >= 16 || (ram >= 64 && logical >= 24)) {
      return {
        key: 'high',
        label: 'High',
        maxVramText: vram ? `${vram} GB` : 'Unknown',
        systemRamText: ram ? `${ram} GB` : 'Unknown',
        tok: '35 - 90',
        firstToken: '0.25 - 0.8s',
        quant: 'Q6_K / Q8_0',
        context: '16K - 32K'
      }
    }
    if (vram >= 8 || (ram >= 32 && logical >= 12)) {
      return {
        key: 'mid',
        label: 'Balanced',
        maxVramText: vram ? `${vram} GB` : 'Unknown',
        systemRamText: ram ? `${ram} GB` : 'Unknown',
        tok: '18 - 45',
        firstToken: '0.5 - 1.4s',
        quant: 'Q4_K_M / Q5_K_M',
        context: '8K - 16K'
      }
    }
    return {
      key: 'low',
      label: 'Entry',
      maxVramText: vram ? `${vram} GB` : 'Unknown',
      systemRamText: ram ? `${ram} GB` : 'Unknown',
      tok: '6 - 20',
      firstToken: '1.2 - 3.5s',
      quant: 'Q4_K_M / Q3_K_M',
      context: '4K - 8K'
    }
  })

  const quantRecommendation = computed(() => {
    const vram = maxGpuVramGB.value
    const ram = totalSystemRamGB.value
    if (vram >= 20 || ram >= 64) {
      return {
        quant: 'Q6_K / Q8_0',
        reason: 'High VRAM/RAM profile: prioritize quality with larger quantization.'
      }
    }
    if (vram >= 8 || ram >= 24) {
      return {
        quant: 'Q4_K_M / Q5_K_M',
        reason: 'Balanced profile: best speed/quality trade-off.'
      }
    }
    return {
      quant: 'Q3_K_M / Q4_K_M',
      reason: 'Entry profile: lower memory pressure and better stability.'
    }
  })

  const contextSafetyRows = computed(() => {
    const vram = maxGpuVramGB.value
    const ram = totalSystemRamGB.value
    const k = (n: number) => `${n}K`
    const calc = (base: number, risk: number, note: string) => ({
      safeContext: k(base),
      riskyContext: k(risk),
      note
    })

    if (vram >= 20 || ram >= 64) {
      return [
        { modelClass: '7B', ...calc(24, 64, 'Usually stable for long context prompts.') },
        { modelClass: '14B', ...calc(16, 32, 'Watch VRAM if vision/multimodal is enabled.') },
        { modelClass: '32B', ...calc(8, 16, 'Prefer higher quant and monitor VRAM.') }
      ]
    }
    if (vram >= 8 || ram >= 24) {
      return [
        { modelClass: '7B', ...calc(12, 24, 'Good default for coding and chat.') },
        { modelClass: '14B', ...calc(8, 16, 'Use Q4/Q5 for stability.') },
        { modelClass: '32B', ...calc(4, 8, 'May fallback to CPU or slow significantly.') }
      ]
    }
    return [
      { modelClass: '7B', ...calc(8, 12, 'Prefer compact prompts and chunked RAG.') },
      { modelClass: '14B', ...calc(4, 8, 'Only with aggressive quantization.') },
      { modelClass: '32B', ...calc(2, 4, 'Not recommended for daily usage on this profile.') }
    ]
  })

  const machineHint = computed(() => {
    const ramText = ramInfoText.value
    const hasDDR5 = ramText.toLowerCase().includes('ddr5')
    const hasDDR4 = ramText.toLowerCase().includes('ddr4')
    const lowRam = ramText.includes('= 8 GB') || ramText.includes('= 4 GB')
    if (lowRam) {
      return 'Device profile: low memory capacity. Suggested: start with 3B-7B models, then scale up after latency checks.'
    }
    if (hasDDR5) {
      return 'Device profile: high-speed memory (DDR5). Suggested: start with 14B and move higher based on latency.'
    }
    if (hasDDR4) {
      return 'Device profile: balanced. Suggested: 7B-14B models for good quality/performance trade-off.'
    }
    return 'Device profile: lightweight. Suggested: 3B-7B models for better speed and lower memory pressure.'
  })

  const summaryItems = computed(() => [
    { key: 'OS', value: osDisplay.value },
    { key: 'PC Provider', value: `${state.pcReport?.computer?.Manufacturer || 'Unknown'}` },
    { key: 'PC Model', value: `${state.pcReport?.computer?.Model || 'Unknown'}` },
    { key: 'Processor', value: cpuInfoText.value.model },
    { key: 'Processors Count', value: `${cpuInfoText.value.processorsCount}` },
    { key: 'CPU Speed', value: cpuInfoText.value.speed },
    { key: 'CPU', value: cpuInfoText.value.formula },
    { key: 'Logical Processors', value: cpuInfoText.value.logicalProcessors },
    { key: 'Threads', value: cpuInfoText.value.threads },
    { key: 'PC RAM', value: ramInfoText.value },
    { key: 'Local Models', value: `${localModelsCount.value}` }
  ])

  const allCatalogNames = computed(() => {
    const names: string[] = []
    Object.values(state.catalog).forEach((arr) => {
      arr.forEach((item) => {
        if (item?.name) names.push(item.name)
      })
    })
    return Array.from(new Set(names))
  })

  const normalize = (name: string) => name.toLowerCase()

  const parseSizeToGB = (sizeText?: string) => {
    const text = `${sizeText || ''}`.trim().toUpperCase()
    if (!text) return 0
    const m = text.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB|TB)/)
    if (!m) return 0
    const value = Number(m[1] || 0)
    const unit = m[2]
    if (!value) return 0
    if (unit === 'TB') return value * 1024
    if (unit === 'GB') return value
    if (unit === 'MB') return value / 1024
    if (unit === 'KB') return value / 1024 / 1024
    return 0
  }

  const catalogSizeGBMap = computed(() => {
    const map: Record<string, number> = {}
    Object.values(state.catalog).forEach((arr) => {
      arr.forEach((item) => {
        const key = normalize(`${item?.name || ''}`)
        if (!key) return
        const sizeGB = parseSizeToGB(item?.size)
        if (sizeGB > 0) {
          map[key] = sizeGB
        }
      })
    })
    return map
  })

  const inferQuantFromModelName = (name: string) => {
    const n = `${name || ''}`.toUpperCase()
    if (n.includes('Q8')) return 'Q8'
    if (n.includes('Q6')) return 'Q6'
    if (n.includes('Q5')) return 'Q5'
    if (n.includes('Q4')) return 'Q4'
    if (n.includes('Q3')) return 'Q3'
    return 'Q4'
  }

  const quantFactorByName = (q: string) => {
    if (q === 'Q8') return 1
    if (q === 'Q6') return 0.8
    if (q === 'Q5') return 0.7
    if (q === 'Q4') return 0.55
    if (q === 'Q3') return 0.45
    return 0.65
  }

  const modelSizeFromName = (name: string) => {
    const m = `${name || ''}`.match(/(\d+(?:\.\d+)?)\s*b/i)
    return Number(m?.[1] || 0)
  }

  const estimateNeedVramFromName = (name: string) => {
    const sizeB = modelSizeFromName(name)
    if (!sizeB) return 0
    const q = inferQuantFromModelName(name)
    let need = sizeB * 1.15 * quantFactorByName(q) + 1.3
    if (/vision|vl|llava|moondream|bakllava/i.test(name)) {
      need += 1.5
    }
    return Math.round(need * 100) / 100
  }

  const modelFitsCurrentGpuBudget = (name: string) => {
    const vram = maxGpuVramGB.value
    if (!vram) return true

    const sizeGB = catalogSizeGBMap.value[normalize(name)] || 0
    if (sizeGB > 0) {
      // For GPU-optimized suggestions, require model artifact size to be within GPU VRAM budget.
      return sizeGB <= vram
    }

    const need = estimateNeedVramFromName(name)
    if (!need) return false
    return need <= vram * 1.1
  }

  const pickByKeywords = (keywords: string[]) => {
    const result = allCatalogNames.value.filter((name) => {
      const n = normalize(name)
      return keywords.some((k) => n.includes(k))
    })
    const fitted = result.filter((name) => modelFitsCurrentGpuBudget(name))
    return fitted.slice(0, 5)
  }

  const hasLocalMatch = (target: string) => {
    const t = normalize(target)
    return state.localModels.some((model) => {
      const n = normalize(model.name)
      return n === t || n.startsWith(`${t}:`) || t.startsWith(`${n}:`)
    })
  }

  const confidenceScore = (modelName: string) => {
    const hasBench = state.benchmarkRows.some((b) => b.model === modelName && b.ok)
    const hasHw = !!state.pcReport?.cpu && !!state.pcReport?.memory
    const hasGpu = toArr(state.pcReport?.gpu).length > 0

    if (hasBench && hasHw && hasGpu) return 'High'
    if ((hasBench && hasHw) || (hasHw && hasGpu)) return 'Medium'
    return 'Low'
  }

  const modelFamily = (name: string) => {
    let base = `${name || ''}`.toLowerCase().trim()
    if (base.includes('/')) {
      const arr = base.split('/')
      base = arr[arr.length - 1]
    }
    base = base.split(':')[0]
    const family = base.split(/[-_]/)[0]
    return family || base || 'unknown'
  }

  const categoryRows = computed(() => {
    const tier = performanceTier.value
    const rows = [
      {
        category: I18nT('ollama.llmChecker.categoryCoding'),
        suggested: pickByKeywords(['coder', 'code', 'codellama', 'deepseek-coder', 'starcoder']),
        features: ['Fill-in-middle', 'Long context', 'Tool call'],
        context: tier.context,
        quant: tier.quant,
        expectedTokSec: tier.tok,
        firstToken: tier.firstToken
      },
      {
        category: I18nT('ollama.llmChecker.categoryDocuments'),
        suggested: pickByKeywords(['embed', 'bge', 'nomic-embed', 'mxbai', 'e5', 'minilm']),
        features: ['Embeddings', 'Rerank', 'Citation style'],
        context: tier.key === 'low' ? '4K - 8K' : '8K - 32K',
        quant: tier.key === 'high' ? 'Q8_0' : 'Q4_K_M',
        expectedTokSec: tier.key === 'high' ? '120 - 600 (embed/s)' : '50 - 250 (embed/s)',
        firstToken: 'N/A'
      },
      {
        category: I18nT('ollama.llmChecker.categoryGeneralChat'),
        suggested: pickByKeywords(['llama', 'qwen', 'gemma', 'mistral', 'phi']),
        features: ['Reasoning', 'JSON mode', 'Multilingual'],
        context: tier.context,
        quant: tier.quant,
        expectedTokSec: tier.tok,
        firstToken: tier.firstToken
      },
      {
        category: I18nT('ollama.llmChecker.categoryVision'),
        suggested: pickByKeywords(['vision', 'llava', 'moondream', 'bakllava', 'vl']),
        features: ['Image input', 'OCR', 'Chart QA'],
        context: tier.key === 'low' ? '4K - 8K' : '8K - 16K',
        quant: tier.key === 'high' ? 'Q5_K_M / Q6_K' : 'Q4_K_M',
        expectedTokSec: tier.key === 'high' ? '12 - 35' : '5 - 18',
        firstToken: tier.key === 'high' ? '0.6 - 1.8s' : '1.5 - 4.0s'
      }
    ]
    return rows.map((row) => {
      const fallback = row.suggested.length ? row.suggested : ['No catalog match']
      const sampleModel = row.suggested?.[0] || ''
      return {
        category: row.category,
        suggested: fallback,
        available: row.suggested.filter((name) => hasLocalMatch(name)),
        confidence: sampleModel && sampleModel !== 'No catalog match' ? confidenceScore(sampleModel) : 'Low',
        quant: row.quant,
        context: row.context,
        expectedTokSec: row.expectedTokSec,
        firstToken: row.firstToken,
        features: row.features
      }
    })
  })

  const categoryOptions = computed(() => {
    const base = [{ label: I18nT('ollama.llmChecker.allCategories'), value: 'all' }]
    const items = categoryRows.value.map((row) => ({
      label: row.category,
      value: row.category
    }))
    return [...base, ...items]
  })

  const filteredCategoryRows = computed(() => {
    if (state.modelCategory === 'all') {
      return categoryRows.value
    }
    return categoryRows.value.filter((row) => row.category === state.modelCategory)
  })

  const categoryFilteredModelRows = computed(() => {
    const rows: any[] = []
    filteredCategoryRows.value.forEach((row) => {
      row.suggested
        .filter((name: string) => name && name !== 'No catalog match')
        .forEach((name: string) => {
          rows.push({
            category: row.category,
            family: modelFamily(name),
            modelName: name,
            available: hasLocalMatch(name),
            confidence: confidenceScore(name),
            quant: row.quant,
            context: row.context,
            expectedTokSec: row.expectedTokSec,
            firstToken: row.firstToken,
            features: row.features
          })
        })
    })
    return rows
  })

  const allCategoryModelRows = computed(() => {
    const rows: any[] = []
    categoryRows.value.forEach((row) => {
      row.suggested
        .filter((name: string) => name && name !== 'No catalog match')
        .forEach((name: string) => {
          rows.push({
            category: row.category,
            family: modelFamily(name),
            modelName: name,
            available: hasLocalMatch(name),
            confidence: confidenceScore(name),
            quant: row.quant,
            context: row.context,
            expectedTokSec: row.expectedTokSec,
            firstToken: row.firstToken,
            features: row.features
          })
        })
    })
    return rows
  })

  const showFamilyFilters = computed(() => {
    return state.fitChecked && categoryFilteredModelRows.value.length > 0
  })

  const familyOptions = computed(() => {
    if (!showFamilyFilters.value) {
      return []
    }
    const all = categoryFilteredModelRows.value.map((r) => r.family)
    return Array.from(new Set(all))
  })

  const filteredModelRows = computed(() => {
    if (state.modelFamily === 'all') {
      return categoryFilteredModelRows.value
    }
    return categoryFilteredModelRows.value.filter((row) => row.family === state.modelFamily)
  })

  const displayedModelRows = computed(() => {
    if (!state.fitChecked) {
      return []
    }
    return filteredModelRows.value.map((row) => {
      const fit = state.fitMap[row.modelName] || {
        level: 'Low' as const,
        reason: I18nT('ollama.llmChecker.fitNoEvidence')
      }
      return {
        ...row,
        fitLevel: fit.level,
        fitReason: fit.reason
      }
    })
  })

  const cardRows = computed(() => {
    return filteredCategoryRows.value
      .map((row) => {
        const suggested =
          state.modelFamily === 'all'
            ? row.suggested
            : row.suggested.filter((name: string) => modelFamily(name) === state.modelFamily)
        const available = row.available.filter((name: string) => suggested.includes(name))
        const sampleModel = suggested.find((name: string) => name && name !== 'No catalog match') || ''
        return {
          ...row,
          suggested,
          available,
          confidence: sampleModel ? confidenceScore(sampleModel) : 'Low'
        }
      })
      .filter((row) => row.suggested.length)
  })

  watch(
    () => state.modelCategory,
    () => {
      state.modelFamily = 'all'
    }
  )

  watch(
    () => showFamilyFilters.value,
    (visible) => {
      if (!visible) {
        state.modelFamily = 'all'
      }
    }
  )

  watch(
    () => state.benchmarkBaseUrl,
    () => {
      saveBenchmarkCache()
    }
  )

  const modelScore = (row: any) => {
    const hasBench = state.benchmarkRows.find((b) => b.model === row.modelName && b.ok)
    if (hasBench) {
      return hasBench.tokPerSec * 2 - hasBench.firstTokenSec
    }
    const tok = `${row.expectedTokSec || ''}`.split('-')[0]?.replace(/[^0-9.]/g, '')
    return Number(tok || 0)
  }

  const quantFactor = (q: string) => {
    const text = `${q || ''}`.toUpperCase()
    if (text.includes('Q8')) return 1
    if (text.includes('Q6')) return 0.8
    if (text.includes('Q5')) return 0.7
    if (text.includes('Q4')) return 0.55
    if (text.includes('Q3')) return 0.45
    return 0.65
  }

  const extractModelSizeB = (modelName: string) => {
    const m = `${modelName || ''}`.match(/(\d+(?:\.\d+)?)\s*b/i)
    return Number(m?.[1] || 7)
  }

  const estimateNeedVramGB = (modelName: string, quant: string) => {
    const sizeB = extractModelSizeB(modelName)
    const factor = quantFactor(quant)
    // Rough sizing for GGUF-like memory footprint + runtime overhead.
    return Math.round((sizeB * 1.15 * factor + 1.3) * 100) / 100
  }

  const evaluateFit = (row: any) => {
    const bench = state.benchmarkRows.find((b) => b.model === row.modelName && b.ok)
    if (bench) {
      if (bench.tokPerSec >= 25 && bench.firstTokenSec <= 1.2) {
        return {
          level: 'Excellent' as const,
          reason: I18nT('ollama.llmChecker.fitBenchExcellent', {
            tok: bench.tokPerSec.toFixed(1),
            first: bench.firstTokenSec.toFixed(2)
          })
        }
      }
      if (bench.tokPerSec >= 10 && bench.firstTokenSec <= 2.5) {
        return {
          level: 'Medium' as const,
          reason: I18nT('ollama.llmChecker.fitBenchMedium', {
            tok: bench.tokPerSec.toFixed(1),
            first: bench.firstTokenSec.toFixed(2)
          })
        }
      }
      return {
        level: 'Low' as const,
        reason: I18nT('ollama.llmChecker.fitBenchLow', {
          tok: bench.tokPerSec.toFixed(1),
          first: bench.firstTokenSec.toFixed(2)
        })
      }
    }

    const vram = maxGpuVramGB.value
    const need = estimateNeedVramGB(row.modelName, row.quant)
    const ratio = vram > 0 ? vram / need : 0
    const isInstalled = !!row.available

    const fromEstimate = (level: 'Excellent' | 'Medium' | 'Low', text: string) => {
      if (isInstalled) {
        return {
          level,
          reason: `${text} ${I18nT('ollama.llmChecker.fitInstalledSuffix')}`
        }
      }
      if (level === 'Excellent') {
        return {
          level: 'Medium' as const,
          reason: `${text} ${I18nT('ollama.llmChecker.fitNotInstalledDowngrade')}`
        }
      }
      return {
        level,
        reason: `${text} ${I18nT('ollama.llmChecker.fitNotInstalledEstimate')}`
      }
    }

    if (ratio >= 1.35) {
      return fromEstimate(
        'Excellent',
        I18nT('ollama.llmChecker.fitEstimatedStrong', { vram, need })
      )
    }
    if (ratio >= 1.0) {
      return fromEstimate(
        'Medium',
        I18nT('ollama.llmChecker.fitEstimatedAcceptable', { vram, need })
      )
    }
    return fromEstimate(
      'Low',
      I18nT('ollama.llmChecker.fitEstimatedHighPressure', { vram, need })
    )
  }

  const checkModelFit = async () => {
    if (state.fitChecking) return
    state.fitChecking = true
    state.fitProgress = 0
    state.fitDone = 0
    state.fitTotal = 0
    try {
      const nextMap: Record<string, { level: 'Excellent' | 'Medium' | 'Low'; reason: string }> = {}
      const allRows = allCategoryModelRows.value
      const uniqueRows = allRows.filter(
        (row, idx) => allRows.findIndex((r) => r.modelName === row.modelName) === idx
      )
      state.fitTotal = uniqueRows.length

      for (const row of uniqueRows) {
        nextMap[row.modelName] = evaluateFit(row)
        state.fitDone += 1
        state.fitProgress = state.fitTotal
          ? Math.round((state.fitDone / state.fitTotal) * 100)
          : 0
        if (state.fitDone % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }
      state.fitMap = nextMap
      state.fitChecked = true
    } finally {
      state.fitProgress = state.fitTotal ? 100 : 0
      state.fitChecking = false
    }
  }

  const BENCH_KEY = 'flyenv-llm-checker-bench'
  const QUALITY_KEY = 'flyenv-llm-checker-quality'

  const loadBenchmarkCache = () => {
    try {
      const raw = localStorage.getItem(BENCH_KEY)
      if (!raw) return
      const json = JSON.parse(raw)
      if (Array.isArray(json?.rows)) {
        state.benchmarkRows = json.rows
      }
      if (json?.baseUrl) {
        state.benchmarkBaseUrl = json.baseUrl
      }
      if (json?.lastBenchmarkAt) {
        state.lastBenchmarkAt = json.lastBenchmarkAt
      }
    } catch {}
  }

  const saveBenchmarkCache = () => {
    try {
      localStorage.setItem(
        BENCH_KEY,
        JSON.stringify({
          rows: state.benchmarkRows,
          baseUrl: state.benchmarkBaseUrl,
          lastBenchmarkAt: state.lastBenchmarkAt
        })
      )
    } catch {}
  }

  const loadQualityCache = () => {
    try {
      const raw = localStorage.getItem(QUALITY_KEY)
      if (!raw) return
      const json = JSON.parse(raw)
      if (Array.isArray(json?.rows)) {
        state.qualityRows = json.rows
      }
    } catch {}
  }

  const saveQualityCache = () => {
    try {
      localStorage.setItem(
        QUALITY_KEY,
        JSON.stringify({
          rows: state.qualityRows
        })
      )
    } catch {}
  }

  const autoPickBest = () => {
    if (!filteredModelRows.value.length) {
      state.autoBest = ''
      return
    }
    const sorted = [...filteredModelRows.value].sort((a, b) => modelScore(b) - modelScore(a))
    state.autoBest = sorted[0]?.modelName || ''
  }

  const runBenchmark = async () => {
    if (state.benchmarkRunning) return
    const local = state.localModels.map((m) => m.name).filter(Boolean)
    if (!local.length) return

    state.benchmarkRunning = true
    state.benchmarkRows = []
    try {
      for (const model of local) {
        const res = await callOllama('benchmarkModel', model, state.benchmarkBaseUrl)
        const row = res?.data || {}
        state.benchmarkRows.push({
          model,
          ok: !!row?.ok,
          tokPerSec: Number(row?.tokPerSec || 0),
          firstTokenSec: Number(row?.firstTokenSec || 0),
          elapsedSec: Number(row?.elapsedSec || 0),
          error: row?.error
        })
      }
      state.lastBenchmarkAt = new Date().toLocaleString()
      saveBenchmarkCache()
      autoPickBest()
    } finally {
      state.benchmarkRunning = false
    }
  }

  const scoreCoding = (txt: string) => {
    let score = 40
    if (/function|class|def|const\s+\w+\s*=\s*\(/i.test(txt)) score += 25
    if (/test|assert|example/i.test(txt)) score += 20
    if (txt.length > 180) score += 15
    return Math.min(score, 100)
  }

  const scoreDocuments = (txt: string) => {
    let score = 35
    if ((txt.match(/\n-/g) || []).length >= 2 || /\d\./.test(txt)) score += 30
    if (/summary|key|important|point/i.test(txt)) score += 20
    if (txt.length > 150) score += 15
    return Math.min(score, 100)
  }

  const scoreChat = (txt: string) => {
    let score = 45
    if (/thanks|sure|help|let's|يمكن|أكيد|تمام/i.test(txt)) score += 25
    if (txt.length > 120) score += 15
    if (/\?|\!/.test(txt)) score += 15
    return Math.min(score, 100)
  }

  const scoreVision = (txt: string, model: string) => {
    let score = /vision|llava|vl|moondream|bakllava/i.test(model) ? 65 : 40
    if (/image|caption|visual|ocr/i.test(txt)) score += 25
    if (txt.length > 80) score += 10
    return Math.min(score, 100)
  }

  const runQualityCheck = async () => {
    if (state.qualityRunning) return
    const models = state.localModels.map((m) => m.name).filter(Boolean).slice(0, 6)
    if (!models.length) return

    const prompts = {
      coding: 'Write a short function and one test case to validate it.',
      documents: 'Summarize this idea in bullet points: local model deployment best practices.',
      chat: 'Reply with a friendly concise answer: how can I start learning AI engineering?',
      vision: 'In one sentence, explain what makes a good image caption.'
    }

    state.qualityRunning = true
    state.qualityRows = []
    try {
      for (const model of models) {
        const [c, d, ch, v] = await Promise.all([
          callOllama('quickGenerate', model, prompts.coding, state.benchmarkBaseUrl),
          callOllama('quickGenerate', model, prompts.documents, state.benchmarkBaseUrl),
          callOllama('quickGenerate', model, prompts.chat, state.benchmarkBaseUrl),
          callOllama('quickGenerate', model, prompts.vision, state.benchmarkBaseUrl)
        ])

        const coding = scoreCoding(`${c?.data?.response || ''}`)
        const documents = scoreDocuments(`${d?.data?.response || ''}`)
        const chat = scoreChat(`${ch?.data?.response || ''}`)
        const vision = scoreVision(`${v?.data?.response || ''}`, model)
        const total = Math.round((coding + documents + chat + vision) / 4)
        state.qualityRows.push({ model, coding, documents, chat, vision, total })
      }
      state.qualityRows.sort((a, b) => b.total - a.total)
      saveQualityCache()
    } finally {
      state.qualityRunning = false
    }
  }

  const refreshMonitor = async () => {
    state.monitorLoading = true
    try {
      const res = await callOllama('resourceSnapshot')
      const data = res?.data || {}
      const gpu = Array.isArray(data?.gpu) && data.gpu.length ? data.gpu[0] : undefined
      state.monitor.cpu = Number(data?.cpu || 0)
      state.monitor.ramUsedGB = Number(data?.ram?.usedGB || 0)
      state.monitor.ramFreeGB = Number(data?.ram?.freeGB || 0)
      state.monitor.gpuUtil = gpu ? `${gpu?.Utilization ?? 0}%` : 'N/A'
      state.monitor.gpuMem =
        gpu && gpu?.MemoryTotalMiB
          ? `${Math.round((Number(gpu.MemoryUsedMiB || 0) / 1024) * 100) / 100}/${Math.round((Number(gpu.MemoryTotalMiB || 0) / 1024) * 100) / 100} GB`
          : 'N/A'
      state.monitor.gpuTemp = gpu && gpu?.TemperatureC ? `${gpu.TemperatureC} C` : 'N/A'
    } finally {
      state.monitorLoading = false
    }
  }

  let monitorTimer: ReturnType<typeof setInterval> | undefined
  watch(
    () => state.monitorAuto,
    (on) => {
      if (monitorTimer) {
        clearInterval(monitorTimer)
        monitorTimer = undefined
      }
      if (on) {
        refreshMonitor().then().catch()
        monitorTimer = setInterval(() => {
          refreshMonitor().then().catch()
        }, 5000)
      }
    }
  )

  const fetchLocalModels = async () => {
    const brewStore = BrewStore()
    const appStore = AppStore()
    await brewStore.module('ollama').fetchInstalled()

    const current = appStore.config.server?.ollama?.current
    const service = brewStore
      .module('ollama')
      .installed.find((o) => o.path === current?.path && o.version === current?.version)

    if (!service) {
      state.localModels = []
      return
    }
    const res = await callOllama('allModel', JSON.parse(JSON.stringify(service)))
    state.localModels = res?.data ?? []
  }

  const fetchCatalog = async () => {
    const res = await callOllama('fetchAllModels')
    state.catalog = res?.data ?? {}
  }

  const fetchPcReport = async () => {
    state.pcReportLoading = true
    try {
      const res = await callOllama('pcReport')
      state.pcReport = res?.data ?? {}
    } finally {
      state.pcReportLoading = false
    }
  }

  const refresh = async () => {
    state.fetching = true
    state.error = ''
    try {
      await Promise.all([fetchLocalModels(), fetchCatalog(), fetchPcReport()])
    } catch (e: any) {
      state.error = e?.message || I18nT('ollama.llmChecker.loadingCheckerFailed')
    } finally {
      state.fetching = false
    }
  }

  watch(
    () => filteredModelRows.value,
    () => {
      autoPickBest()
    },
    { deep: true }
  )

  onMounted(() => {
    loadBenchmarkCache()
    loadQualityCache()
    refresh().then().catch()
    refreshMonitor().then().catch()
    autoPickBest()
  })

  onUnmounted(() => {
    if (monitorTimer) {
      clearInterval(monitorTimer)
      monitorTimer = undefined
    }
  })
</script>

<style lang="scss" scoped>
  .compact-fit-table {
    :deep(.el-table__cell) {
      padding: 6px 6px;
      font-size: 12px;
    }

    :deep(.cell) {
      white-space: normal;
      word-break: break-word;
      line-height: 1.25;
    }
  }
</style>

<style scoped>
  .pc-report-loading {
    border: 1px dashed rgba(148, 163, 184, 0.35);
    border-radius: 8px;
    padding: 12px;
    background: rgba(30, 41, 59, 0.18);
  }

  .pc-report-loading-title {
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 10px;
  }

  .pc-report-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 8px;
  }

  .model-fit-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 8px;
  }

  @media (min-width: 768px) {
    .pc-report-skeleton-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 20px;
    }

    .model-fit-skeleton-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px 14px;
    }
  }

  .summary-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .summary-key {
    color: #6b7280;
    min-width: 120px;
  }
  .summary-value {
    word-break: break-all;
  }
</style>
