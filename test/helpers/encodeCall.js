const abi = require('ethereumjs-abi')

export function encodeProxyCall(values) {
  const parameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
  const methodId = abi.methodID("initialize", parameters).toString('hex');
  const params = abi.rawEncode(parameters, values).toString('hex');
  return '0x' + methodId + params;
}
