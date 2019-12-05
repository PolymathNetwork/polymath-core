---
id: version-3.0.0-OraclizeI
title: OraclizeI
original_id: OraclizeI
---

# OraclizeI.sol

View Source: [contracts/external/oraclizeAPI.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/external/oraclizeAPI.sol)

**OraclizeI**

## Structs

### buffer

```javascript
struct buffer {
 bytes buf,
 uint256 capacity
}
```

## Contract Members

**Constants & Variables**

```javascript
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

* [oraclizeAPI](oraclizei.md#oraclizeapi)
* [oraclize\_randomDS\_proofVerify](oraclizei.md#oraclize_randomds_proofverify)

### oraclizeAPI

```javascript
modifier oraclizeAPI() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### oraclize\_randomDS\_proofVerify

```javascript
modifier oraclize_randomDS_proofVerify(bytes32 _queryId, string _result, bytes _proof) internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_queryId | bytes32 |  |
| \_result | string |  |
| \_proof | bytes |  |

## Functions

* [f\(bytes x\)](oraclizei.md#f)
* [setProofType\(bytes1 \_proofType\)](oraclizei.md#setprooftype)
* [setCustomGasPrice\(uint256 \_gasPrice\)](oraclizei.md#setcustomgasprice)
* [getPrice\(string \_datasource\)](oraclizei.md#getprice)
* [randomDS\_getSessionPubKeyHash\(\)](oraclizei.md#randomds_getsessionpubkeyhash)
* [getPrice\(string \_datasource, uint256 \_gasLimit\)](oraclizei.md#getprice)
* [queryN\(uint256 \_timestamp, string \_datasource, bytes \_argN\)](oraclizei.md#queryn)
* [query\(uint256 \_timestamp, string \_datasource, string \_arg\)](oraclizei.md#query)
* [query2\(uint256 \_timestamp, string \_datasource, string \_arg1, string \_arg2\)](oraclizei.md#query2)
* [query\_withGasLimit\(uint256 \_timestamp, string \_datasource, string \_arg, uint256 \_gasLimit\)](oraclizei.md#query_withgaslimit)
* [queryN\_withGasLimit\(uint256 \_timestamp, string \_datasource, bytes \_argN, uint256 \_gasLimit\)](oraclizei.md#queryn_withgaslimit)
* [query2\_withGasLimit\(uint256 \_timestamp, string \_datasource, string \_arg1, string \_arg2, uint256 \_gasLimit\)](oraclizei.md#query2_withgaslimit)
* [getAddress\(\)](oraclizei.md#getaddress)
* [init\(struct Buffer.buffer \_buf, uint256 \_capacity\)](oraclizei.md#init)
* [resize\(struct Buffer.buffer \_buf, uint256 \_capacity\)](oraclizei.md#resize)
* [max\(uint256 \_a, uint256 \_b\)](oraclizei.md#max)
* [append\(struct Buffer.buffer \_buf, bytes \_data\)](oraclizei.md#append)
* [append\(struct Buffer.buffer \_buf, uint8 \_data\)](oraclizei.md#append)
* [appendInt\(struct Buffer.buffer \_buf, uint256 \_data, uint256 \_len\)](oraclizei.md#appendint)
* [encodeType\(struct Buffer.buffer \_buf, uint8 \_major, uint256 \_value\)](oraclizei.md#encodetype)
* [encodeIndefiniteLengthType\(struct Buffer.buffer \_buf, uint8 \_major\)](oraclizei.md#encodeindefinitelengthtype)
* [encodeUInt\(struct Buffer.buffer \_buf, uint256 \_value\)](oraclizei.md#encodeuint)
* [encodeInt\(struct Buffer.buffer \_buf, int256 \_value\)](oraclizei.md#encodeint)
* [encodeBytes\(struct Buffer.buffer \_buf, bytes \_value\)](oraclizei.md#encodebytes)
* [encodeString\(struct Buffer.buffer \_buf, string \_value\)](oraclizei.md#encodestring)
* [startArray\(struct Buffer.buffer \_buf\)](oraclizei.md#startarray)
* [startMap\(struct Buffer.buffer \_buf\)](oraclizei.md#startmap)
* [endSequence\(struct Buffer.buffer \_buf\)](oraclizei.md#endsequence)
* [oraclize\_setNetwork\(uint8 \_networkID\)](oraclizei.md#oraclize_setnetwork)
* [oraclize\_setNetworkName\(string \_network\_name\)](oraclizei.md#oraclize_setnetworkname)
* [oraclize\_getNetworkName\(\)](oraclizei.md#oraclize_getnetworkname)
* [oraclize\_setNetwork\(\)](oraclizei.md#oraclize_setnetwork)
* [\_\_callback\(bytes32 \_myid, string \_result\)](oraclizei.md#__callback)
* [\_\_callback\(bytes32 \_myid, string \_result, bytes \_proof\)](oraclizei.md#__callback)
* [oraclize\_getPrice\(string \_datasource\)](oraclizei.md#oraclize_getprice)
* [oraclize\_getPrice\(string \_datasource, uint256 \_gasLimit\)](oraclizei.md#oraclize_getprice)
* [oraclize\_query\(string \_datasource, string \_arg\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string \_arg\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string \_arg, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string \_arg, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string \_arg1, string \_arg2\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string \_arg1, string \_arg2\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string \_arg1, string \_arg2, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string \_arg1, string \_arg2, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[\] \_argN\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[\] \_argN\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[\] \_argN, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[\] \_argN, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[1\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[1\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[1\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[1\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[2\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[2\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[2\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[2\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[3\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[3\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[3\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[3\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[4\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[4\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[4\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[4\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[5\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[5\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, string\[5\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, string\[5\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[\] \_argN\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[\] \_argN\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[\] \_argN, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[\] \_argN, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[1\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[1\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[1\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[1\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[2\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[2\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[2\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[2\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[3\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[3\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[3\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[3\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[4\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[4\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[4\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[4\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[5\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[5\] \_args\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(uint256 \_timestamp, string \_datasource, bytes\[5\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_query\(string \_datasource, bytes\[5\] \_args, uint256 \_gasLimit\)](oraclizei.md#oraclize_query)
* [oraclize\_setProof\(bytes1 \_proofP\)](oraclizei.md#oraclize_setproof)
* [oraclize\_cbAddress\(\)](oraclizei.md#oraclize_cbaddress)
* [getCodeSize\(address \_addr\)](oraclizei.md#getcodesize)
* [oraclize\_setCustomGasPrice\(uint256 \_gasPrice\)](oraclizei.md#oraclize_setcustomgasprice)
* [oraclize\_randomDS\_getSessionPubKeyHash\(\)](oraclizei.md#oraclize_randomds_getsessionpubkeyhash)
* [parseAddr\(string \_a\)](oraclizei.md#parseaddr)
* [strCompare\(string \_a, string \_b\)](oraclizei.md#strcompare)
* [indexOf\(string \_haystack, string \_needle\)](oraclizei.md#indexof)
* [strConcat\(string \_a, string \_b\)](oraclizei.md#strconcat)
* [strConcat\(string \_a, string \_b, string \_c\)](oraclizei.md#strconcat)
* [strConcat\(string \_a, string \_b, string \_c, string \_d\)](oraclizei.md#strconcat)
* [strConcat\(string \_a, string \_b, string \_c, string \_d, string \_e\)](oraclizei.md#strconcat)
* [safeParseInt\(string \_a\)](oraclizei.md#safeparseint)
* [safeParseInt\(string \_a, uint256 \_b\)](oraclizei.md#safeparseint)
* [parseInt\(string \_a\)](oraclizei.md#parseint)
* [parseInt\(string \_a, uint256 \_b\)](oraclizei.md#parseint)
* [uint2str\(uint256 \_i\)](oraclizei.md#uint2str)
* [stra2cbor\(string\[\] \_arr\)](oraclizei.md#stra2cbor)
* [ba2cbor\(bytes\[\] \_arr\)](oraclizei.md#ba2cbor)
* [oraclize\_newRandomDSQuery\(uint256 \_delay, uint256 \_nbytes, uint256 \_customGasLimit\)](oraclizei.md#oraclize_newrandomdsquery)
* [oraclize\_randomDS\_setCommitment\(bytes32 \_queryId, bytes32 \_commitment\)](oraclizei.md#oraclize_randomds_setcommitment)
* [verifySig\(bytes32 \_tosignh, bytes \_dersig, bytes \_pubkey\)](oraclizei.md#verifysig)
* [oraclize\_randomDS\_proofVerify\_\_sessionKeyValidity\(bytes \_proof, uint256 \_sig2offset\)](oraclizei.md#oraclize_randomds_proofverify__sessionkeyvalidity)
* [oraclize\_randomDS\_proofVerify\_\_returnCode\(bytes32 \_queryId, string \_result, bytes \_proof\)](oraclizei.md#oraclize_randomds_proofverify__returncode)
* [matchBytes32Prefix\(bytes32 \_content, bytes \_prefix, uint256 \_nRandomBytes\)](oraclizei.md#matchbytes32prefix)
* [oraclize\_randomDS\_proofVerify\_\_main\(bytes \_proof, bytes32 \_queryId, bytes \_result, string \_contextName\)](oraclizei.md#oraclize_randomds_proofverify__main)
* [copyBytes\(bytes \_from, uint256 \_fromOffset, uint256 \_length, bytes \_to, uint256 \_toOffset\)](oraclizei.md#copybytes)
* [safer\_ecrecover\(bytes32 \_hash, uint8 \_v, bytes32 \_r, bytes32 \_s\)](oraclizei.md#safer_ecrecover)
* [ecrecovery\(bytes32 \_hash, bytes \_sig\)](oraclizei.md#ecrecovery)
* [safeMemoryCleaner\(\)](oraclizei.md#safememorycleaner)

### f

```javascript
function f(bytes x) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| x | bytes |  |

