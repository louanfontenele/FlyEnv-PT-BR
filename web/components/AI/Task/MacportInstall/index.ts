import BaseTask from '@web/components/AI/Task/BaseTask'
import { AIStore } from '@web/components/AI/store'
import { I18nT } from '@shared/lang'

export class MacportInstall extends BaseTask {
  constructor() {
    super()
    this.task = [
      {
        content: () => {
          const aiStore = AIStore()
          aiStore.chatList.push({
            user: 'ai',
            content: I18nT('ai.macportsHasInstall')
          })
        },
        run: () => {
          return new Promise(async (resolve) => {
            resolve(true)
          })
        }
      }
    ]
  }
}
