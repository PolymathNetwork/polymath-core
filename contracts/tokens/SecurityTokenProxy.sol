pragma solidity ^0.5.0;

import "../proxy/OwnedUpgradeabilityProxy.sol";
import "./OZStorage.sol";
import "./SecurityTokenStorage.sol";

/**
 * @title USDTiered STO module Proxy
 */
contract SecurityTokenProxy is OZStorage, SecurityTokenStorage, OwnedUpgradeabilityProxy {

    /**
     * @notice constructor
     * @param _ERC20name Name of the SecurityToken
     * @param _ERC20symbol Symbol of the Token
     * @param _ERC20decimals Decimals for the securityToken
     * @param _granularity granular level of the token
     * @param _tokenDetails Details of the token that are stored off-chain
     * @param _polymathRegistry Contract address of the polymath registry
     * @param _getterDelegate Contract address of the getter delegate
     * @param _version Proxy version for contract
     * @param _implementation Logic contract for security token
     */
    constructor(
        string memory _ERC20name,
        string memory _ERC20symbol,
        uint8 _ERC20decimals,
        uint256 _granularity,
        string memory _tokenDetails,
        address _polymathRegistry,
        address _getterDelegate,
        string memory _version,
        address _implementation
    )
        public
        OZStorage(_ERC20name, _ERC20symbol, _ERC20decimals)
    {
        //_configure(_granularity, _tokenDetails, _polymathRegistry, _getterDelegate);
        //_upgradeToAndCall(_version, _implementation, _functor("initialize()"));
    }

    function _configure(
        uint256 _granularity,
        string memory _tokenDetails,
        address _polymathRegistry,
        address _getterDelegate
    ) internal {
        //SecurityToken Initialisation
        require(_polymathRegistry != address(0), "Invalid Address");
        polymathRegistry = _polymathRegistry;
        getterDelegate = _getterDelegate;
        tokenDetails = _tokenDetails;
        granularity = _granularity;
    }

    function _functor(string memory _function) internal pure returns (bytes memory) {
        bytes memory functor = new bytes(4);
        bytes4 functor4 = bytes4(keccak256(abi.encodePacked(_function)));
        for (uint8 i = 0; i < 4; i++) {
            functor[i] = functor4[i];
        }
        return functor;
    }
}
