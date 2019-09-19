pragma solidity 0.5.8;

import "../../UpgradableModuleFactory.sol";
import "./IssuanceProxy.sol";

/**
 * @title Factory for deploying Issuance module
 */
contract IssuanceFactory is UpgradableModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath registry
     * @param _isCostInPoly true = cost in Poly, false = USD
     */
    constructor (
        uint256 _setupCost,
        address _logicContract,
        address _polymathRegistry,
        bool _isCostInPoly
    )
        public
        UpgradableModuleFactory("3.1.0", _setupCost, _logicContract, _polymathRegistry, _isCostInPoly)
    {
        name = "Issaunce";
        title = "Issuance";
        description = "Allows delegate to issue tokens";
        typesData.push(3);
        tagsData.push("Issaunce");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(1), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(1), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address issuance = address(new IssuanceProxy(logicContracts[latestUpgrade].version, msg.sender, polymathRegistry.getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(issuance, _data);
        return issuance;
    }

}
