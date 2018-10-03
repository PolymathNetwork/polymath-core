pragma solidity ^0.4.24;

library Encoder {

    function getKey(string _key) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key)));
    }

    function getKey(string _key1, address _key2) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }

    function getKey(string _key1, string _key2) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }

    function getKey(string _key1, uint256 _key2) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }

    function getKey(string _key1, bytes32 _key2) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }

    function getKey(string _key1, bool _key2) internal pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(_key1, _key2)));
    }

}
