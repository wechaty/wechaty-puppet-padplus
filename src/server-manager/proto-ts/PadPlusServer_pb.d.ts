// package: PadPlusServer
// file: PadPlusServer.proto

/* tslint:disable */

import * as jspb from "google-protobuf";

export class RequestObject extends jspb.Message { 

    hasUin(): boolean;
    clearUin(): void;
    getUin(): string | undefined;
    setUin(value: string): void;


    hasRequestid(): boolean;
    clearRequestid(): void;
    getRequestid(): string | undefined;
    setRequestid(value: string): void;


    hasToken(): boolean;
    clearToken(): void;
    getToken(): string | undefined;
    setToken(value: string): void;


    hasApitype(): boolean;
    clearApitype(): void;
    getApitype(): ApiType | undefined;
    setApitype(value: ApiType): void;


    hasParams(): boolean;
    clearParams(): void;
    getParams(): string | undefined;
    setParams(value: string): void;


    hasTraceid(): boolean;
    clearTraceid(): void;
    getTraceid(): string | undefined;
    setTraceid(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RequestObject.AsObject;
    static toObject(includeInstance: boolean, msg: RequestObject): RequestObject.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RequestObject, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RequestObject;
    static deserializeBinaryFromReader(message: RequestObject, reader: jspb.BinaryReader): RequestObject;
}

export namespace RequestObject {
    export type AsObject = {
        uin?: string,
        requestid?: string,
        token?: string,
        apitype?: ApiType,
        params?: string,
        traceid?: string,
    }
}

export class ResponseObject extends jspb.Message { 

    hasResult(): boolean;
    clearResult(): void;
    getResult(): string | undefined;
    setResult(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ResponseObject.AsObject;
    static toObject(includeInstance: boolean, msg: ResponseObject): ResponseObject.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ResponseObject, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ResponseObject;
    static deserializeBinaryFromReader(message: ResponseObject, reader: jspb.BinaryReader): ResponseObject;
}

export namespace ResponseObject {
    export type AsObject = {
        result?: string,
    }
}

export class InitConfig extends jspb.Message { 

    hasToken(): boolean;
    clearToken(): void;
    getToken(): string | undefined;
    setToken(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): InitConfig.AsObject;
    static toObject(includeInstance: boolean, msg: InitConfig): InitConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: InitConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): InitConfig;
    static deserializeBinaryFromReader(message: InitConfig, reader: jspb.BinaryReader): InitConfig;
}

export namespace InitConfig {
    export type AsObject = {
        token?: string,
    }
}

export class StreamResponse extends jspb.Message { 

    hasUin(): boolean;
    clearUin(): void;
    getUin(): string | undefined;
    setUin(value: string): void;


    hasRequestid(): boolean;
    clearRequestid(): void;
    getRequestid(): string | undefined;
    setRequestid(value: string): void;


    hasData(): boolean;
    clearData(): void;
    getData(): string | undefined;
    setData(value: string): void;


    hasResponsetype(): boolean;
    clearResponsetype(): void;
    getResponsetype(): ResponseType | undefined;
    setResponsetype(value: ResponseType): void;


    hasTraceid(): boolean;
    clearTraceid(): void;
    getTraceid(): string | undefined;
    setTraceid(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StreamResponse): StreamResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamResponse;
    static deserializeBinaryFromReader(message: StreamResponse, reader: jspb.BinaryReader): StreamResponse;
}

export namespace StreamResponse {
    export type AsObject = {
        uin?: string,
        requestid?: string,
        data?: string,
        responsetype?: ResponseType,
        traceid?: string,
    }
}

export enum ApiType {
    GET_QRCODE = 0,
    RECONNECT = 1,
    LOGOUT = 2,
    INIT = 3,
    STOP = 4,
    CLOSE = 5,
    HEARTBEAT = 6,
    GET_CONTACT = 10,
    SEARCH_CONTACT = 11,
    ADD_CONTACT = 12,
    ACCEPT_CONTACT = 13,
    SYNC_CONTACT = 14,
    CONTACT_ALIAS = 15,
    ADD_CHATROOM_CONTACT = 16,
    GET_CONTACT_SELF_INFO = 17,
    SET_CONTACT_SELF_INFO = 18,
    GET_CONTACT_SELF_QRCODE = 19,
    GET_ROOM_MEMBER = 30,
    ROOM_OPERATION = 31,
    CREATE_ROOM = 32,
    SET_ROOM_ANNOUNCEMENT = 33,
    GET_ROOM_ANNOUNCEMENT = 34,
    GET_ROOM_QRCODE = 35,
    ACCEPT_ROOM_INVITATION = 36,
    SEND_MESSAGE = 50,
    SEND_FILE = 51,
    REVOKE_MESSAGE = 52,
    GET_MESSAGE_MEDIA = 53,
    GET_ALL_TAG = 70,
    CREATE_TAG = 71,
    ADD_TAG = 72,
    MODIFY_TAG = 73,
    DELETE_TAG = 74,
}

export enum ResponseType {
    REQUEST_RESPONSE = 0,
    DISCONNECT = 1,
    INVALID_TOKEN = 2,
    LOGIN_QRCODE = 10,
    QRCODE_SCAN = 11,
    ACCOUNT_LOGIN = 12,
    ACCOUNT_LOGOUT = 13,
    QRCODE_LOGIN = 14,
    AUTO_LOGIN = 15,
    CONTACT_SELF_INFO_GET = 17,
    CONTACT_SELF_INFO_SET = 18,
    CONTACT_SELF_QRCODE_GET = 19,
    CONTACT_LIST = 20,
    CONTACT_MODIFY = 21,
    CONTACT_DELETE = 22,
    ROOM_MEMBER_LIST = 23,
    ROOM_MEMBER_MODIFY = 24,
    CONTACT_SEARCH = 25,
    CONTACT_ADD = 26,
    ROOM_QRCODE = 27,
    MESSAGE_RECEIVE = 30,
    STATUS_NOTIFY = 31,
    MESSAGE_MEDIA_SRC = 32,
    MESSAGE_REVOKE = 33,
    TAG_LIST = 40,
    TAG_CREATE = 41,
    TAG_ADD = 42,
    TAG_MODIFY = 43,
    TAG_DELETE = 44,
}
