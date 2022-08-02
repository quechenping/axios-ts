# 使用ts封装axios

### 构思

希望配置出如下格式
```javascript
api.getUser().then();
api.crateToken({ id: 1 }).then();
```

那实现上可以简单暴力的这样写：
```typescript
type User = {
  id: number
  name: string
}

export const api = {
  getUser(id:number):Promise<User> {
    return axios.get(
      'http:xxx/user',
      {
      	params:{id}
        headers:{
        	'x-header':'xxx'
      	}
    	}
    )
  },
 
  crateToken(id:number) {
    return axios.post(
      'http:xxx/createToken',
      {
        headers: {
          'x-header':'xxx'
        },
        data:{id}
      }
    )
  }
}

const res = await api.getUser(123)
```

如果接口过多的话，api下难以管理，且配置重复代码过多，所以需要一个配置文件来管理接口



### 类型约束

总结一下需要的配置：

- 接口名称

- 接口地址
- 接口类型
- 接口headers

将method、path、动态入参合并在一起组成`GET xxx/xxx/:id`这种格式更易配置

```typescript
// 请求类型
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE' | 'PATCH'

// url格式
type RequestPath = `\${Uppercase<Method>} \${string}`

type APIType = {
  path: RequestPath
  headers?: AxiosRequestHeaders
}

// 例子
const apis:APIType = {
  getUser: {
    path: 'GET /query/user/:id',
    headers: { 'xxx': 'xx' }
  },
  createUser: {
    path: 'POST /create/user'
  }
}
```



### 入出参约束

在 TS 中我们希望可以利用其强大类型推导能力，通过简单的配置实现 api **接口提示**与接口**入出参约束**，一方面也有替代接口文档的作用

由此需要定义接口名、入参、出参

```typescript
// 入参出参类型
export type APISchemaType = Record<
  string,
  {
    request: Record<string, any> | void
    response: Record<string, any> | any
  }
>

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
}
```

需要将api配置和入参出餐配置文件对应

```typescript
// axios基础配置config
export type CreateRequestConfig<T extends APISchemaType> = {
  baseURL: string
  headers?: AxiosRequestHeaders
  apis: {
    [K in keyof T]: APIType
  }
}
```



### 客户端配置

客户端使用时，应该需要基于`APISchemaType`去构建

```typescript
// axios基础配置config
export type CreateRequestConfig<T extends APISchemaType> = {
  baseURL: string
  headers?: AxiosRequestHeaders
  apis: ApiType<T>
}

export const createRequestClient = <T extends APISchemaType>(
  requestConfig: CreateRequestConfig<T>
): CreateRequestClient<T> => {
  const client = axios.create({
    baseURL: requestConfig.baseURL
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
```

`createRequestClient`用于创建axios实例，但是最终返回给客户端的应该是如下结构

```json
{
  getUser:(params, options)=>{
  	client.request({
        url,
        method: method.toLowerCase(),
        headers: { ...headers },
        params,
        ...options
      })
  }
}
```

```typescript
# attachAPI
const USE_DATA_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

const attachAPI = <T extends APISchemaType>(
  client: AxiosInstance,
  apis: CreateRequestConfig<T>['apis']
):CreateRequestClient<T> => {
  const hostApi: CreateRequestClient<T> = Object.create(null)
  
  for (const apiName in apis) {
    const apiConfig = apis[apiName]
    const { path, headers } = apiConfig
    // path中包含url、method、动态参数
    // 动态参数从params中获取（由用户传入）
    
    xxx... // 解析path
    
    // 请求传入参数key为params或data
    const requestParams = USE_DATA_METHODS.includes(method)
        ? { data: _params }
        : { params: _params }
    
    hostApi[apiName] = (params, options) => {
      return client.request({
        url,
        method: method.toLowerCase(),
        headers: { ...headers },
        ...requestParams,
        ...options
    	})
    }
  }
  
  return hostAPI
}
```



参考：

> https://github.com/kinglisky/axits

本文源码：

> https://github.com/quechenping/axios-ts