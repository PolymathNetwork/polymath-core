pragma solidity ^0.5.0;

/**
 * @title Contract used to store layout for the PreSaleSTO storage
 */
contract PreSaleSTOStorage {

    bytes32 public constant PRE_SALE_ADMIN = "PRE_SALE_ADMIN";

    mapping (address => uint256) public investors;

}