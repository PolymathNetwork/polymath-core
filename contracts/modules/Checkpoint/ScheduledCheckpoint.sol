pragma solidity ^0.4.24;

import "./ICheckpoint.sol";
import "../TransferManager/ITransferManager.sol";
import "../Module.sol";
import "../../interfaces/ISecurityToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../libraries/BokkyPooBahsDateTimeLibrary.sol";

/**
 * @title Burn module for burning tokens and keeping track of burnt amounts
 */
contract ScheduledCheckpoint is ICheckpoint, ITransferManager {
    using SafeMath for uint256;

    struct Schedule {
        bytes32 name;
        uint256 startTime;
        uint256 yearInterval;
        uint256 monthInterval;
        uint256 dayInterval;
    }

    Schedule[] schedules;

    mapping (bytes32 => Schedule) public

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _securityToken, address _polyAddress) public
    Module(_securityToken, _polyAddress)
    {
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    function addSchedule(bytes32 _name, uint256 _startTime, )

    /// @notice Used to verify the transfer transaction according to the rule implemented in the trnasfer managers
    function verifyTransfer(address /* _from */, address _to, uint256 /* _amount */, bool /* _isTransfer */) public returns(Result) {
        return Result.NA;
    }

    /**
     * @notice Return the permissions flag that are associated with CountTransferManager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }
}
