pragma solidity ^0.5.0;

import "../../interfaces/IBoot.sol";
import "../../proxy/USDTieredSTOProxy.sol";
import "../UpgradableModuleFactory.sol";
import "../../libraries/Util.sol";

/**
 * @title Factory for deploying CappedSTO module
 */
contract USDTieredSTOFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry
    )
        public
        UpgradableModuleFactory("3.0.0", _setupCost, _usageCost, _logicContract, _polymathRegistry)
    {
        name = "USDTieredSTO";
        title = "USD Tiered STO";
        /*solium-disable-next-line max-len*/
        description = "It allows both accredited and non-accredited investors to contribute into the STO. Non-accredited investors will be capped at a maximum investment limit (as a default or specific to their jurisdiction). Tokens will be sold according to tiers sequentially & each tier has its own price and volume of tokens to sell. Upon receipt of funds (ETH, POLY or DAI), security tokens will automatically transfer to investor’s wallet address";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address usdTieredSTO = address(new USDTieredSTOProxy(logicContracts[latestVersion].version, msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestVersion].logicContract));
        _initializeModule(usdTieredSTO, _data);
        return usdTieredSTO;
    }

    /**
     * @notice Type of the Module factory
     */
    function types() external view returns(uint8[] memory) {
        uint8[] memory res = new uint8[](1);
        res[0] = 3;
        return res;
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function tags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](4);
        availableTags[0] = "USD";
        availableTags[1] = "Tiered";
        availableTags[2] = "POLY";
        availableTags[3] = "ETH";
        return availableTags;
    }

}
