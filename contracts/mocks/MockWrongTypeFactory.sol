pragma solidity ^0.5.0;

import "./MockBurnFactory.sol";
import "../modules/ModuleFactory.sol";
import "../libraries/Util.sol";

/**
 * @title Mock Contract Not fit for production environment
 */

contract MockWrongTypeFactory is MockBurnFactory {
    /**
    * @notice Constructor
    * @param _setupCost Setup cost of the module
    * @param _usageCost Usage cost of the module
    * @param _polymathRegistry Address of the Polymath Registry
    */
    constructor(
        uint256 _setupCost,
        uint256 _usageCost,
        address _polymathRegistry
    )
        public
        MockBurnFactory(_setupCost, _usageCost, _polymathRegistry)
    {

    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        uint8[] memory types = new uint8[](1);
        types[0] = 4;
        return types;
    }

}
