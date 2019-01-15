pragma solidity ^0.5.0;

import "./Proxy.sol";

/**
 * @title OwnedProxy
 * @dev This contract combines an upgradeability proxy with basic authorization control functionalities
 */
contract OwnedProxy is Proxy {
    // Owner of the contract
    address private __owner;

    // Address of the current implementation
    address internal __implementation;

    /**
    * @dev Event to show ownership has been transferred
    * @param _previousOwner representing the address of the previous owner
    * @param _newOwner representing the address of the new owner
    */
    event ProxyOwnershipTransferred(address _previousOwner, address _newOwner);

    /**
    * @dev Throws if called by any account other than the owner.
    */
    modifier ifOwner() {
        if (msg.sender == _owner()) {
            _;
        } else {
            _fallback();
        }
    }

    /**
    * @dev the constructor sets the original owner of the contract to the sender account.
    */
    constructor() public {
        _setOwner(msg.sender);
    }

    /**
    * @dev Tells the address of the owner
    * @return the address of the owner
    */
    function _owner() internal view returns(address) {
        return __owner;
    }

    /**
    * @dev Sets the address of the owner
    */
    function _setOwner(address _newOwner) internal {
        require(_newOwner != address(0), "Address should not be 0x");
        __owner = _newOwner;
    }

    /**
    * @notice Internal function to provide the address of the implementation contract
    */
    function _implementation() internal view returns(address) {
        return __implementation;
    }

    /**
    * @dev Tells the address of the proxy owner
    * @return the address of the proxy owner
    */
    function proxyOwner() external ifOwner returns(address) {
        return _owner();
    }

    /**
    * @dev Tells the address of the current implementation
    * @return address of the current implementation
    */
    function implementation() external ifOwner returns(address) {
        return _implementation();
    }

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param _newOwner The address to transfer ownership to.
    */
    function transferProxyOwnership(address _newOwner) external ifOwner {
        require(_newOwner != address(0), "Address should not be 0x");
        emit ProxyOwnershipTransferred(_owner(), _newOwner);
        _setOwner(_newOwner);
    }

}
