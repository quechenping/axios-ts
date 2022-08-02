import { APISchemaType, ApiType } from './type'

export interface APISchemas extends APISchemaType {
  getUser: {
    request: {
      id: number
    }
    response: {
      id: number
      name: string
    }
  }
  createUser: {
    request: {
      id: number
    }
    response: {
      id: number
      name: string
    }
  }
  download: {
    request: {
      id: number
    }
    response: {
      id: number
    }
  }
}

export const apis: ApiType<APISchemas> = {
  getUser: {
    path: 'GET /create/user',
    headers: { 'x-f': 'xx' }
  },
  createUser: {
    path: 'GET 1'
  },
  download: {
    path: 'POST api/download/:id',
    headers: { 'x-download': 'xxx' }
  }
}
