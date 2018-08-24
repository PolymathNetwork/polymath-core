pragma solidity ^0.4.24;

import "./ITransferManager.sol";

/////////////////////
// Module permissions
/////////////////////
//                           Owner       ADMIN
// changeHolderCount           X           X


/**
 * @title Transfer Manager for limiting maximum number of token holders
 */
contract CountTransferManager is ITransferManager {

    // The maximum number of concurrent token holders
    uint256 public maxHolderCount;

    bytes32 public constant ADMIN = "ADMIN";

    event LogModifyHolderCount(uint256 _oldHolderCount, uint256 _newHolderCount);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _securityToken, address _polyAddress)
    public
    IModule(_securityToken, _polyAddress)
    {
    }

    /// @notice Used to verify the transfer transaction according to the rule implemented in the trnasfer managers
    function verifyTransfer(address /* _from */, address _to, uint256 /* _amount */, bool /* _isTransfer */) public returns(Result) {
        if (!paused) {
            if (maxHolderCount < ISecurityToken(securityToken).investorCount()) {
                // Allow transfers to existing maxHolders
                if (ISecurityToken(securityToken).balanceOf(_to) != 0) {
                    return Result.NA;
                }
                return Result.INVALID;
            }
            return Result.NA;
        }
        return Result.NA;
    }

    /**
     * @notice Used to intialize the variables of the contract
     * @param _maxHolderCount Maximum no. of holders for the securityToken
     */
    function configure(uint256 _maxHolderCount) public onlyFactory {
        maxHolderCount = _maxHolderCount;
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(keccak256("configure(uint256)"));
    }

    /**
    * @notice sets the maximum percentage that an individual token holder can hold
    * @param _maxHolderCount is the new maximum amount a holder can hold
    */
    function changeHolderCount(uint256 _maxHolderCount) public withPerm(ADMIN) {
        emit LogModifyHolderCount(maxHolderCount, _maxHolderCount);
        maxHolderCount = _maxHolderCount;
    }

    /**
     * @notice Return the permissions flag that are associated with CountTransferManager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

}
