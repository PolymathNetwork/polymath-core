pragma solidity 0.5.8;

import "../modules/TransferManager/CTM/CountTransferManager.sol";

/**
 * @title Transfer Manager for limiting maximum number of token holders
 */
contract MockCountTransferManager is CountTransferManager {

    event Upgrader(uint256 _someData);
    uint256 public someValue;

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor(address _securityToken, address _polyToken) public CountTransferManager(_securityToken, _polyToken) {

    }

    function initialize(uint256 _someData) public {
        require(msg.sender == address(this));
        someValue = _someData;
        emit Upgrader(_someData);
    }

    function newFunction() external {
        emit Upgrader(maxHolderCount);
    }

}
