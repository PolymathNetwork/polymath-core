pragma solidity ^0.5.0;

import "./OwnedProxy.sol";
import "../datastore/DataStoreStorage.sol";

/**
 * @title DataStoreProxy Proxy
 */
contract DataStoreProxy is DataStoreStorage, OwnedProxy {

    /**
    * @notice Constructor
    * @param _securityToken Address of the security token
    * @param _implementation representing the address of the new implementation to be set
    */
    constructor(
        address _securityToken, 
        address _implementation
    )
        public
    {
        require(_implementation != address(0) && _securityToken != address(0),
            "Address should not be 0x"
        );
        securityToken = ISecurityToken(_securityToken);
        __implementation = _implementation;
    }

}
