pragma solidity ^0.5.0;

import "./RestrictedPartialSaleTMProxy.sol";
import "../../UpgradableModuleFactory.sol";

/**
 * @title Factory for deploying RestrictedPartialSale module
 */
contract RestrictedPartialSaleTMFactory is UpgradableModuleFactory {

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
        initialVersion = "3.1.0";
        name = "RestrictedPartialSaleTM";
        title = "Restricted Partial Sale Transfer Manager";
        description = "TM will not allow investors to transact partial balance of the investors";
        typesData.push(2);
        tagsData.push("PartialSale");
        tagsData.push("Transfer Restriction");
        tagsData.push("Restricted transfer");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(1), uint8(0));
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(
        bytes calldata _data
    )
        external
        returns(address)
    {
        address restrictedPartialSaleTM = address(
            new RestrictedPartialSaleTMProxy(
                logicContracts[latestUpgrade].version,
                msg.sender,
                polymathRegistry.getAddress("PolyToken"),
                logicContracts[latestUpgrade].logicContract
                )
            );
        _initializeModule(restrictedPartialSaleTM, _data);
        return restrictedPartialSaleTM;
    }


}
