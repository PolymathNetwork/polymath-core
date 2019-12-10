---
id: version-3.0.0-usingOraclize
title: usingOraclize
original_id: usingOraclize
---

# usingOraclize.sol

View Source: [contracts/external/oraclizeAPI.sol](../../contracts/external/oraclizeAPI.sol)

**usingOraclize**

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
uint8 private constant MAJOR_TYPE_NEGATIVE_INT;
uint8 private constant MAJOR_TYPE_BYTES;
uint8 private constant MAJOR_TYPE_STRING;
uint8 private constant MAJOR_TYPE_ARRAY;
uint8 private constant MAJOR_TYPE_MAP;
uint8 private constant MAJOR_TYPE_CONTENT_FREE;

//internal members
uint256 internal constant day;
uint256 internal constant week;
uint256 internal constant month;
bytes1 internal constant proofType_NONE;
bytes1 internal constant proofType_TLSNotary;
bytes1 internal constant proofType_Ledger;
bytes1 internal constant proofType_Android;
bytes1 internal constant proofType_Native;
bytes1 internal constant proofStorage_IPFS;
uint8 internal constant networkID_auto;
uint8 internal constant networkID_mainnet;
uint8 internal constant networkID_testnet;
uint8 internal constant networkID_morden;
uint8 internal constant networkID_consensys;
contract OraclizeAddrResolverI internal OAR;
contract OraclizeI internal oraclize;
string internal oraclize_network_name;
mapping(bytes32 => bytes32) internal oraclize_randomDS_args;
mapping(bytes32 => bool) internal oraclize_randomDS_sessionKeysHashVerified;

```

## Modifiers

- [oraclizeAPI](#oraclizeapi)
- [coupon](#coupon)
- [oraclize_randomDS_proofVerify](#oraclize_randomds_proofverify)

### oraclizeAPI

```js
modifier oraclizeAPI() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### coupon

