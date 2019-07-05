pragma solidity 0.5.8;

import "./Dummy/DummySTOFactory.sol";

contract TestSTOFactory is DummySTOFactory {
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
        name = "TestSTO";
        title = "Test STO";
        description = "Test STO";
        compatibleSTVersionRange["lowerBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
        compatibleSTVersionRange["upperBound"] = VersionUtils.pack(uint8(0), uint8(0), uint8(0));
    }

    /**
     * @notice Gets the tags related to the module factory
     */
    function getTags() external view returns(bytes32[] memory) {
        bytes32[] memory availableTags = new bytes32[](4);
        availableTags[0] = "Test";
        availableTags[1] = "Non-refundable";
        availableTags[2] = "ETH";
        return availableTags;
    }

}
