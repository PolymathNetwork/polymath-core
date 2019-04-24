pragma solidity ^0.5.0;

import "./RestrictedPartialSaleTM.sol";
import "./../../ModuleFactory.sol";

/**
 * @title Factory for deploying BlacklistManager module
 */
contract RestrictedPartialSaleTMFactory is ModuleFactory {

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
     * @param _usageCost Usage cost of the module
     * @param _polymathRegistry Address of the polymath registry
     * @param _isCostInPoly Whether the cost is in POLY or not
     */
    constructor (uint256 _setupCost, uint256 _usageCost, address _polymathRegistry, bool _isCostInPoly) public
    ModuleFactory(_setupCost, _usageCost, _polymathRegistry, _isCostInPoly)
    {   
        initialVersion = "3.0.0";
        name = "RestrictedPartialSaleTM";
        title = "Restricted Partial Sale Transfer Manager";
        description = "TM will not allow investors to transact partial balance of the investors";
        typesData.push(2);
        tagsData.push("PartialSale");
        tagsData.push("Transfer Restriction");
        tagsData.push("Restricted transfer");
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
    }

     /**
     * @notice used to launch the Module with the help of factory
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address restrictedPartialSaleTM = address(new RestrictedPartialSaleTM(msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken")));
        _initializeModule(restrictedPartialSaleTM, _data);
        return restrictedPartialSaleTM;
    }


}