```js
modifier coupon(string code) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| code | string |  | 

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

- [query(uint256 _timestamp, string _datasource, string _arg)](#query)
- [query_withGasLimit(uint256 _timestamp, string _datasource, string _arg, uint256 _gaslimit)](#query_withgaslimit)
- [query2(uint256 _timestamp, string _datasource, string _arg1, string _arg2)](#query2)
- [query2_withGasLimit(uint256 _timestamp, string _datasource, string _arg1, string _arg2, uint256 _gaslimit)](#query2_withgaslimit)
- [queryN(uint256 _timestamp, string _datasource, bytes _argN)](#queryn)
- [queryN_withGasLimit(uint256 _timestamp, string _datasource, bytes _argN, uint256 _gaslimit)](#queryn_withgaslimit)
- [getPrice(string _datasource)](#getprice)
- [getPrice(string _datasource, uint256 gaslimit)](#getprice)
- [setProofType(bytes1 _proofType)](#setprooftype)
- [setCustomGasPrice(uint256 _gasPrice)](#setcustomgasprice)
- [randomDS_getSessionPubKeyHash()](#randomds_getsessionpubkeyhash)
- [getAddress()](#getaddress)
- [init(struct Buffer.buffer buf, uint256 _capacity)](#init)
- [resize(struct Buffer.buffer buf, uint256 capacity)](#resize)
- [max(uint256 a, uint256 b)](#max)
- [append(struct Buffer.buffer buf, bytes data)](#append)
- [append(struct Buffer.buffer buf, uint8 data)](#append)
- [appendInt(struct Buffer.buffer buf, uint256 data, uint256 len)](#appendint)
- [encodeType(struct Buffer.buffer buf, uint8 major, uint256 value)](#encodetype)
- [encodeIndefiniteLengthType(struct Buffer.buffer buf, uint8 major)](#encodeindefinitelengthtype)
- [encodeUInt(struct Buffer.buffer buf, uint256 value)](#encodeuint)
- [encodeInt(struct Buffer.buffer buf, int256 value)](#encodeint)
- [encodeBytes(struct Buffer.buffer buf, bytes value)](#encodebytes)
- [encodeString(struct Buffer.buffer buf, string value)](#encodestring)
- [startArray(struct Buffer.buffer buf)](#startarray)
- [startMap(struct Buffer.buffer buf)](#startmap)
- [endSequence(struct Buffer.buffer buf)](#endsequence)
- [oraclize_setNetwork(uint8 networkID)](#oraclize_setnetwork)
- [oraclize_setNetwork()](#oraclize_setnetwork)
- [__callback(bytes32 myid, string result)](#__callback)
- [__callback(bytes32 myid, string result, bytes proof)](#__callback)
- [oraclize_getPrice(string datasource)](#oraclize_getprice)
- [oraclize_getPrice(string datasource, uint256 gaslimit)](#oraclize_getprice)
- [oraclize_query(string datasource, string arg)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string arg)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string arg, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string arg, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string arg1, string arg2)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string arg1, string arg2)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string arg1, string arg2, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string arg1, string arg2, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[] argN)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[] argN)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[] argN, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[] argN, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[1] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[1] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[1] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[1] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[2] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[2] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[2] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[2] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[3] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[3] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[3] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[3] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[4] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[4] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[4] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[4] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[5] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[5] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, string[5] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, string[5] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[] argN)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[] argN)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[] argN, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[] argN, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[1] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[1] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[1] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[1] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[2] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[2] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[2] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[2] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[3] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[3] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[3] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[3] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[4] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[4] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[4] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[4] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[5] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[5] args)](#oraclize_query)
- [oraclize_query(uint256 timestamp, string datasource, bytes[5] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_query(string datasource, bytes[5] args, uint256 gaslimit)](#oraclize_query)
- [oraclize_cbAddress()](#oraclize_cbaddress)
- [oraclize_setProof(bytes1 proofP)](#oraclize_setproof)
- [oraclize_setCustomGasPrice(uint256 gasPrice)](#oraclize_setcustomgasprice)
- [oraclize_randomDS_getSessionPubKeyHash()](#oraclize_randomds_getsessionpubkeyhash)
- [getCodeSize(address _addr)](#getcodesize)
- [parseAddr(string _a)](#parseaddr)
- [strCompare(string _a, string _b)](#strcompare)
- [indexOf(string _haystack, string _needle)](#indexof)
- [strConcat(string _a, string _b, string _c, string _d, string _e)](#strconcat)
- [strConcat(string _a, string _b, string _c, string _d)](#strconcat)
- [strConcat(string _a, string _b, string _c)](#strconcat)
- [strConcat(string _a, string _b)](#strconcat)
- [parseInt(string _a)](#parseint)
- [parseInt(string _a, uint256 _b)](#parseint)
- [uint2str(uint256 i)](#uint2str)
- [stra2cbor(string[] arr)](#stra2cbor)
- [ba2cbor(bytes[] arr)](#ba2cbor)
- [oraclize_setNetworkName(string _network_name)](#oraclize_setnetworkname)
- [oraclize_getNetworkName()](#oraclize_getnetworkname)
- [oraclize_newRandomDSQuery(uint256 _delay, uint256 _nbytes, uint256 _customGasLimit)](#oraclize_newrandomdsquery)
- [oraclize_randomDS_setCommitment(bytes32 queryId, bytes32 commitment)](#oraclize_randomds_setcommitment)
- [verifySig(bytes32 tosignh, bytes dersig, bytes pubkey)](#verifysig)
- [oraclize_randomDS_proofVerify__sessionKeyValidity(bytes proof, uint256 sig2offset)](#oraclize_randomds_proofverify__sessionkeyvalidity)
- [oraclize_randomDS_proofVerify__returnCode(bytes32 _queryId, string _result, bytes _proof)](#oraclize_randomds_proofverify__returncode)
- [matchBytes32Prefix(bytes32 content, bytes prefix, uint256 n_random_bytes)](#matchbytes32prefix)
- [oraclize_randomDS_proofVerify__main(bytes proof, bytes32 queryId, bytes result, string context_name)](#oraclize_randomds_proofverify__main)
- [copyBytes(bytes from, uint256 fromOffset, uint256 length, bytes to, uint256 toOffset)](#copybytes)
- [safer_ecrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s)](#safer_ecrecover)
- [ecrecovery(bytes32 hash, bytes sig)](#ecrecovery)
- [safeMemoryCleaner()](#safememorycleaner)

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

### query_withGasLimit

```js
function query_withGasLimit(uint256 _timestamp, string _datasource, string _arg, uint256 _gaslimit) external payable
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _arg | string |  | 
| _gaslimit | uint256 |  | 

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

