import { defineAsyncComponent } from 'vue'
import type { AppModuleItem } from '@/core/type'

const module: AppModuleItem = {
  moduleType: 'serviceGovernance',
  typeFlag: 'rnacos',
  label: 'R-Nacos',
  icon: import('@/svg/rnacos.svg?raw'),
  index: defineAsyncComponent(() => import('./Index.vue')),
  aside: defineAsyncComponent(() => import('./aside.vue')),
  asideIndex: 4,
  isService: true,
  isTray: true
}

export default module
