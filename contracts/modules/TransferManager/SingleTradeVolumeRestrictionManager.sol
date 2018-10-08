pragma solidity ^0.4.24;
import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager for limiting volume of tokens in a single trade
 */

contract SingleTradeVolumeRestrictionManager is ITransferManager {
    using SafeMath for uint256;

    bytes32 constant public ADMIN = "ADMIN";

    bool public isTransferLimitInPercentage;

    uint256 public globalTransferLimitInTokens;

    // should be multipled by 10^16. if the transfer percentage is 20%, then globalTransferLimitInPercentage should be 20*10^16
    uint256 public globalTransferLimitInPercentage;

    // Ignore transactions which are part of the primary issuance
    bool public allowPrimaryIssuance = true;

    //mapping to store the wallets that are exempted from the volume restriction
    mapping(address => bool) public exemptWallets;

    //addresses on this list have special transfer restrictions apart from global
    mapping(address => uint) public specialTransferLimitsInTokens;

    mapping(address => uint) public specialTransferLimitsInPercentages;

    event ExemptWalletAdded(address _wallet);
    event ExemptWalletRemoved(address _wallet);
    event TransferLimitInTokensSet(address _wallet, uint256 _amount);
    event TransferLimitInPercentageSet(address _wallet, uint _percentage);
    event TransferLimitInPercentageRemoved(address _wallet);
    event TransferLimitInTokensRemoved(address _wallet);
    event GlobalTransferLimitInTokensSet(uint256 _amount, uint256 _oldAmount);
    event GlobalTransferLimitInPercentageSet(uint256 _percentage, uint256 _oldPercentage);
    event TransferLimitChangedToTokens();
    event TransferLimitChangedtoPercentage();
    event SetAllowPrimaryIssuance(bool _allowPrimaryIssuance, uint256 _timestamp);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
    */
    constructor(address _securityToken, address _polyAddress) public
    Module(_securityToken, _polyAddress)
    {

    }

    /// @notice Used to verify the transfer transaction according to the rule implemented in the transfer manager
    function verifyTransfer(address _from, address /* _to */, uint256 _amount, bytes /* _data */, bool /* _isTransfer */) public returns(Result) {
        bool validTransfer;

        if (exemptWallets[_from] || paused) return Result.NA;

        if (_from == address(0) && allowPrimaryIssuance) {
            return Result.NA;
        }

        if (isTransferLimitInPercentage) {
            if(specialTransferLimitsInPercentages[_from] > 0) {
                validTransfer = (_amount.mul(10**18).div(ISecurityToken(securityToken).totalSupply())) <= specialTransferLimitsInPercentages[_from];
            } else {
                validTransfer = (_amount.mul(10**18).div(ISecurityToken(securityToken).totalSupply())) <= globalTransferLimitInPercentage;
            }
        } else  {
          if (specialTransferLimitsInTokens[_from] > 0) {
              validTransfer = _amount <= specialTransferLimitsInTokens[_from];
          } else {
              validTransfer = _amount <= globalTransferLimitInTokens;
          }
        }
        if (validTransfer) return Result.NA;
        return Result.INVALID;
    }

    /**
    * @notice Used to intialize the variables of the contract
    * @param _isTransferLimitInPercentage true if the transfer limit is in percentage else false
    * @param _globalTransferLimitInPercentageOrToken transfer limit per single transaction.
    */
    function configure(bool _isTransferLimitInPercentage, uint256 _globalTransferLimitInPercentageOrToken, bool _allowPrimaryIssuance) public onlyFactory {
        isTransferLimitInPercentage = _isTransferLimitInPercentage;
        
        allowPrimaryIssuance = _allowPrimaryIssuance;
    }

    /**
    * @notice This function returns the signature of configure function
    */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(keccak256("configure(bool,uint256,bool)"));
    }

    /**
    * @notice Return the permissions flag that are associated with SingleTradeVolumeRestrictionManager
    */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }
}