### query2_withGasLimit

```js
function query2_withGasLimit(uint256 _timestamp, string _datasource, string _arg1, string _arg2, uint256 _gaslimit) external payable
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _arg1 | string |  | 
| _arg2 | string |  | 
| _gaslimit | uint256 |  | 

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

### queryN_withGasLimit

```js
function queryN_withGasLimit(uint256 _timestamp, string _datasource, bytes _argN, uint256 _gaslimit) external payable
returns(_id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _timestamp | uint256 |  | 
| _datasource | string |  | 
| _argN | bytes |  | 
| _gaslimit | uint256 |  | 

### getPrice

```js
function getPrice(string _datasource) public nonpayable
returns(_dsprice uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 

### getPrice

```js
function getPrice(string _datasource, uint256 gaslimit) public nonpayable
returns(_dsprice uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _datasource | string |  | 
| gaslimit | uint256 |  | 

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

### randomDS_getSessionPubKeyHash

```js
function randomDS_getSessionPubKeyHash() external view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getAddress

```js
function getAddress() public nonpayable
returns(_addr address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### init

```js
function init(struct Buffer.buffer buf, uint256 _capacity) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 
| _capacity | uint256 |  | 

### resize

```js
function resize(struct Buffer.buffer buf, uint256 capacity) private pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 
| capacity | uint256 |  | 

### max

```js
function max(uint256 a, uint256 b) private pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### append

Appends a byte array to the end of the buffer. Resizes if doing so
     would exceed the capacity of the buffer.

```js
function append(struct Buffer.buffer buf, bytes data) internal pure
returns(struct Buffer.buffer)
```

**Returns**

The original buffer.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer | The buffer to append to. | 
| data | bytes | The data to append. | 

### append

Appends a byte to the end of the buffer. Resizes if doing so would
exceed the capacity of the buffer.

```js
function append(struct Buffer.buffer buf, uint8 data) internal pure
```

**Returns**

The original buffer.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer | The buffer to append to. | 
| data | uint8 | The data to append. | 

### appendInt

Appends a byte to the end of the buffer. Resizes if doing so would
exceed the capacity of the buffer.

```js
function appendInt(struct Buffer.buffer buf, uint256 data, uint256 len) internal pure
returns(struct Buffer.buffer)
```

**Returns**

The original buffer.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer | The buffer to append to. | 
| data | uint256 | The data to append. | 
| len | uint256 |  | 

### encodeType

```js
function encodeType(struct Buffer.buffer buf, uint8 major, uint256 value) private pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 
| major | uint8 |  | 
| value | uint256 |  | 

### encodeIndefiniteLengthType

```js
function encodeIndefiniteLengthType(struct Buffer.buffer buf, uint8 major) private pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 
| major | uint8 |  | 

### encodeUInt

```js
function encodeUInt(struct Buffer.buffer buf, uint256 value) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 
| value | uint256 |  | 

### encodeInt

```js
function encodeInt(struct Buffer.buffer buf, int256 value) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 
| value | int256 |  | 

### encodeBytes

```js
function encodeBytes(struct Buffer.buffer buf, bytes value) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 
| value | bytes |  | 

### encodeString

```js
function encodeString(struct Buffer.buffer buf, string value) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 
| value | string |  | 

### startArray

```js
function startArray(struct Buffer.buffer buf) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 

### startMap

```js
function startMap(struct Buffer.buffer buf) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 

### endSequence

```js
function endSequence(struct Buffer.buffer buf) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| buf | struct Buffer.buffer |  | 

### oraclize_setNetwork

```js
function oraclize_setNetwork(uint8 networkID) internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| networkID | uint8 |  | 

### oraclize_setNetwork

```js
function oraclize_setNetwork() internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### __callback

```js
function __callback(bytes32 myid, string result) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| myid | bytes32 |  | 
| result | string |  | 

### __callback

```js
function __callback(bytes32 myid, string result, bytes proof) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| myid | bytes32 |  | 
| result | string |  | 
| proof | bytes |  | 

### oraclize_getPrice

```js
function oraclize_getPrice(string datasource) internal nonpayable oraclizeAPI 
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 

### oraclize_getPrice

```js
function oraclize_getPrice(string datasource, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string arg) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| arg | string |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string arg) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| arg | string |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string arg, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| arg | string |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string arg, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| arg | string |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string arg1, string arg2) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| arg1 | string |  | 
| arg2 | string |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string arg1, string arg2) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| arg1 | string |  | 
| arg2 | string |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string arg1, string arg2, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| arg1 | string |  | 
| arg2 | string |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string arg1, string arg2, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| arg1 | string |  | 
| arg2 | string |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[] argN) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| argN | string[] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[] argN) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| argN | string[] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[] argN, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| argN | string[] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[] argN, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| argN | string[] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[1] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | string[1] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[1] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | string[1] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[1] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | string[1] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[1] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | string[1] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[2] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | string[2] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[2] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | string[2] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[2] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | string[2] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[2] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | string[2] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[3] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | string[3] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[3] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | string[3] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[3] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | string[3] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[3] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | string[3] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[4] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | string[4] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[4] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | string[4] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[4] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | string[4] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[4] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | string[4] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[5] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | string[5] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[5] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | string[5] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, string[5] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | string[5] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, string[5] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | string[5] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[] argN) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| argN | bytes[] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[] argN) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| argN | bytes[] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[] argN, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| argN | bytes[] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[] argN, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| argN | bytes[] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[1] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | bytes[1] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[1] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | bytes[1] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[1] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | bytes[1] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[1] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | bytes[1] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[2] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | bytes[2] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[2] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | bytes[2] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[2] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | bytes[2] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[2] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | bytes[2] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[3] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | bytes[3] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[3] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | bytes[3] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[3] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | bytes[3] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[3] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | bytes[3] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[4] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | bytes[4] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[4] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | bytes[4] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[4] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | bytes[4] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[4] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | bytes[4] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[5] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | bytes[5] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[5] args) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | bytes[5] |  | 

