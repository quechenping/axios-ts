import axios, { CancelToken } from 'axios'

const CancelToken = axios.CancelToken

const getUrl = (url: string | undefined) => url?.split('?')[0] || undefined

// 储存每个请求的取消函数和请求标识
const cancelFns = new Map()

// 取消被多次发起的请求，保留最后一个
export const cancelAjax = (type: 'check' | 'remove' | 'removeAll', key: string) => {
  switch (type) {
    // 取消同类接口
    case 'check':
      cancelFns.get(key) && cancelFns.get(key)()
      cancelAjax('remove', key)
      break
    // 缓存中删除同类接口
    case 'remove':
      cancelFns.delete(key)
      break
    // 取消所有接口
    case 'removeAll':
      cancelFns.forEach((fn, k) => {
        fn()
        cancelFns.delete(k)
      })
      break
    default:
      throw new Error('无效的取消类型')
  }
}

export const setCancelToken = (key: string): CancelToken => {
  return new CancelToken((c) => cancelFns.set(key, c))
}

export const getCancelToken = (url: string | undefined) => {
  return getUrl(url || '')
}
