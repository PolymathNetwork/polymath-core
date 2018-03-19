pragma solidity ^0.4.18;

import './../interfaces/IDelegable.sol';

contract DelegablePorting {

    IDelegable delegable;

    // Ethereum address of the owner of the module
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    // Restrict the access to the owner or the validate delegate only
    modifier onlyOwnerOrDelegates {
        require((msg.sender == owner) || validateDelegate(msg.sender));
        _;
    }

    /**
     * @dev Constructor
     * @param _owner Ethereum address of the owner
     * @param _delegable Ethereum contract address of the delegable
     */
    function DelegablePorting(address _owner, address _delegable) public {
        owner = _owner;
        delegable = IDelegable(_delegable);
    }

    /**
     * @dev Use to grant the permission to the delegate
     * @param _delegate Ethereum address of the delegate
     * @param _signatures Function signatures which are granted to access by the delegate
     */
    function grantPermToDelegate(address _delegate, bytes4[] _signatures) onlyOwner public {
        require(_delegate != address(0));
        delegable.grantPermission(_delegate, this, _signatures);
    }

    /**
     * @dev Use to grant the permission to more than one delegatea
     * @param _delegates Array of addresses of delegates
     * @param _signatures Array of function signature of the contract
     */
    function grantPermToDelegatesMulti(address[] _delegates, bytes4[] _signatures) onlyOwner public {
        for (uint i = 0; i < _delegates.length; i++) {
            grantPermToDelegate(_delegates[i], _signatures);
        }
    }

    /**
     * @dev validate the delegate. It checks whether the particular delegate have the required permission or not
     * @param _delegate Ethereum Address of the delegate
     * @return bool
     */
    function validateDelegate(address _delegate) public returns(bool) {
        require(delegable.checkPermissions(this, _delegate, msg.sig));
        return true;
    }

}