### oraclize_query

```js
function oraclize_query(uint256 timestamp, string datasource, bytes[5] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| timestamp | uint256 |  | 
| datasource | string |  | 
| args | bytes[5] |  | 
| gaslimit | uint256 |  | 

### oraclize_query

```js
function oraclize_query(string datasource, bytes[5] args, uint256 gaslimit) internal nonpayable oraclizeAPI 
returns(id bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| datasource | string |  | 
| args | bytes[5] |  | 
| gaslimit | uint256 |  | 

### oraclize_cbAddress

```js
function oraclize_cbAddress() internal nonpayable oraclizeAPI 
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### oraclize_setProof

```js
function oraclize_setProof(bytes1 proofP) internal nonpayable oraclizeAPI 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| proofP | bytes1 |  | 

### oraclize_setCustomGasPrice

```js
function oraclize_setCustomGasPrice(uint256 gasPrice) internal nonpayable oraclizeAPI 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| gasPrice | uint256 |  | 

### oraclize_randomDS_getSessionPubKeyHash

```js
function oraclize_randomDS_getSessionPubKeyHash() internal nonpayable oraclizeAPI 
returns(bytes32)
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

### parseAddr

```js
function parseAddr(string _a) internal pure
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 

### strCompare

```js
function strCompare(string _a, string _b) internal pure
returns(int256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | string |  | 

### indexOf

```js
function indexOf(string _haystack, string _needle) internal pure
returns(int256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _haystack | string |  | 
| _needle | string |  | 

### strConcat

```js
function strConcat(string _a, string _b, string _c, string _d, string _e) internal pure
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | string |  | 
| _c | string |  | 
| _d | string |  | 
| _e | string |  | 

### strConcat

```js
function strConcat(string _a, string _b, string _c, string _d) internal pure
returns(string)
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
function strConcat(string _a, string _b, string _c) internal pure
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | string |  | 
| _c | string |  | 

### strConcat

```js
function strConcat(string _a, string _b) internal pure
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | string |  | 

### parseInt

```js
function parseInt(string _a) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 

### parseInt

```js
function parseInt(string _a, uint256 _b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _a | string |  | 
| _b | uint256 |  | 

### uint2str

```js
function uint2str(uint256 i) internal pure
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| i | uint256 |  | 

### stra2cbor

```js
function stra2cbor(string[] arr) internal pure
returns(bytes)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| arr | string[] |  | 

### ba2cbor

```js
function ba2cbor(bytes[] arr) internal pure
returns(bytes)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| arr | bytes[] |  | 

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
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### oraclize_newRandomDSQuery

```js
function oraclize_newRandomDSQuery(uint256 _delay, uint256 _nbytes, uint256 _customGasLimit) internal nonpayable
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delay | uint256 |  | 
| _nbytes | uint256 |  | 
| _customGasLimit | uint256 |  | 

### oraclize_randomDS_setCommitment

```js
function oraclize_randomDS_setCommitment(bytes32 queryId, bytes32 commitment) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| queryId | bytes32 |  | 
| commitment | bytes32 |  | 

### verifySig

```js
function verifySig(bytes32 tosignh, bytes dersig, bytes pubkey) internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tosignh | bytes32 |  | 
| dersig | bytes |  | 
| pubkey | bytes |  | 

### oraclize_randomDS_proofVerify__sessionKeyValidity

```js
function oraclize_randomDS_proofVerify__sessionKeyValidity(bytes proof, uint256 sig2offset) internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| proof | bytes |  | 
| sig2offset | uint256 |  | 

### oraclize_randomDS_proofVerify__returnCode

```js
function oraclize_randomDS_proofVerify__returnCode(bytes32 _queryId, string _result, bytes _proof) internal nonpayable
returns(uint8)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _queryId | bytes32 |  | 
| _result | string |  | 
| _proof | bytes |  | 

### matchBytes32Prefix

```js
function matchBytes32Prefix(bytes32 content, bytes prefix, uint256 n_random_bytes) internal pure
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| content | bytes32 |  | 
| prefix | bytes |  | 
| n_random_bytes | uint256 |  | 

### oraclize_randomDS_proofVerify__main

```js
function oraclize_randomDS_proofVerify__main(bytes proof, bytes32 queryId, bytes result, string context_name) internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| proof | bytes |  | 
| queryId | bytes32 |  | 
| result | bytes |  | 
| context_name | string |  | 

### copyBytes

```js
function copyBytes(bytes from, uint256 fromOffset, uint256 length, bytes to, uint256 toOffset) internal pure
returns(bytes)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| from | bytes |  | 
| fromOffset | uint256 |  | 
| length | uint256 |  | 
| to | bytes |  | 
| toOffset | uint256 |  | 

### safer_ecrecover

```js
function safer_ecrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal nonpayable
returns(bool, address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| hash | bytes32 |  | 
| v | uint8 |  | 
| r | bytes32 |  | 
| s | bytes32 |  | 

### ecrecovery

```js
function ecrecovery(bytes32 hash, bytes sig) internal nonpayable
returns(bool, address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| hash | bytes32 |  | 
| sig | bytes |  | 

### safeMemoryCleaner

```js
function safeMemoryCleaner() internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

