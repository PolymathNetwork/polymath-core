pragma solidity ^0.4.24;

import "../../interfaces/IUSDTieredSTOProxy.sol";
import "../ModuleFactory.sol";
import "../../libraries/Util.sol";

/**
 * @title Factory for deploying CappedSTO module
 */
contract USDTieredSTOFactory is ModuleFactory {

    address public USDTieredSTOProxyAddress;

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _subscriptionCost Subscription cost of the module
     * @param _proxyFactoryAddress Address of the proxy factory
     */
    constructor (uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost, address _proxyFactoryAddress) public
    ModuleFactory(_setupCost, _usageCost, _subscriptionCost)
    {
        require(_proxyFactoryAddress != address(0), "0x address is not allowed");
        USDTieredSTOProxyAddress = _proxyFactoryAddress;
        version = "1.0.0";
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
    function deploy(bytes _data) external returns(address) {
        if (setupCost > 0) {
            IERC20 polyToken = getPolyToken(msg.sender);
            require(polyToken.transferFrom(msg.sender, owner(), setupCost), "Sufficent Allowance is not provided");
        }
        require(USDTieredSTOProxyAddress != address(0), "Proxy contract should be pre-set");
        //Check valid bytes - can only call module init function
        address usdTieredSTO = IUSDTieredSTOProxy(USDTieredSTOProxyAddress).deploySTO(msg.sender, address(this));
        //Checks that _data is valid (not calling anything it shouldn't)
        require(Util.getSig(_data) == IUSDTieredSTOProxy(USDTieredSTOProxyAddress).getInitFunction(usdTieredSTO), "Invalid data");
        /*solium-disable-next-line security/no-low-level-calls*/
        require(address(usdTieredSTO).call(_data), "Unsuccessfull call");
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(usdTieredSTO, getName(), address(this), msg.sender, setupCost, now);
        return address(usdTieredSTO);
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[]) {
        uint8[] memory res = new uint8[](1);
        res[0] = 3;
        return res;
    }

    /**
     * @notice Returns the instructions associated with the module
     */
    function getInstructions() external view returns(string) {
        return "Initialises a USD tiered STO.";
    }

    /**
     * @notice Get the tags related to the module factory
     */
    function getTags() external view returns(bytes32[]) {
        bytes32[] memory availableTags = new bytes32[](4);
        availableTags[0] = "USD";
        availableTags[1] = "Tiered";
        availableTags[2] = "POLY";
        availableTags[3] = "ETH";
        return availableTags;
    }

}
