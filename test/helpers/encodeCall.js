const abi = require("ethereumjs-abi");

export function encodeProxyCall(parametersType, values) {
    const methodId = abi.methodID("initialize", parametersType).toString("hex");
    const params = abi.rawEncode(parametersType, values).toString("hex");
    return "0x" + methodId + params;
}

export function encodeModuleCall(parametersType, values) {
    const methodId = abi.methodID("configure", parametersType).toString("hex");
    const params = abi.rawEncode(parametersType, values).toString("hex");
    return "0x" + methodId + params;
}

export function encodeCall(methodName, parametersType, values) {
    const methodId = abi.methodID(methodName, parametersType).toString("hex");
    const params = abi.rawEncode(parametersType, values).toString("hex");
    return "0x" + methodId + params;
}
