import { defineAsyncComponent } from 'vue'
import type { AppModuleItem } from '@/core/type'

const module: AppModuleItem = {
  moduleType: 'webServer',
  typeFlag: 'frankenphp',
  label: 'FrankenPHP',
  icon: import('@/svg/frankenphp.svg?raw'),
  index: defineAsyncComponent(() => import('./Index.vue')),
  aside: defineAsyncComponent(() => import('./aside.vue')),
  asideIndex: 4,
  isService: true,
  isTray: true
}

export default module
