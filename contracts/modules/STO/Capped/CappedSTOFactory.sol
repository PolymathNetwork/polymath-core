pragma solidity 0.5.8;

import "../../UpgradableModuleFactory.sol";
import "./CappedSTOProxy.sol";

/**
 * @title Factory for deploying CappedSTO module
 */
contract CappedSTOFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor (
        uint256 _setupCost,
        uint256 _usageCost,
        address _logicContract,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public
        UpgradableModuleFactory("3.1.0", _setupCost, _usageCost, _logicContract, _polymathRegistry, _isCostInPoly)
    {
        name = "CappedSTO";
        title = "Capped STO";
        description = "This smart contract creates a maximum number of tokens (i.e. hard cap) which the total aggregate of tokens acquired by all investors cannot exceed. Security tokens are sent to the investor upon reception of the funds (ETH or POLY), and any security tokens left upon termination of the offering will not be minted.";
        typesData.push(3);
        typesData.push(8); // Extra type which will allow module to hold and send securityTokens without being added in KYC data
        typesData.push(5); // Allow burn type 
        typesData.push(9); // Auto whitelist treasury wallet
        tagsData.push("Capped");
        tagsData.push("ETH");
        tagsData.push("POLY");
        tagsData.push("STO");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(1), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address cappedSTO = address(new CappedSTOProxy(logicContracts[latestUpgrade].version, msg.sender, polymathRegistry.getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(cappedSTO, _data);
        return cappedSTO;
    }

}
