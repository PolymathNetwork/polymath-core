pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/////////////////////
// Module permissions
/////////////////////
//                                        Owner       TRANSFER_APPROVAL
// addManualApproval                        X                 X
// addManualBlocking                        X                 X
// revokeManualApproval                     X                 X
// revokeManualBlocking                     X                 X

/**
 * @title Transfer Manager module for manually approving or blocking transactions between accounts
 */
contract ManualApprovalTransferManager is ITransferManager {
    using SafeMath for uint256;

    //Address from which issuances come
    address public issuanceAddress = address(0);

    //Address which can sign whitelist changes
    address public signingAddress = address(0);

    bytes32 public constant TRANSFER_APPROVAL = "TRANSFER_APPROVAL";

    //Manual approval is an allowance (that has been approved) with an expiry time
    struct ManualApproval {
        uint256 allowance;
        uint256 expiryTime;
    }

    //Manual blocking allows you to specify a list of blocked address pairs with an associated expiry time for the block
    struct ManualBlocking {
        uint256 expiryTime;
    }

    //Store mappings of address => address with ManualApprovals
    mapping (address => mapping (address => ManualApproval)) public manualApprovals;

    //Store mappings of address => address with ManualBlockings
    mapping (address => mapping (address => ManualBlocking)) public manualBlockings;

    event LogAddManualApproval(
        address _from,
        address _to,
        uint256 _allowance,
        uint256 _expiryTime,
        address _addedBy
    );

    event LogAddManualBlocking(
        address _from,
        address _to,
        uint256 _expiryTime,
        address _addedBy
    );

    event LogRevokeManualApproval(
        address _from,
        address _to,
        address _addedBy
    );

    event LogRevokeManualBlocking(
        address _from,
        address _to,
        address _addedBy
    );

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

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /**
    * @notice default implementation of verifyTransfer used by SecurityToken
    * If the transfer request comes from the STO, it only checks that the investor is in the whitelist
    * If the transfer request comes from a token holder, it checks that:
    * a) Both are on the whitelist
    * b) Seller's sale lockup period is over
    * c) Buyer's purchase lockup is over
    */
    function verifyTransfer(address _from, address _to, uint256 _amount, bool _isTransfer) public returns(Result) {
        // function must only be called by the associated security token if _isTransfer == true
        require(_isTransfer == false || msg.sender == securityToken, "Sender is not owner");
        // manual blocking takes precidence over manual approval
        if (!paused) {
            if (manualBlockings[_from][_to].expiryTime >= now) {
                return Result.INVALID;
            }
            if ((manualApprovals[_from][_to].expiryTime >= now) && (manualApprovals[_from][_to].allowance >= _amount)) {
                if (_isTransfer) {
                    manualApprovals[_from][_to].allowance = manualApprovals[_from][_to].allowance.sub(_amount);
                }
                return Result.VALID;
            }
        }
        return Result.NA;
    }

    /**
    * @notice adds a pair of addresses to manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    * @param _allowance is the approved amount of tokens
    * @param _expiryTime is the time until which the transfer is allowed
    */
    function addManualApproval(address _from, address _to, uint256 _allowance, uint256 _expiryTime) public withPerm(TRANSFER_APPROVAL) {
        require(_from != address(0), "Invalid from address");
        require(_to != address(0), "Invalid to address");
        require(_expiryTime > now, "Invalid expiry time");
        require(manualApprovals[_from][_to].allowance == 0, "Approval already exists");
        manualApprovals[_from][_to] = ManualApproval(_allowance, _expiryTime);
        emit LogAddManualApproval(_from, _to, _allowance, _expiryTime, msg.sender);
    }

    /**
    * @notice adds a pair of addresses to manual blockings
    * @param _from is the address from which transfers are blocked
    * @param _to is the address to which transfers are blocked
    * @param _expiryTime is the time until which the transfer is blocked
    */
    function addManualBlocking(address _from, address _to, uint256 _expiryTime) public withPerm(TRANSFER_APPROVAL) {
        require(_from != address(0), "Invalid from address");
        require(_to != address(0), "Invalid to address");
        require(_expiryTime > now, "Invalid expiry time");
        require(manualApprovals[_from][_to].expiryTime == 0, "Blocking already exists");
        manualBlockings[_from][_to] = ManualBlocking(_expiryTime);
        emit LogAddManualBlocking(_from, _to, _expiryTime, msg.sender);
    }

    /**
    * @notice removes a pairs of addresses from manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    */
    function revokeManualApproval(address _from, address _to) public withPerm(TRANSFER_APPROVAL) {
        require(_from != address(0), "Invalid from address");
        require(_to != address(0), "Invalid to address");
        delete manualApprovals[_from][_to];
        emit LogRevokeManualApproval(_from, _to, msg.sender);
    }

    /**
    * @notice removes a pairs of addresses from manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    */
    function revokeManualBlocking(address _from, address _to) public withPerm(TRANSFER_APPROVAL) {
        require(_from != address(0), "Invalid from address");
        require(_to != address(0), "Invalid to address");
        delete manualBlockings[_from][_to];
        emit LogRevokeManualBlocking(_from, _to, msg.sender);
    }

    /**
     * @notice Return the permissions flag that are associated with ManualApproval transfer manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = TRANSFER_APPROVAL;
        return allPermissions;
    }
}
