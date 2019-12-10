---
id: version-3.0.0-Buffer
title: Buffer
original_id: Buffer
---

# Buffer.sol

View Source: [contracts/external/oraclizeAPI.sol](../../contracts/external/oraclizeAPI.sol)

**Buffer**

## Structs
### buffer

```js
struct buffer {
 bytes buf,
 uint256 capacity
}
```

## Contract Members
**Constants & Variables**

```js
//public members
address public cbAddress;

//private members
uint8 private constant MAJOR_TYPE_INT;
uint8 private constant MAJOR_TYPE_MAP;
uint8 private constant MAJOR_TYPE_BYTES;
uint8 private constant MAJOR_TYPE_ARRAY;
uint8 private constant MAJOR_TYPE_STRING;
uint8 private constant MAJOR_TYPE_NEGATIVE_INT;
uint8 private constant MAJOR_TYPE_CONTENT_FREE;

//internal members
contract OraclizeI internal oraclize;
contract OraclizeAddrResolverI internal OAR;
uint256 internal constant day;
uint256 internal constant week;
uint256 internal constant month;
bytes1 internal constant proofType_NONE;
bytes1 internal constant proofType_Ledger;
bytes1 internal constant proofType_Native;
bytes1 internal constant proofStorage_IPFS;
bytes1 internal constant proofType_Android;
bytes1 internal constant proofType_TLSNotary;
string internal oraclize_network_name;
uint8 internal constant networkID_auto;
uint8 internal constant networkID_morden;
uint8 internal constant networkID_mainnet;
uint8 internal constant networkID_testnet;
uint8 internal constant networkID_consensys;
mapping(bytes32 => bytes32) internal oraclize_randomDS_args;
mapping(bytes32 => bool) internal oraclize_randomDS_sessionKeysHashVerified;

```

## Modifiers

