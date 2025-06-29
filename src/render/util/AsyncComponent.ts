import { onMounted, ref } from 'vue'
import { VueExtend } from '@/core/VueExtend'
import type { CallBackFn } from '@shared/app'

export const AsyncComponentShow = (compontent: any, data?: any) => {
  return new Promise((resolve) => {
    let dom: HTMLElement | null = document.createElement('div')
    document.body.appendChild(dom)
    const vm: any = VueExtend(compontent, data)
    const intance = vm.mount(dom)
    intance?.onClosed?.(() => {
      vm.unmount()
      intance?.$destroy?.()
      vm?.$destroy?.()
      dom?.remove?.()
      dom = null
    })
    intance?.onSubmit?.((arg: any) => {
      intance.show = false
      resolve(arg)
    })
  })
}

export const AsyncComponentSetup = () => {
  const show = ref(false)
  let closedFn: CallBackFn = () => {}
  let callback: CallBackFn = () => {}
  const onClosed = (fn: CallBackFn) => {
    closedFn = fn
  }
  const onSubmit = (fn: CallBackFn) => {
    callback = fn
  }
  onMounted(() => {
    show.value = true
  })
  return {
    show,
    closedFn: () => {
      closedFn()
    },
    callback: (arg: any) => {
      callback(arg)
    },
    onClosed,
    onSubmit
  }
}
