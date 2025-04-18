export const StorageGet = (key: string) => {
  let saved: any = localStorage.getItem(key)
  if (saved) {
    saved = JSON.parse(saved)
    const time = Math.round(new Date().getTime() / 1000)
    if (time < saved.expire) {
      return saved.data
    }
  }
  return undefined
}

export const StorageSet = (key: string, obj: any, second: number) => {
  if (!obj) {
    return
  }
  localStorage.setItem(
    key,
    JSON.stringify({
      expire: Math.round(new Date().getTime() / 1000) + second,
      data: obj
    })
  )
}
