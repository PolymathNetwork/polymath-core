pragma solidity ^0.5.0;

contract OZStorage {

    mapping (address => uint256) private _balances;

    mapping (address => mapping (address => uint256)) private _allowed;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    address private _owner;

    /// @dev counter to allow mutex lock with only one SSTORE operation
    uint256 private _guardCounter;

}