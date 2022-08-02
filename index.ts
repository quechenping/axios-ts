import { createRequestClient } from './request'
import { APISchemas, apis } from './schema'

const http = createRequestClient<APISchemas>({
  baseURL: '/',
  apis
})

export default http
