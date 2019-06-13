pragma solidity 0.5.8;

import "./MockRedemptionManager.sol";
import "../modules/Experimental/Burn/TrackedRedemptionFactory.sol";

/**
 * @title Mock Contract Not fit for production environment
 */

contract MockBurnFactory is TrackedRedemptionFactory {

    /**
    * @notice Constructor
    * @param _setupCost Setup cost of the module
    * @param _polymathRegistry Address of the Polymath Registry
    */
    constructor(
        uint256 _setupCost,
        address _polymathRegistry,
        bool _isFeeInPoly
    )
        public
        TrackedRedemptionFactory(_setupCost, _polymathRegistry, _isFeeInPoly)
    {

    }

    /**
     * @notice Used to launch the Module with the help of factory
     * @return Address Contract address of the Module
     */
    function deploy(
        bytes calldata _data
    )
        external
        returns(address)
    {
        address mockRedemptionManager = address(new MockRedemptionManager(msg.sender, polymathRegistry.getAddress("PolyToken")));
        _initializeModule(mockRedemptionManager, _data);
        return mockRedemptionManager;
    }

}
