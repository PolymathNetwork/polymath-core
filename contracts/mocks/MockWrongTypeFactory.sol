pragma solidity ^0.4.24;

import "./MockBurnFactory.sol";
import "../modules/ModuleFactory.sol";
import "../libraries/Util.sol";

/**
 * @title Mock Contract Not fit for production environment
 */

contract MockWrongTypeFactory is MockBurnFactory {

     /**
     * @notice Constructor
     */
    constructor (uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
      MockBurnFactory(_setupCost, _usageCost, _subscriptionCost)
    {
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[]) {
        uint8[] memory types = new uint8[](1);
        types[0] = 4;
        return types;
    }

}
