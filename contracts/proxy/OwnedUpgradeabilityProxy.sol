pragma solidity ^0.5.0;

import "./UpgradeabilityProxy.sol";

/**
 * @title OwnedUpgradeabilityProxy
 * @dev This contract combines an upgradeability proxy with basic authorization control functionalities
 */
contract OwnedUpgradeabilityProxy is UpgradeabilityProxy {
    // Owner of the contract
    address private __upgradeabilityOwner;

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
        if (msg.sender == _upgradeabilityOwner()) {
            _;
        } else {
            _fallback();
        }
    }

    /**
    * @dev the constructor sets the original owner of the contract to the sender account.
    */
    constructor() public {
        _setUpgradeabilityOwner(msg.sender);
    }

    /**
    * @dev Tells the address of the owner
    * @return the address of the owner
    */
    function _upgradeabilityOwner() internal view returns(address) {
        return __upgradeabilityOwner;
    }

    /**
    * @dev Sets the address of the owner
    */
    function _setUpgradeabilityOwner(address _newUpgradeabilityOwner) internal {
        require(_newUpgradeabilityOwner != address(0), "Address should not be 0x");
        __upgradeabilityOwner = _newUpgradeabilityOwner;
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
        return _upgradeabilityOwner();
    }

    /**
    * @dev Tells the version name of the current implementation
    * @return string representing the name of the current version
    */
    function version() external ifOwner returns(string memory) {
        return __version;
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
        emit ProxyOwnershipTransferred(_upgradeabilityOwner(), _newOwner);
        _setUpgradeabilityOwner(_newOwner);
    }

    /**
    * @dev Allows the upgradeability owner to upgrade the current version of the proxy.
    * @param _newVersion representing the version name of the new implementation to be set.
    * @param _newImplementation representing the address of the new implementation to be set.
    */
    function upgradeTo(string calldata _newVersion, address _newImplementation) external ifOwner {
        _upgradeTo(_newVersion, _newImplementation);
    }

    /**
    * @dev Allows the upgradeability owner to upgrade the current version of the proxy and call the new implementation
    * to initialize whatever is needed through a low level call.
    * @param _newVersion representing the version name of the new implementation to be set.
    * @param _newImplementation representing the address of the new implementation to be set.
    * @param _data represents the msg.data to bet sent in the low level call. This parameter may include the function
    * signature of the implementation to be called with the needed payload
    */
    function upgradeToAndCall(string calldata _newVersion, address _newImplementation, bytes calldata _data) external payable ifOwner {
        _upgradeToAndCall(_newVersion, _newImplementation, _data);
    }

    function _upgradeToAndCall(string memory _newVersion, address _newImplementation, bytes memory _data) internal {
        _upgradeTo(_newVersion, _newImplementation);
        bool success;
        /*solium-disable-next-line security/no-call-value*/
        (success, ) = address(this).call.value(msg.value)(_data);
        require(success, "Fail in executing the function of implementation contract");
    }

}
