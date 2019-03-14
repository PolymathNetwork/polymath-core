pragma solidity ^0.5.0;

contract OZStorage {

    mapping (address => uint256) private _balances;

    mapping (address => mapping (address => uint256)) private _allowed;

    uint256 private _totalSupply;

    address private _owner;

    /// @dev counter to allow mutex lock with only one SSTORE operation
    uint256 private _guardCounter;

    function totalSupply() internal view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _investor) internal view returns(uint256) {
        return _balances[_investor];
    }

}
