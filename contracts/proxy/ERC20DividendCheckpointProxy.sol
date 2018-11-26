pragma solidity ^0.4.24;

import "../modules/Checkpoint/ERC20DividendCheckpointStorage.sol";
import "../modules/Checkpoint/DividendCheckpointStorage.sol";
import "./Proxy.sol";
import "../Pausable.sol";
import "../modules/ModuleStorage.sol";

/**
 * @title Transfer Manager module for core transfer validation functionality
 */
contract ERC20DividendCheckpointProxy is ERC20DividendCheckpointStorage, DividendCheckpointStorage, ModuleStorage, Pausable, Proxy {

    // Address of the current implementation
    address internal __implementation;

    /**
    * @notice Constructor
    * @param _securityToken Address of the security token
    * @param _polyAddress Address of the polytoken
    * @param _implementation representing the address of the new implementation to be set
    */
    constructor (address _securityToken, address _polyAddress, address _implementation)
    public
    ModuleStorage(_securityToken, _polyAddress)
    {
        require(
            _implementation != address(0),
            "Implementation address should not be 0x"
        );
        __implementation = _implementation;
    }

    /**
    * @notice Internal function to provide the address of the implementation contract
    */
    function _implementation() internal view returns (address) {
        return __implementation;
    }

    /**
    * @dev Tells the address of the current implementation
    * @return address of the current implementation
    */
    function implementation() external view returns (address) {
        return _implementation();
    }
}
