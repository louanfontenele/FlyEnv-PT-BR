<template>
  <li
    v-if="showItem !== false"
    :class="'non-draggable' + (currentPage === '/caddy' ? ' active' : '')"
    @click="nav"
  >
    <div class="left">
      <div class="icon-block" :class="{ run: serviceRunning }">
        <yb-icon :svg="import('@/svg/caddy.svg?raw')" style="padding: 5px" width="28" height="28" />
      </div>
      <span class="title">Caddy</span>
    </div>

    <el-switch
      v-model="serviceRunning"
      :disabled="serviceDisabled"
      @click.stop="stopNav"
      @change="switchChange()"
    >
    </el-switch>
  </li>
</template>

<script lang="ts" setup>
  import { AsideSetup, AppServiceModule } from '@web/core/ASide'

  const {
    showItem,
    serviceDisabled,
    serviceFetching,
    serviceRunning,
    currentPage,
    groupDo,
    switchChange,
    nav,
    stopNav
  } = AsideSetup('caddy')

  AppServiceModule.caddy = {
    groupDo,
    switchChange,
    serviceRunning,
    serviceFetching,
    serviceDisabled,
    showItem
  } as any
</script>
