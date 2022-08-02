import axios, { AxiosInstance } from 'axios'

import { APISchemaType, CreateRequestConfig, CreateRequestClient } from './type'

const MATCH_METHOD = /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|CONNECT|TRACE|PATCH)\s+/
const MATCH_PATH_PARAMS = /:(\w+)/g
const USE_DATA_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// create axios
export const createRequestClient = <T extends APISchemaType>(
  requestConfig: CreateRequestConfig<T>
): CreateRequestClient<T> => {
  const client = axios.create({
    baseURL: requestConfig.baseURL,
    headers: requestConfig.headers
  })

  client.interceptors.request.use((config) => {
    return config
  })

  client.interceptors.response.use(
    (res) => {
      return { data: res.data, error: res.status !== 200 }
    },
    (err) => {
      console.log(err, err.code !== 'ERR_CANCELED')
      if (err.code !== 'ERR_CANCELED') return { res: err.response, error: true }
    }
  )

  return attachAPI<T>(client, requestConfig.apis)
}

//组装hostapi对象
const attachAPI = <T extends APISchemaType>(
  client: AxiosInstance,
  apis: CreateRequestConfig<T>['apis']
): CreateRequestClient<T> => {
  const hostApi: CreateRequestClient<T> = Object.create(null)

  for (const apiName in apis) {
    const apiConfig = apis[apiName]

    hostApi[apiName] = (params, options) => {
      const _params = { ...(params || {}) }
      const { path, headers } = apiConfig

      // 获取请求类型
      const [prefix, method] = path.match(MATCH_METHOD) || ['GET ', 'GET']

      // 获取url
      let url = path.replace(prefix, '')

      // 获取参数占位符
      const matchParams = path.match(MATCH_PATH_PARAMS)
      if (matchParams) {
        matchParams.forEach((match) => {
          const key = match.replace(':', '')
          if (Reflect.has(_params, key)) {
            url = url.replace(match, Reflect.get(_params, key))
            Reflect.deleteProperty(_params, key)
          }
        })
      }

      const requestParams = USE_DATA_METHODS.includes(method)
        ? { data: _params }
        : { params: _params }

      return client.request({
        url,
        method: method.toLowerCase(),
        headers: { ...headers },
        ...requestParams,
        ...options
      })
    }
  }
  return hostApi
}
