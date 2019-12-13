---
id: version-3.0.0-ECDSA
title: ECDSA
original_id: ECDSA
---

# Elliptic curve signature operations (ECDSA.sol)

View Source: [openzeppelin-solidity/contracts/cryptography/ECDSA.sol](../../openzeppelin-solidity/contracts/cryptography/ECDSA.sol)

**ECDSA**

Based on https://gist.github.com/axic/5b33912c6f61ae6fd96d6c4a47afde6d
TODO Remove this library once solidity supports passing a signature to ecrecover.
See https://github.com/ethereum/solidity/issues/864

## Functions

- [recover(bytes32 hash, bytes signature)](#recover)
- [toEthSignedMessageHash(bytes32 hash)](#toethsignedmessagehash)

### recover

Recover signer address from a message by using their signature

```js
function recover(bytes32 hash, bytes signature) internal pure
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| hash | bytes32 | bytes32 message, the hash is the signed message. What is recovered is the signer address. | 
| signature | bytes | bytes signature, the signature is generated using web3.eth.sign() | 

### toEthSignedMessageHash

prefix a bytes32 value with "\x19Ethereum Signed Message:"
and hash the result

```js
function toEthSignedMessageHash(bytes32 hash) internal pure
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| hash | bytes32 |  | 

