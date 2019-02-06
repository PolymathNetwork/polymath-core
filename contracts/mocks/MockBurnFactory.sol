pragma solidity ^0.5.0;

import "./MockRedemptionManager.sol";
import "../modules/Experimental/Burn/TrackedRedemptionFactory.sol";

/**
 * @title Mock Contract Not fit for production environment
 */

contract MockBurnFactory is TrackedRedemptionFactory {

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
        TrackedRedemptionFactory(_setupCost, _usageCost, _polymathRegistry)
    {

    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return Address Contract address of the Module
     */
    function deploy(
        bytes calldata /*_data*/
    )
        external
        returns(address)
    {
        address polyToken = _takeFee();
        //Check valid bytes - can only call module init function
        MockRedemptionManager mockRedemptionManager = new MockRedemptionManager(msg.sender, polyToken);
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(mockRedemptionManager), getName(), address(this), msg.sender, getSetupCost(), getSetupCostInPoly(), now);
        return address(mockRedemptionManager);
    }

}
