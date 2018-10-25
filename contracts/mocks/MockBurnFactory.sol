pragma solidity ^0.4.24;

import "./MockRedemptionManager.sol";
import "../modules/Experimental/Burn/TrackedRedemptionFactory.sol";

/**
 * @title Mock Contract Not fit for production environment
 */

contract MockBurnFactory is TrackedRedemptionFactory {

     /**
     * @notice Constructor
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
      TrackedRedemptionFactory(_polyAddress, _setupCost, _usageCost, _subscriptionCost)
    {
    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return Address Contract address of the Module
     */
    function deploy(bytes /*_data*/) external returns(address) {
        if(setupCost > 0)
            require(polyToken.transferFrom(msg.sender, owner, setupCost), "Unable to pay setup cost");
        //Check valid bytes - can only call module init function
        MockRedemptionManager mockRedemptionManager = new MockRedemptionManager(msg.sender, address(polyToken));
        /*solium-disable-next-line security/no-block-members*/
        emit GenerateModuleFromFactory(address(mockRedemptionManager), getName(), address(this), msg.sender, setupCost, now);
        return address(mockRedemptionManager);
    }

}
