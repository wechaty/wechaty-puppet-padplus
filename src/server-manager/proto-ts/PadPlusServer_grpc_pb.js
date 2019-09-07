// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var PadPlusServer_pb = require('./PadPlusServer_pb.js');

function serialize_PadPlusServer_InitConfig(arg) {
  if (!(arg instanceof PadPlusServer_pb.InitConfig)) {
    throw new Error('Expected argument of type PadPlusServer.InitConfig');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_PadPlusServer_InitConfig(buffer_arg) {
  return PadPlusServer_pb.InitConfig.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PadPlusServer_RequestObject(arg) {
  if (!(arg instanceof PadPlusServer_pb.RequestObject)) {
    throw new Error('Expected argument of type PadPlusServer.RequestObject');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_PadPlusServer_RequestObject(buffer_arg) {
  return PadPlusServer_pb.RequestObject.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PadPlusServer_ResponseObject(arg) {
  if (!(arg instanceof PadPlusServer_pb.ResponseObject)) {
    throw new Error('Expected argument of type PadPlusServer.ResponseObject');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_PadPlusServer_ResponseObject(buffer_arg) {
  return PadPlusServer_pb.ResponseObject.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_PadPlusServer_StreamResponse(arg) {
  if (!(arg instanceof PadPlusServer_pb.StreamResponse)) {
    throw new Error('Expected argument of type PadPlusServer.StreamResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_PadPlusServer_StreamResponse(buffer_arg) {
  return PadPlusServer_pb.StreamResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var PadPlusServerService = exports.PadPlusServerService = {
  request: {
    path: '/PadPlusServer.PadPlusServer/Request',
    requestStream: false,
    responseStream: false,
    requestType: PadPlusServer_pb.RequestObject,
    responseType: PadPlusServer_pb.ResponseObject,
    requestSerialize: serialize_PadPlusServer_RequestObject,
    requestDeserialize: deserialize_PadPlusServer_RequestObject,
    responseSerialize: serialize_PadPlusServer_ResponseObject,
    responseDeserialize: deserialize_PadPlusServer_ResponseObject,
  },
  init: {
    path: '/PadPlusServer.PadPlusServer/Init',
    requestStream: false,
    responseStream: true,
    requestType: PadPlusServer_pb.InitConfig,
    responseType: PadPlusServer_pb.StreamResponse,
    requestSerialize: serialize_PadPlusServer_InitConfig,
    requestDeserialize: deserialize_PadPlusServer_InitConfig,
    responseSerialize: serialize_PadPlusServer_StreamResponse,
    responseDeserialize: deserialize_PadPlusServer_StreamResponse,
  },
};

exports.PadPlusServerClient = grpc.makeGenericClientConstructor(PadPlusServerService);
