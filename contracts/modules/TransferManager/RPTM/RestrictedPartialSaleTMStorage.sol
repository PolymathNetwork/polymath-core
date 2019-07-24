pragma solidity ^0.5.8;

contract RestrictedPartialSaleTMStorage {

    // permission definition
    bytes32 internal constant OPERATOR = "OPERATOR";

    address[] exemptAddresses;

    mapping(address => uint256) exemptIndex;

}