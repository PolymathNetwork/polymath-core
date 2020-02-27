pragma solidity ^0.5.0;

import "../../UpgradableModuleFactory.sol";
import "./POLYPeggedSTOProxy.sol";
import "../../../libraries/Util.sol";
import "../../../interfaces/IBoot.sol";

/**
 * @title Factory for deploying POLYPeggedSTO module
 */
contract POLYPeggedSTOFactory is UpgradableModuleFactory {

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
        UpgradableModuleFactory("3.0.0", _setupCost, _usageCost, _logicContract, _polymathRegistry, _isCostInPoly)
    {
        name = "POLYPeggedSTO";
        title = "POLY - Pegged to USD - STO";
        /*solium-disable-next-line max-len*/
        description = "This smart contract creates a maximum number of tokens (i.e. hard cap) which the total aggregate of tokens acquired by all investors cannot exceed. Security tokens are sent to the investor upon reception of the funds (POLY). Tokens are allocated based on the USD value of POLY at the time of investment. This STO supports options for a minimum investment limit for all investors, maximum investment limit for non-accredited investors and an option to mint unsold tokens to a treasury wallet upon termination of the offering.";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(3), uint8(0), uint8(0));
        // set default tags
        typesData.push(3);
        tagsData.push("Capped");
        tagsData.push("Pegged");
        tagsData.push("POLY");
        tagsData.push("STO");
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @param _data Data used for the intialization of the module factory variables
     * @return address Contract address of the Module
     */
    function deploy(bytes calldata _data) external returns(address) {
        address polyPeggedSTO = address(new POLYPeggedSTOProxy(logicContracts[latestUpgrade].version, msg.sender, IPolymathRegistry(polymathRegistry).getAddress("PolyToken"), logicContracts[latestUpgrade].logicContract));
        _initializeModule(polyPeggedSTO, _data);
        return address(polyPeggedSTO);
    }
}
