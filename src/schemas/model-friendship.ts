/* eslint camelcase: 0 */
export interface PadplusRequestTokenPayload {
  full_url        : string,
  info            : string,
  message         : string,
  share_url       : string,
  status          : number,
}

export interface PadplusFriendshipPayload {
  fromusername    : string,   // 'lizhuohuan'
  encryptusername : string,   // v1_xxx@stranger'
  content         : string,   // 'hello'
  scene           : string,   // scene type
  ticket          : string,   // 'v2_1a0d2cf325e64b6f74bed09e944529e7cc7a7580cb323475050664566dd0302d89b8e2ed95b596b459cf762d94a0ce606da39babbae0dc26b18a62e079bfc120@stranger',
}

export interface AddContactGrpcResponse {
  status: string,
}
