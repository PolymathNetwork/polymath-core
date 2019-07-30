pragma solidity 0.5.8;

/* 
 * @dev It is the contract that contains the storage items related to the ERC20 contract implementaiton
 * of the openzeppelin-solidity. Used to allow the storage declaration of ERC20 to the STGetter contract
*/

contract OZStorage {

    mapping (address => uint256) private _balances;

    mapping (address => mapping (address => uint256)) private _allowed;

    uint256 private _totalSupply;

    /// @dev counter to allow mutex lock with only one SSTORE operation
    uint256 private _guardCounter;

    function totalSupply() internal view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _investor) internal view returns(uint256) {
        return _balances[_investor];
    }

    function _allowance(address owner, address spender) internal view returns(uint256) {
        return _allowed[owner][spender];
    }

}
