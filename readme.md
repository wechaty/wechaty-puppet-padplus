## Wechaty-Puppet-Padplus

### 目录结构
#### src
- index.ts
  > 入口文件

- puppet-padplus.ts
  > 中枢调控

- server-manager
  > 管理缓存、网关

- padplus-busness
  > 处理业务逻辑，调用API请求

- convert-manager
  > 转换数据模型 Padplus <=> Grpc，纯函数，可测试

- api-request
  > 封装联络易 API 请求

- utils
  > 工具方法

- schemas
  > 数据模型 Padplus 和 Grpc