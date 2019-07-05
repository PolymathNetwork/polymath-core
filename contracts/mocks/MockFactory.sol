pragma solidity 0.5.8;

import "./Dummy/DummySTOFactory.sol";

/**
 * @title Mock Contract Not fit for production environment
 */

contract MockFactory is DummySTOFactory {
    bool public typesSwitch = false;

    /**
     * @notice Constructor
     * @param _setupCost Setup cost of the module
      * @param _logicContract Contract address that contains the logic related to `description`
     * @param _polymathRegistry Address of the Polymath Registry
     */
    constructor(
        uint256 _setupCost,
        address _logicContract,
        address _polymathRegistry,
        bool _isFeeInPoly
    )
        public
        DummySTOFactory(_setupCost, _logicContract, _polymathRegistry, _isFeeInPoly)
    {
    }

    /**
     * @notice Type of the Module factory
     */
    function getTypes() external view returns(uint8[] memory) {
        if (!typesSwitch) {
            uint8[] memory res = new uint8[](0);
            return res;
        } else {
            uint8[] memory res = new uint8[](2);
            res[0] = 1;
            res[1] = 1;
            return res;
        }

    }

    function switchTypes() external onlyOwner {
        typesSwitch = !typesSwitch;
    }

}
