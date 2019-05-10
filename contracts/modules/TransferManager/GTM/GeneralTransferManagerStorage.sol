pragma solidity ^0.5.0;

/**
 * @title Transfer Manager module for core transfer validation functionality
 */
contract GeneralTransferManagerStorage {

    // Map of used nonces by customer
    mapping(address => mapping(uint256 => bool)) public nonceMap;
}
