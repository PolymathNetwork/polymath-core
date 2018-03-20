pragma solidity ^0.4.18;

interface IDelegable {

    function grantPermission(address _delegate, address _module) public;

    /// WIP
    function checkPermissions(address _module, address _delegate) public;

}

contract DelegablePorting {

    IDelegable delegable;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyOwnerOrDelegates {
        require((msg.sender == owner) || validateDelegate(msg.sender));
        _;
    }

    function DelegablePorting(address _owner, address _delegable) public {
        owner = _owner;
        delegable = IDelegable(_delegable);
    }

    function grantPermToDelegate(address _delegate) onlyOwner public {
        require(_delegate != address(0));
        delegable.grantPermission(_delegate, this);
    }

    function grantPermToDelegatesMulti(address[] _delegates) onlyOwner public {
        for (uint i = 0; i < _delegates.length; i++) {
            grantPermToDelegate(_delegates[i]);
        }
    }

    // TODO : to check according to the permission 
    function validateDelegate(address _delegate) public returns(bool) {
        // TODO: not decided yet the return value of the checkPermissions 
        delegable.checkPermissions(this, _delegate);
        return true;
    }


}