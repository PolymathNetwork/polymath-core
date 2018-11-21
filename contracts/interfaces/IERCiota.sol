pragma solidity ^0.4.24;

contract IERCiota {
	mapping (bytes32 => uint256) public uintData;
	mapping (bytes32 => bytes32) public bytes32Data; //Optional
	mapping (bytes32 => address) public addressData;
	mapping (bytes32 => string) public stringData; //Optional
	mapping (bytes32 => bytes) public bytesData;
	mapping (bytes32 => bool) public boolData;
	mapping (bytes32 => uint256[]) public uintArrayData;
	mapping (bytes32 => bytes32[]) public bytes32ArrayData; //Optional
	mapping (bytes32 => address[]) public addressArrayData;
	mapping (bytes32 => bool[]) public boolArrayData;
	mapping (address => uint256) public identityId;
	mapping (uint256 => address[]) public identityAddresses;
	uint256 totalIdentities;

	function setData(bytes32 _key, uint256 _data) public;
}