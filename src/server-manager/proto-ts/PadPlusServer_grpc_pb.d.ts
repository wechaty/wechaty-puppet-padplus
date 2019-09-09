// package: PadPlusServer
// file: PadPlusServer.proto

/* tslint:disable */

import * as grpc from "grpc";
import * as PadPlusServer_pb from "./PadPlusServer_pb";

interface IPadPlusServerService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    request: IPadPlusServerService_IRequest;
    init: IPadPlusServerService_IInit;
}

interface IPadPlusServerService_IRequest extends grpc.MethodDefinition<PadPlusServer_pb.RequestObject, PadPlusServer_pb.ResponseObject> {
    path: string; // "/PadPlusServer.PadPlusServer/Request"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<PadPlusServer_pb.RequestObject>;
    requestDeserialize: grpc.deserialize<PadPlusServer_pb.RequestObject>;
    responseSerialize: grpc.serialize<PadPlusServer_pb.ResponseObject>;
    responseDeserialize: grpc.deserialize<PadPlusServer_pb.ResponseObject>;
}
interface IPadPlusServerService_IInit extends grpc.MethodDefinition<PadPlusServer_pb.InitConfig, PadPlusServer_pb.StreamResponse> {
    path: string; // "/PadPlusServer.PadPlusServer/Init"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<PadPlusServer_pb.InitConfig>;
    requestDeserialize: grpc.deserialize<PadPlusServer_pb.InitConfig>;
    responseSerialize: grpc.serialize<PadPlusServer_pb.StreamResponse>;
    responseDeserialize: grpc.deserialize<PadPlusServer_pb.StreamResponse>;
}

export const PadPlusServerService: IPadPlusServerService;

export interface IPadPlusServerServer {
    request: grpc.handleUnaryCall<PadPlusServer_pb.RequestObject, PadPlusServer_pb.ResponseObject>;
    init: grpc.handleServerStreamingCall<PadPlusServer_pb.InitConfig, PadPlusServer_pb.StreamResponse>;
}

export interface IPadPlusServerClient {
    request(request: PadPlusServer_pb.RequestObject, callback: (error: grpc.ServiceError | null, response: PadPlusServer_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    request(request: PadPlusServer_pb.RequestObject, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: PadPlusServer_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    request(request: PadPlusServer_pb.RequestObject, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: PadPlusServer_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    init(request: PadPlusServer_pb.InitConfig, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<PadPlusServer_pb.StreamResponse>;
    init(request: PadPlusServer_pb.InitConfig, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<PadPlusServer_pb.StreamResponse>;
}

export class PadPlusServerClient extends grpc.Client implements IPadPlusServerClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public request(request: PadPlusServer_pb.RequestObject, callback: (error: grpc.ServiceError | null, response: PadPlusServer_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    public request(request: PadPlusServer_pb.RequestObject, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: PadPlusServer_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    public request(request: PadPlusServer_pb.RequestObject, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: PadPlusServer_pb.ResponseObject) => void): grpc.ClientUnaryCall;
    public init(request: PadPlusServer_pb.InitConfig, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<PadPlusServer_pb.StreamResponse>;
    public init(request: PadPlusServer_pb.InitConfig, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<PadPlusServer_pb.StreamResponse>;
}