- [oraclizeAPI](#oraclizeapi)
- [oraclize_randomDS_proofVerify](#oraclize_randomds_proofverify)

### oraclizeAPI

```js
modifier oraclizeAPI() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### oraclize_randomDS_proofVerify

```js
modifier oraclize_randomDS_proofVerify(bytes32 _queryId, string _result, bytes _proof) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _queryId | bytes32 |  | 
| _result | string |  | 
| _proof | bytes |  | 

## Functions

- [f(bytes x)](#f)
- [setProofType(bytes1 _proofType)](#setprooftype)
- [setCustomGasPrice(uint256 _gasPrice)](#setcustomgasprice)
- [getPrice(string _datasource)](#getprice)
- [randomDS_getSessionPubKeyHash()](#randomds_getsessionpubkeyhash)
- [getPrice(string _datasource, uint256 _gasLimit)](#getprice)
- [queryN(uint256 _timestamp, string _datasource, bytes _argN)](#queryn)
- [query(uint256 _timestamp, string _datasource, string _arg)](#query)
- [query2(uint256 _timestamp, string _datasource, string _arg1, string _arg2)](#query2)
- [query_withGasLimit(uint256 _timestamp, string _datasource, string _arg, uint256 _gasLimit)](#query_withgaslimit)
- [queryN_withGasLimit(uint256 _timestamp, string _datasource, bytes _argN, uint256 _gasLimit)](#queryn_withgaslimit)
- [query2_withGasLimit(uint256 _timestamp, string _datasource, string _arg1, string _arg2, uint256 _gasLimit)](#query2_withgaslimit)
- [getAddress()](#getaddress)
- [init(struct Buffer.buffer _buf, uint256 _capacity)](#init)
- [resize(struct Buffer.buffer _buf, uint256 _capacity)](#resize)
- [max(uint256 _a, uint256 _b)](#max)
- [append(struct Buffer.buffer _buf, bytes _data)](#append)
- [append(struct Buffer.buffer _buf, uint8 _data)](#append)
- [appendInt(struct Buffer.buffer _buf, uint256 _data, uint256 _len)](#appendint)
- [encodeType(struct Buffer.buffer _buf, uint8 _major, uint256 _value)](#encodetype)
- [encodeIndefiniteLengthType(struct Buffer.buffer _buf, uint8 _major)](#encodeindefinitelengthtype)
- [encodeUInt(struct Buffer.buffer _buf, uint256 _value)](#encodeuint)
- [encodeInt(struct Buffer.buffer _buf, int256 _value)](#encodeint)
- [encodeBytes(struct Buffer.buffer _buf, bytes _value)](#encodebytes)
- [encodeString(struct Buffer.buffer _buf, string _value)](#encodestring)
- [startArray(struct Buffer.buffer _buf)](#startarray)
- [startMap(struct Buffer.buffer _buf)](#startmap)
- [endSequence(struct Buffer.buffer _buf)](#endsequence)
- [oraclize_setNetwork(uint8 _networkID)](#oraclize_setnetwork)
- [oraclize_setNetworkName(string _network_name)](#oraclize_setnetworkname)
- [oraclize_getNetworkName()](#oraclize_getnetworkname)
- [oraclize_setNetwork()](#oraclize_setnetwork)
- [__callback(bytes32 _myid, string _result)](#__callback)
- [__callback(bytes32 _myid, string _result, bytes _proof)](#__callback)
- [oraclize_getPrice(string _datasource)](#oraclize_getprice)
- [oraclize_getPrice(string _datasource, uint256 _gasLimit)](#oraclize_getprice)
- [oraclize_query(string _datasource, string _arg)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string _arg)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string _arg, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string _arg, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string _arg1, string _arg2)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string _arg1, string _arg2)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string _arg1, string _arg2, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string _arg1, string _arg2, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[] _argN)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[] _argN)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[] _argN, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[] _argN, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[1] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[1] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[1] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[1] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[2] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[2] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[2] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[2] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[3] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[3] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[3] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[3] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[4] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[4] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[4] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[4] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[5] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[5] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, string[5] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, string[5] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[] _argN)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[] _argN)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[] _argN, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[] _argN, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[1] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[1] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[1] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[1] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[2] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[2] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[2] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[2] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[3] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[3] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[3] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[3] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[4] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[4] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[4] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[4] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[5] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[5] _args)](#oraclize_query)
- [oraclize_query(uint256 _timestamp, string _datasource, bytes[5] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_query(string _datasource, bytes[5] _args, uint256 _gasLimit)](#oraclize_query)
- [oraclize_setProof(bytes1 _proofP)](#oraclize_setproof)
- [oraclize_cbAddress()](#oraclize_cbaddress)
- [getCodeSize(address _addr)](#getcodesize)
- [oraclize_setCustomGasPrice(uint256 _gasPrice)](#oraclize_setcustomgasprice)
- [oraclize_randomDS_getSessionPubKeyHash()](#oraclize_randomds_getsessionpubkeyhash)
- [parseAddr(string _a)](#parseaddr)
- [strCompare(string _a, string _b)](#strcompare)
- [indexOf(string _haystack, string _needle)](#indexof)
- [strConcat(string _a, string _b)](#strconcat)
- [strConcat(string _a, string _b, string _c)](#strconcat)
- [strConcat(string _a, string _b, string _c, string _d)](#strconcat)
- [strConcat(string _a, string _b, string _c, string _d, string _e)](#strconcat)
- [safeParseInt(string _a)](#safeparseint)
- [safeParseInt(string _a, uint256 _b)](#safeparseint)
- [parseInt(string _a)](#parseint)
- [parseInt(string _a, uint256 _b)](#parseint)
- [uint2str(uint256 _i)](#uint2str)
- [stra2cbor(string[] _arr)](#stra2cbor)
- [ba2cbor(bytes[] _arr)](#ba2cbor)
- [oraclize_newRandomDSQuery(uint256 _delay, uint256 _nbytes, uint256 _customGasLimit)](#oraclize_newrandomdsquery)
- [oraclize_randomDS_setCommitment(bytes32 _queryId, bytes32 _commitment)](#oraclize_randomds_setcommitment)
- [verifySig(bytes32 _tosignh, bytes _dersig, bytes _pubkey)](#verifysig)
- [oraclize_randomDS_proofVerify__sessionKeyValidity(bytes _proof, uint256 _sig2offset)](#oraclize_randomds_proofverify__sessionkeyvalidity)
- [oraclize_randomDS_proofVerify__returnCode(bytes32 _queryId, string _result, bytes _proof)](#oraclize_randomds_proofverify__returncode)
- [matchBytes32Prefix(bytes32 _content, bytes _prefix, uint256 _nRandomBytes)](#matchbytes32prefix)
- [oraclize_randomDS_proofVerify__main(bytes _proof, bytes32 _queryId, bytes _result, string _contextName)](#oraclize_randomds_proofverify__main)
- [copyBytes(bytes _from, uint256 _fromOffset, uint256 _length, bytes _to, uint256 _toOffset)](#copybytes)
- [safer_ecrecover(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s)](#safer_ecrecover)
- [ecrecovery(bytes32 _hash, bytes _sig)](#ecrecovery)
- [safeMemoryCleaner()](#safememorycleaner)

### f

```js
function f(bytes x) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| x | bytes |  | 

### setProofType

```js
function setProofType(bytes1 _proofType) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _proofType | bytes1 |  | 

### setCustomGasPrice

```js
function setCustomGasPrice(uint256 _gasPrice) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _gasPrice | uint256 |  | 

### getPrice

```js
function getPrice(string _datasource) public nonpayable
returns(_dsprice uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 

### randomDS_getSessionPubKeyHash

```js
function randomDS_getSessionPubKeyHash() external view
returns(_sessionKeyHash bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPrice

```js
function getPrice(string _datasource, uint256 _gasLimit) public nonpayable
returns(_dsprice uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _gasLimit | uint256 |  | 

### queryN

```js
function queryN(uint256 _timestamp, string _datasource, bytes _argN) public payable
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _argN | bytes |  | 

### query

```js
function query(uint256 _timestamp, string _datasource, string _arg) external payable
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _arg | string |  | 

### query2

```js
function query2(uint256 _timestamp, string _datasource, string _arg1, string _arg2) public payable
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _arg1 | string |  | 
| _arg2 | string |  | 

### query_withGasLimit

```js
function query_withGasLimit(uint256 _timestamp, string _datasource, string _arg, uint256 _gasLimit) external payable
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _arg | string |  | 
| _gasLimit | uint256 |  | 

### queryN_withGasLimit

```js
function queryN_withGasLimit(uint256 _timestamp, string _datasource, bytes _argN, uint256 _gasLimit) external payable
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _argN | bytes |  | 
| _gasLimit | uint256 |  | 

### query2_withGasLimit

```js
function query2_withGasLimit(uint256 _timestamp, string _datasource, string _arg1, string _arg2, uint256 _gasLimit) external payable
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _arg1 | string |  | 
| _arg2 | string |  | 
| _gasLimit | uint256 |  | 

### getAddress

```js
function getAddress() public nonpayable
returns(_address address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### init

```js
function init(struct Buffer.buffer _buf, uint256 _capacity) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 
| _capacity | uint256 |  | 

### resize

```js
function resize(struct Buffer.buffer _buf, uint256 _capacity) private pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 
| _capacity | uint256 |  | 

### max

```js
function max(uint256 _a, uint256 _b) private pure
returns(_max uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | uint256 |  | 
| _b | uint256 |  | 

### append

Appends a byte array to the end of the buffer. Resizes if doing so
     would exceed the capacity of the buffer.

```js
function append(struct Buffer.buffer _buf, bytes _data) internal pure
returns(_buffer struct Buffer.buffer)
```

**Returns**

The original buffer.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer | The buffer to append to. | 
| _data | bytes | The data to append. | 

### append

Appends a byte to the end of the buffer. Resizes if doing so would
exceed the capacity of the buffer.

```js
function append(struct Buffer.buffer _buf, uint8 _data) internal pure
```

**Returns**

The original buffer.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer | The buffer to append to. | 
| _data | uint8 | The data to append. | 

### appendInt

Appends a byte to the end of the buffer. Resizes if doing so would
exceed the capacity of the buffer.

```js
function appendInt(struct Buffer.buffer _buf, uint256 _data, uint256 _len) internal pure
returns(_buffer struct Buffer.buffer)
```

**Returns**

The original buffer.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer | The buffer to append to. | 
| _data | uint256 | The data to append. | 
| _len | uint256 |  | 

### encodeType

```js
function encodeType(struct Buffer.buffer _buf, uint8 _major, uint256 _value) private pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 
| _major | uint8 |  | 
| _value | uint256 |  | 

### encodeIndefiniteLengthType

```js
function encodeIndefiniteLengthType(struct Buffer.buffer _buf, uint8 _major) private pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 
| _major | uint8 |  | 

### encodeUInt

```js
function encodeUInt(struct Buffer.buffer _buf, uint256 _value) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 
| _value | uint256 |  | 

### encodeInt

```js
function encodeInt(struct Buffer.buffer _buf, int256 _value) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 
| _value | int256 |  | 

### encodeBytes

```js
function encodeBytes(struct Buffer.buffer _buf, bytes _value) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 
| _value | bytes |  | 

### encodeString

```js
function encodeString(struct Buffer.buffer _buf, string _value) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 
| _value | string |  | 

### startArray

```js
function startArray(struct Buffer.buffer _buf) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 

### startMap

```js
function startMap(struct Buffer.buffer _buf) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 

### endSequence

```js
function endSequence(struct Buffer.buffer _buf) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _buf | struct Buffer.buffer |  | 

### oraclize_setNetwork

```js
function oraclize_setNetwork(uint8 _networkID) internal nonpayable
returns(_networkSet bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _networkID | uint8 |  | 

### oraclize_setNetworkName

```js
function oraclize_setNetworkName(string _network_name) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _network_name | string |  | 

### oraclize_getNetworkName

```js
function oraclize_getNetworkName() internal view
returns(_networkName string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### oraclize_setNetwork

```js
function oraclize_setNetwork() internal nonpayable
returns(_networkSet bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### __callback

```js
function __callback(bytes32 _myid, string _result) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _myid | bytes32 |  | 
| _result | string |  | 

### __callback

```js
function __callback(bytes32 _myid, string _result, bytes _proof) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _myid | bytes32 |  | 
| _result | string |  | 
| _proof | bytes |  | 

### oraclize_getPrice

```js
function oraclize_getPrice(string _datasource) internal nonpayable oraclizeAPI 
returns(_queryPrice uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 

### oraclize_getPrice

```js
function oraclize_getPrice(string _datasource, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_queryPrice uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string _arg) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _arg | string |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string _arg) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _arg | string |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string _arg, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _arg | string |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string _arg, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _arg | string |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string _arg1, string _arg2) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _arg1 | string |  | 
| _arg2 | string |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string _arg1, string _arg2) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _arg1 | string |  | 
| _arg2 | string |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string _arg1, string _arg2, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _arg1 | string |  | 
| _arg2 | string |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string _arg1, string _arg2, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _arg1 | string |  | 
| _arg2 | string |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[] _argN) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _argN | string[] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[] _argN) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _argN | string[] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[] _argN, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _argN | string[] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[] _argN, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _argN | string[] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[1] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | string[1] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[1] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | string[1] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[1] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | string[1] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[1] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | string[1] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[2] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | string[2] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[2] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | string[2] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[2] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | string[2] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[2] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | string[2] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[3] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | string[3] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[3] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | string[3] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[3] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | string[3] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[3] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | string[3] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[4] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | string[4] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[4] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | string[4] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[4] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | string[4] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[4] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | string[4] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[5] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | string[5] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[5] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | string[5] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, string[5] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | string[5] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, string[5] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | string[5] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[] _argN) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _argN | bytes[] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[] _argN) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _argN | bytes[] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[] _argN, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _argN | bytes[] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[] _argN, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _argN | bytes[] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[1] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | bytes[1] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[1] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | bytes[1] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[1] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | bytes[1] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[1] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | bytes[1] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[2] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | bytes[2] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[2] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | bytes[2] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[2] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | bytes[2] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[2] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | bytes[2] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[3] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | bytes[3] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[3] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | bytes[3] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[3] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | bytes[3] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[3] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | bytes[3] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[4] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | bytes[4] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[4] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | bytes[4] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[4] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | bytes[4] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[4] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | bytes[4] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[5] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | bytes[5] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[5] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | bytes[5] |  | 

### oraclize_query

```js
function oraclize_query(uint256 _timestamp, string _datasource, bytes[5] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _args | bytes[5] |  | 
| _gasLimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string _datasource, bytes[5] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| _args | bytes[5] |  | 
| _gasLimit | uint256 |  | 

### oraclize_setProof

```js
function oraclize_setProof(bytes1 _proofP) internal nonpayable oraclizeAPI 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _proofP | bytes1 |  | 

### oraclize_cbAddress

```js
function oraclize_cbAddress() internal nonpayable oraclizeAPI 
returns(_callbackAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getCodeSize

```js
function getCodeSize(address _addr) internal view
returns(_size uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _addr | address |  | 

### oraclize_setCustomGasPrice

```js
function oraclize_setCustomGasPrice(uint256 _gasPrice) internal nonpayable oraclizeAPI 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _gasPrice | uint256 |  | 

### oraclize_randomDS_getSessionPubKeyHash

```js
function oraclize_randomDS_getSessionPubKeyHash() internal nonpayable oraclizeAPI 
returns(_sessionKeyHash bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### parseAddr

```js
function parseAddr(string _a) internal pure
returns(_parsedAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 

### strCompare

```js
function strCompare(string _a, string _b) internal pure
returns(_returnCode int256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | string |  | 

### indexOf

```js
function indexOf(string _haystack, string _needle) internal pure
returns(_returnCode int256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _haystack | string |  | 
| _needle | string |  | 

### strConcat

```js
function strConcat(string _a, string _b) internal pure
returns(_concatenatedString string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | string |  | 

### strConcat

```js
function strConcat(string _a, string _b, string _c) internal pure
returns(_concatenatedString string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | string |  | 
| _c | string |  | 

### strConcat

```js
function strConcat(string _a, string _b, string _c, string _d) internal pure
returns(_concatenatedString string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | string |  | 
| _c | string |  | 
| _d | string |  | 

### strConcat

```js
function strConcat(string _a, string _b, string _c, string _d, string _e) internal pure
returns(_concatenatedString string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | string |  | 
| _c | string |  | 
| _d | string |  | 
| _e | string |  | 

### safeParseInt

```js
function safeParseInt(string _a) internal pure
returns(_parsedInt uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 

### safeParseInt

```js
function safeParseInt(string _a, uint256 _b) internal pure
returns(_parsedInt uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | uint256 |  | 

### parseInt

```js
function parseInt(string _a) internal pure
returns(_parsedInt uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 

### parseInt

```js
function parseInt(string _a, uint256 _b) internal pure
returns(_parsedInt uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | uint256 |  | 

### uint2str

```js
function uint2str(uint256 _i) internal pure
returns(_uintAsString string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _i | uint256 |  | 

### stra2cbor

```js
function stra2cbor(string[] _arr) internal pure
returns(_cborEncoding bytes)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _arr | string[] |  | 

### ba2cbor

```js
function ba2cbor(bytes[] _arr) internal pure
returns(_cborEncoding bytes)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _arr | bytes[] |  | 

### oraclize_newRandomDSQuery

```js
function oraclize_newRandomDSQuery(uint256 _delay, uint256 _nbytes, uint256 _customGasLimit) internal nonpayable
returns(_queryId bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delay | uint256 |  | 
| _nbytes | uint256 |  | 
| _customGasLimit | uint256 |  | 

### oraclize_randomDS_setCommitment

```js
function oraclize_randomDS_setCommitment(bytes32 _queryId, bytes32 _commitment) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _queryId | bytes32 |  | 
| _commitment | bytes32 |  | 

### verifySig

```js
function verifySig(bytes32 _tosignh, bytes _dersig, bytes _pubkey) internal nonpayable
returns(_sigVerified bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tosignh | bytes32 |  | 
| _dersig | bytes |  | 
| _pubkey | bytes |  | 

### oraclize_randomDS_proofVerify__sessionKeyValidity

```js
function oraclize_randomDS_proofVerify__sessionKeyValidity(bytes _proof, uint256 _sig2offset) internal nonpayable
returns(_proofVerified bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _proof | bytes |  | 
| _sig2offset | uint256 |  | 

### oraclize_randomDS_proofVerify__returnCode

```js
function oraclize_randomDS_proofVerify__returnCode(bytes32 _queryId, string _result, bytes _proof) internal nonpayable
returns(_returnCode uint8)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _queryId | bytes32 |  | 
| _result | string |  | 
| _proof | bytes |  | 

### matchBytes32Prefix

```js
function matchBytes32Prefix(bytes32 _content, bytes _prefix, uint256 _nRandomBytes) internal pure
returns(_matchesPrefix bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _content | bytes32 |  | 
| _prefix | bytes |  | 
| _nRandomBytes | uint256 |  | 

### oraclize_randomDS_proofVerify__main

```js
function oraclize_randomDS_proofVerify__main(bytes _proof, bytes32 _queryId, bytes _result, string _contextName) internal nonpayable
returns(_proofVerified bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _proof | bytes |  | 
| _queryId | bytes32 |  | 
| _result | bytes |  | 
| _contextName | string |  | 

### copyBytes

```js
function copyBytes(bytes _from, uint256 _fromOffset, uint256 _length, bytes _to, uint256 _toOffset) internal pure
returns(_copiedBytes bytes)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | bytes |  | 
| _fromOffset | uint256 |  | 
| _length | uint256 |  | 
| _to | bytes |  | 
| _toOffset | uint256 |  | 

### safer_ecrecover

```js
function safer_ecrecover(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal nonpayable
returns(_success bool, _recoveredAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _hash | bytes32 |  | 
| _v | uint8 |  | 
| _r | bytes32 |  | 
| _s | bytes32 |  | 

### ecrecovery

```js
function ecrecovery(bytes32 _hash, bytes _sig) internal nonpayable
returns(_success bool, _recoveredAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _hash | bytes32 |  | 
| _sig | bytes |  | 

### safeMemoryCleaner

```js
function safeMemoryCleaner() internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

