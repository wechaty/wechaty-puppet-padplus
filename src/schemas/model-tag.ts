export interface TagGrpcPayload {
  LabelID: string,
  LabelName: string,
}

export interface TagPayload {
  id: string,
  name: string,
}

export interface TagNewOrListGrpcResponse {
  count: number,
  labelList: TagGrpcPayload[],
  loginer: string,
  message: string,
  queueName: string,
  status: number,
  uin: string,
}

export interface TagNewOrListResponse {
  count: number,
  tagList: TagGrpcPayload[],
  loginer: string,
  message: string,
  queueName: string,
  status: number,
  uin: string,
}

export interface TagOtherOperationsGrpcResponse {
  loginer: string,
  message: string,
  queueName: string,
  status: number,
  uin: string,
  userName: string,
}