### setProofType

```javascript
function setProofType(bytes1 _proofType) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_proofType | bytes1 |  |

### setCustomGasPrice

```javascript
function setCustomGasPrice(uint256 _gasPrice) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_gasPrice | uint256 |  |

### getPrice

```javascript
function getPrice(string _datasource) public nonpayable
returns(_dsprice uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |

### randomDS\_getSessionPubKeyHash

```javascript
function randomDS_getSessionPubKeyHash() external view
returns(_sessionKeyHash bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getPrice

```javascript
function getPrice(string _datasource, uint256 _gasLimit) public nonpayable
returns(_dsprice uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_gasLimit | uint256 |  |

### queryN

```javascript
function queryN(uint256 _timestamp, string _datasource, bytes _argN) public payable
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_argN | bytes |  |

### query

```javascript
function query(uint256 _timestamp, string _datasource, string _arg) external payable
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_arg | string |  |

### query2

```javascript
function query2(uint256 _timestamp, string _datasource, string _arg1, string _arg2) public payable
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_arg1 | string |  |
| \_arg2 | string |  |

### query\_withGasLimit

```javascript
function query_withGasLimit(uint256 _timestamp, string _datasource, string _arg, uint256 _gasLimit) external payable
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_arg | string |  |
| \_gasLimit | uint256 |  |

### queryN\_withGasLimit

```javascript
function queryN_withGasLimit(uint256 _timestamp, string _datasource, bytes _argN, uint256 _gasLimit) external payable
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_argN | bytes |  |
| \_gasLimit | uint256 |  |

### query2\_withGasLimit

```javascript
function query2_withGasLimit(uint256 _timestamp, string _datasource, string _arg1, string _arg2, uint256 _gasLimit) external payable
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_arg1 | string |  |
| \_arg2 | string |  |
| \_gasLimit | uint256 |  |

### getAddress

```javascript
function getAddress() public nonpayable
returns(_address address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### init

```javascript
function init(struct Buffer.buffer _buf, uint256 _capacity) internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |
| \_capacity | uint256 |  |

### resize

```javascript
function resize(struct Buffer.buffer _buf, uint256 _capacity) private pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |
| \_capacity | uint256 |  |

### max

```javascript
function max(uint256 _a, uint256 _b) private pure
returns(_max uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | uint256 |  |
| \_b | uint256 |  |

### append

Appends a byte array to the end of the buffer. Resizes if doing so would exceed the capacity of the buffer.

```javascript
function append(struct Buffer.buffer _buf, bytes _data) internal pure
returns(_buffer struct Buffer.buffer)
```

**Returns**

The original buffer.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer | The buffer to append to. |
| \_data | bytes | The data to append. |

### append

Appends a byte to the end of the buffer. Resizes if doing so would exceed the capacity of the buffer.

```javascript
function append(struct Buffer.buffer _buf, uint8 _data) internal pure
```

**Returns**

The original buffer.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer | The buffer to append to. |
| \_data | uint8 | The data to append. |

### appendInt

Appends a byte to the end of the buffer. Resizes if doing so would exceed the capacity of the buffer.

```javascript
function appendInt(struct Buffer.buffer _buf, uint256 _data, uint256 _len) internal pure
returns(_buffer struct Buffer.buffer)
```

**Returns**

The original buffer.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer | The buffer to append to. |
| \_data | uint256 | The data to append. |
| \_len | uint256 |  |

### encodeType

```javascript
function encodeType(struct Buffer.buffer _buf, uint8 _major, uint256 _value) private pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |
| \_major | uint8 |  |
| \_value | uint256 |  |

### encodeIndefiniteLengthType

```javascript
function encodeIndefiniteLengthType(struct Buffer.buffer _buf, uint8 _major) private pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |
| \_major | uint8 |  |

### encodeUInt

```javascript
function encodeUInt(struct Buffer.buffer _buf, uint256 _value) internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |
| \_value | uint256 |  |

### encodeInt

```javascript
function encodeInt(struct Buffer.buffer _buf, int256 _value) internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |
| \_value | int256 |  |

### encodeBytes

```javascript
function encodeBytes(struct Buffer.buffer _buf, bytes _value) internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |
| \_value | bytes |  |

### encodeString

```javascript
function encodeString(struct Buffer.buffer _buf, string _value) internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |
| \_value | string |  |

### startArray

```javascript
function startArray(struct Buffer.buffer _buf) internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |

### startMap

```javascript
function startMap(struct Buffer.buffer _buf) internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |

### endSequence

```javascript
function endSequence(struct Buffer.buffer _buf) internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_buf | struct Buffer.buffer |  |

### oraclize\_setNetwork

```javascript
function oraclize_setNetwork(uint8 _networkID) internal nonpayable
returns(_networkSet bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_networkID | uint8 |  |

### oraclize\_setNetworkName

```javascript
function oraclize_setNetworkName(string _network_name) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_network\_name | string |  |

### oraclize\_getNetworkName

```javascript
function oraclize_getNetworkName() internal view
returns(_networkName string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### oraclize\_setNetwork

```javascript
function oraclize_setNetwork() internal nonpayable
returns(_networkSet bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_\_callback

```javascript
function __callback(bytes32 _myid, string _result) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_myid | bytes32 |  |
| \_result | string |  |

### \_\_callback

```javascript
function __callback(bytes32 _myid, string _result, bytes _proof) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_myid | bytes32 |  |
| \_result | string |  |
| \_proof | bytes |  |

### oraclize\_getPrice

```javascript
function oraclize_getPrice(string _datasource) internal nonpayable oraclizeAPI 
returns(_queryPrice uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |

### oraclize\_getPrice

```javascript
function oraclize_getPrice(string _datasource, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_queryPrice uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string _arg) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_arg | string |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string _arg) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_arg | string |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string _arg, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_arg | string |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string _arg, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_arg | string |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string _arg1, string _arg2) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_arg1 | string |  |
| \_arg2 | string |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string _arg1, string _arg2) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_arg1 | string |  |
| \_arg2 | string |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string _arg1, string _arg2, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_arg1 | string |  |
| \_arg2 | string |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string _arg1, string _arg2, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_arg1 | string |  |
| \_arg2 | string |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[] _argN) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_argN | string\[\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[] _argN) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_argN | string\[\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[] _argN, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_argN | string\[\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[] _argN, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_argN | string\[\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[1] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | string\[1\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[1] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | string\[1\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[1] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | string\[1\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[1] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | string\[1\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[2] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | string\[2\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[2] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | string\[2\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[2] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | string\[2\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[2] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | string\[2\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[3] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | string\[3\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[3] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | string\[3\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[3] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | string\[3\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[3] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | string\[3\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[4] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | string\[4\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[4] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | string\[4\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[4] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | string\[4\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[4] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | string\[4\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[5] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | string\[5\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[5] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | string\[5\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, string[5] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | string\[5\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, string[5] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | string\[5\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[] _argN) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_argN | bytes\[\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[] _argN) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_argN | bytes\[\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[] _argN, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_argN | bytes\[\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[] _argN, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_argN | bytes\[\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[1] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | bytes\[1\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[1] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | bytes\[1\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[1] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | bytes\[1\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[1] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | bytes\[1\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[2] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | bytes\[2\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[2] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | bytes\[2\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[2] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | bytes\[2\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[2] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | bytes\[2\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[3] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | bytes\[3\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[3] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | bytes\[3\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[3] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | bytes\[3\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[3] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | bytes\[3\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[4] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | bytes\[4\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[4] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | bytes\[4\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[4] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | bytes\[4\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[4] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | bytes\[4\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[5] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | bytes\[5\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[5] _args) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | bytes\[5\] |  |

### oraclize\_query

```javascript
function oraclize_query(uint256 _timestamp, string _datasource, bytes[5] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_timestamp | uint256 |  |
| \_datasource | string |  |
| \_args | bytes\[5\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_query

```javascript
function oraclize_query(string _datasource, bytes[5] _args, uint256 _gasLimit) internal nonpayable oraclizeAPI 
returns(_id bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_datasource | string |  |
| \_args | bytes\[5\] |  |
| \_gasLimit | uint256 |  |

### oraclize\_setProof

```javascript
function oraclize_setProof(bytes1 _proofP) internal nonpayable oraclizeAPI
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_proofP | bytes1 |  |

### oraclize\_cbAddress

```javascript
function oraclize_cbAddress() internal nonpayable oraclizeAPI 
returns(_callbackAddress address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getCodeSize

```javascript
function getCodeSize(address _addr) internal view
returns(_size uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_addr | address |  |

### oraclize\_setCustomGasPrice

```javascript
function oraclize_setCustomGasPrice(uint256 _gasPrice) internal nonpayable oraclizeAPI
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_gasPrice | uint256 |  |

### oraclize\_randomDS\_getSessionPubKeyHash

```javascript
function oraclize_randomDS_getSessionPubKeyHash() internal nonpayable oraclizeAPI 
returns(_sessionKeyHash bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### parseAddr

```javascript
function parseAddr(string _a) internal pure
returns(_parsedAddress address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | string |  |

### strCompare

```javascript
function strCompare(string _a, string _b) internal pure
returns(_returnCode int256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | string |  |
| \_b | string |  |

### indexOf

```javascript
function indexOf(string _haystack, string _needle) internal pure
returns(_returnCode int256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_haystack | string |  |
| \_needle | string |  |

### strConcat

```javascript
function strConcat(string _a, string _b) internal pure
returns(_concatenatedString string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | string |  |
| \_b | string |  |

### strConcat

```javascript
function strConcat(string _a, string _b, string _c) internal pure
returns(_concatenatedString string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | string |  |
| \_b | string |  |
| \_c | string |  |

### strConcat

```javascript
function strConcat(string _a, string _b, string _c, string _d) internal pure
returns(_concatenatedString string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | string |  |
| \_b | string |  |
| \_c | string |  |
| \_d | string |  |

### strConcat

```javascript
function strConcat(string _a, string _b, string _c, string _d, string _e) internal pure
returns(_concatenatedString string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | string |  |
| \_b | string |  |
| \_c | string |  |
| \_d | string |  |
| \_e | string |  |

### safeParseInt

```javascript
function safeParseInt(string _a) internal pure
returns(_parsedInt uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | string |  |

### safeParseInt

```javascript
function safeParseInt(string _a, uint256 _b) internal pure
returns(_parsedInt uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | string |  |
| \_b | uint256 |  |

### parseInt

```javascript
function parseInt(string _a) internal pure
returns(_parsedInt uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | string |  |

### parseInt

```javascript
function parseInt(string _a, uint256 _b) internal pure
returns(_parsedInt uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | string |  |
| \_b | uint256 |  |

### uint2str

```javascript
function uint2str(uint256 _i) internal pure
returns(_uintAsString string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_i | uint256 |  |

### stra2cbor

```javascript
function stra2cbor(string[] _arr) internal pure
returns(_cborEncoding bytes)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_arr | string\[\] |  |

### ba2cbor

```javascript
function ba2cbor(bytes[] _arr) internal pure
returns(_cborEncoding bytes)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_arr | bytes\[\] |  |

### oraclize\_newRandomDSQuery

```javascript
function oraclize_newRandomDSQuery(uint256 _delay, uint256 _nbytes, uint256 _customGasLimit) internal nonpayable
returns(_queryId bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delay | uint256 |  |
| \_nbytes | uint256 |  |
| \_customGasLimit | uint256 |  |

### oraclize\_randomDS\_setCommitment

```javascript
function oraclize_randomDS_setCommitment(bytes32 _queryId, bytes32 _commitment) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_queryId | bytes32 |  |
| \_commitment | bytes32 |  |

### verifySig

```javascript
function verifySig(bytes32 _tosignh, bytes _dersig, bytes _pubkey) internal nonpayable
returns(_sigVerified bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tosignh | bytes32 |  |
| \_dersig | bytes |  |
| \_pubkey | bytes |  |

### oraclize\_randomDS\_proofVerify\_\_sessionKeyValidity

```javascript
function oraclize_randomDS_proofVerify__sessionKeyValidity(bytes _proof, uint256 _sig2offset) internal nonpayable
returns(_proofVerified bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_proof | bytes |  |
| \_sig2offset | uint256 |  |

### oraclize\_randomDS\_proofVerify\_\_returnCode

```javascript
function oraclize_randomDS_proofVerify__returnCode(bytes32 _queryId, string _result, bytes _proof) internal nonpayable
returns(_returnCode uint8)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_queryId | bytes32 |  |
| \_result | string |  |
| \_proof | bytes |  |

### matchBytes32Prefix

```javascript
function matchBytes32Prefix(bytes32 _content, bytes _prefix, uint256 _nRandomBytes) internal pure
returns(_matchesPrefix bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_content | bytes32 |  |
| \_prefix | bytes |  |
| \_nRandomBytes | uint256 |  |

### oraclize\_randomDS\_proofVerify\_\_main

```javascript
function oraclize_randomDS_proofVerify__main(bytes _proof, bytes32 _queryId, bytes _result, string _contextName) internal nonpayable
returns(_proofVerified bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_proof | bytes |  |
| \_queryId | bytes32 |  |
| \_result | bytes |  |
| \_contextName | string |  |

### copyBytes

```javascript
function copyBytes(bytes _from, uint256 _fromOffset, uint256 _length, bytes _to, uint256 _toOffset) internal pure
returns(_copiedBytes bytes)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | bytes |  |
| \_fromOffset | uint256 |  |
| \_length | uint256 |  |
| \_to | bytes |  |
| \_toOffset | uint256 |  |

### safer\_ecrecover

```javascript
function safer_ecrecover(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal nonpayable
returns(_success bool, _recoveredAddress address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_hash | bytes32 |  |
| \_v | uint8 |  |
| \_r | bytes32 |  |
| \_s | bytes32 |  |

### ecrecovery

```javascript
function ecrecovery(bytes32 _hash, bytes _sig) internal nonpayable
returns(_success bool, _recoveredAddress address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_hash | bytes32 |  |
| \_sig | bytes |  |

### safeMemoryCleaner

```javascript
function safeMemoryCleaner() internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


