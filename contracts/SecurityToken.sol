pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import './interfaces/ITransferManager.sol';
import './interfaces/IST20.sol';

contract SecurityToken is StandardToken, IST20 {

    // Owner of the ST
    address public owner;

    ITransferManager TransferManager;

    modifier onlyOwner {
      require(msg.sender == owner);
      _;
    }

    function SecurityToken(address _owner, uint256 _totalSupply, string _name, string _symbol, uint8 _decimals) public
     DetailedERC20(_name, _symbol, _decimals)
    {
        require(_owner != address(0));
        require(_totalSupply > 0);
        owner = _owner;
        totalSupply_ = _totalSupply;
        allocateSecurities();
    }

    function setTransferManager(address _transferManager) public onlyOwner {
        TransferManager = ITransferManager(_transferManager);
        //TODO: emit an event
    }

    /**
     * @dev Allocate all the pre-mint supply of securities token to owner
     */
    function allocateSecurities() internal {
        balances[owner] = totalSupply_;
        Transfer(address(0), owner, totalSupply_);
    }

    /**
     * @dev Overladed version of the transfer function
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(verifyTransfer(msg.sender, _to));
        return super.transfer(_to, _value);
    }

    /**
     * @dev Overladed version of the transferFrom function
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(verifyTransfer(_from, _to));
        return super.transferFrom(_from, _to, _value);
    }

    // Delegates this to TransferManager - if no transfer manager set, this will throw
    function verifyTransfer(address _from, address _to) public returns (bool success) {
        return TransferManager.verifyTransfer(_from, _to);
    }

}
