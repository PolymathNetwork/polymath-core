pragma solidity 0.5.8;

import "../tokens/SecurityToken.sol";

/**
 * @title Security Token contract (mock)
 * @notice SecurityToken is an ERC1400 token with added capabilities:
 * @notice - Implements the ERC1400 Interface
 * @notice - Transfers are restricted
 * @notice - Modules can be attached to it to control its behaviour
 * @notice - ST should not be deployed directly, but rather the SecurityTokenRegistry should be used
 * @notice - ST does not inherit from ISecurityToken due to:
 * @notice - https://github.com/ethereum/solidity/issues/4847
 */
contract MockSecurityTokenLogic is SecurityToken {

    event UpgradeEvent(uint256 _upgrade);
    uint256 public someValue;

    /**
     * @notice Initialization function
     * @dev Expected to be called atomically with the proxy being created, by the owner of the token
     * @dev Can only be called once
     */
    function upgrade(address _getterDelegate, uint256 _upgrade) external {
        getterDelegate = _getterDelegate;
        someValue = _upgrade;
        //securityTokenVersion = SemanticVersion(3, 1, 0);
        emit UpgradeEvent(_upgrade);
    }

    /**
     * @notice Initialization function
     * @dev Expected to be called atomically with the proxy being created, by the owner of the token
     * @dev Can only be called once
     */
    function initialize(address _getterDelegate, uint256 _someValue) public {
        //Expected to be called atomically with the proxy being created
        require(!initialized, "Already initialized");
        getterDelegate = _getterDelegate;
        securityTokenVersion = SemanticVersion(3, 0, 0);
        updateFromRegistry();
        tokenFactory = msg.sender;
        initialized = true;
        someValue = _someValue;
    }

    function newFunction(uint256 _upgrade) external {
        emit UpgradeEvent(_upgrade);
    }

    //To reduce bytecode size
    function addModuleWithLabel(
        address /* _moduleFactory */,
        bytes memory /* _data */,
        uint256 /* _maxCost */,
        uint256 /* _budget */,
        bytes32 /* _label */,
        bool /* _archived */
    )
        public
    {
        emit UpgradeEvent(0);
    }

}
