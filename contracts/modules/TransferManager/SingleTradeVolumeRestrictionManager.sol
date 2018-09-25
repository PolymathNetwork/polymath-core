pragma solidity ^0.4.24;
import "./ITransferManager.sol";

/////////////////////
// Module permissions
/////////////////////
//                           Owner       ADMIN
// changeGlobalLimit           X           X
// addExemptWallet             X           X
// removeExemptWallet          X           X
// setTransferLimitForWallet   X           X
// removeTransferLimitForWallet X          X

contract SingleTradeVolumeRestrictionManager is ITransferManager {
  using SafeMath for uint256;

  bool public isTransferLimitInPercentage;

  uint256 public globalTransferLimit;

  uint256 public globalTransferLimitInPercentage;

  mapping(address=>bool) public exemptWallets;

  mapping(address => bool) public specialTransferLimitWallets;

  mapping(address => uint) public specialTransferLimits;

  event LogExemptWalletAdded(address _wallet);
  event LogExemptWalletRemoved(address _wallet);
  event LogTransferLimitInTokensSet(address _wallet, uint256 _amount);
  event LogTransferLimitInPercentageSet(address _wallet, uint _percentage);
  event LogTransferLimitRemoved(address _wallet);
  event LogGlobalTransferLimitInTokensSet(uint256 _amount);
  event LogGlobalTransferLimitInPercentageSet(uint256 _percentage);

  bytes32 constant public ADMIN = "ADMIN";

 /**
  * @notice Constructor
  * @param _securityToken Address of the security token
  * @param _polyAddress Address of the polytoken
  */
  constructor(address _securityToken, address _polyAddress) public
  IModule(_securityToken, _polyAddress)
  {

  }

  /// @notice Used to verify the transfer transaction according to the rule implemented in the trnasfer managers
  function verifyTransfer(address _from, address /* _to */, uint256 _amount, bool /* _isTransfer */) public returns(Result) {
    bool validTransfer;

    if(paused) {
      return Result.NA;
    }

    if(exemptWallets[_from]) return Result.NA;

    if(specialTransferLimitWallets[_from]) {
      if(isTransferLimitInPercentage) {
        validTransfer = (_amount.mul(10**18).div(ISecurityToken(securityToken).totalSupply())) <= specialTransferLimits[_from];
      } else {
        validTransfer = _amount <= specialTransferLimits[_from];
      }
    } else {
      if(isTransferLimitInPercentage) {
        validTransfer = (_amount.mul(10**18).div(ISecurityToken(securityToken).totalSupply())) <= globalTransferLimitInPercentage;
      } else {
        validTransfer = _amount <= globalTransferLimit;
      }
    }

    if(validTransfer) return Result.NA;
    return Result.INVALID;
  }

  /**
  * @notice Used to intialize the variables of the contract
  * @param _isTransferLimitInPercentage true if the transfer limit is in percentage else false
  * @param _globalTransferLimitInPercentageOrToken transfer limit per single transaction.
  */
  function configure(bool _isTransferLimitInPercentage, uint256 _globalTransferLimitInPercentageOrToken) public onlyFactory {
    require(_globalTransferLimitInPercentageOrToken > 0, "global transfer limit has to greater than 0");
    isTransferLimitInPercentage = _isTransferLimitInPercentage;
    if(isTransferLimitInPercentage) {
      require(_globalTransferLimitInPercentageOrToken <= 100, "Global transfer limit has be less than 0");
      globalTransferLimitInPercentage = _globalTransferLimitInPercentageOrToken;
    } else {
      globalTransferLimit = _globalTransferLimitInPercentageOrToken;
    }
  }

  /**
  * @notice Change the global transfer limit
  * @param _newGlobalTransferLimit new transfer limit in tokens
  */
  function changeGlobalLimitInTokens(uint256 _newGlobalTransferLimit) public withPerm(ADMIN) {
    require(!isTransferLimitInPercentage, "Transfer limit not set in tokens");
    globalTransferLimit = _newGlobalTransferLimit;
    emit LogGlobalTransferLimitInTokensSet(_newGlobalTransferLimit);
  }

  /**
  * @notice Change the global transfer limit
  * @param _newGlobalTransferLimitInPercentage new transfer limit in percentage. Multiple the percentage by 10^16. Eg 22% will be 22*10^16
  */
  function changeGlobalLimitInPercentage(uint256 _newGlobalTransferLimitInPercentage) public withPerm(ADMIN) {
    require(isTransferLimitInPercentage, "Transfer limit not set in Percentage");
    require(_newGlobalTransferLimitInPercentage <= 100, "Transfer Limit has to be <= 100");
    globalTransferLimitInPercentage = _newGlobalTransferLimitInPercentage;
    emit LogGlobalTransferLimitInPercentageSet(_newGlobalTransferLimitInPercentage);
  }

  /**
  * @notice add an exempt wallet
  * @param _wallet exempt wallet address
  */
  function addExemptWallet(address _wallet) public withPerm(ADMIN) {
    require(_wallet != address(0), "Wallet address cannot be a zero address");
    exemptWallets[_wallet] = true;
    emit LogExemptWalletAdded(_wallet);
  }

  /**
  * @notice remove an exempt wallet
  * @param _wallet exempt wallet address
  */
  function removeExemptWallet(address _wallet) public withPerm(ADMIN) {
    require(_wallet != address(0), "Wallet address cannot be a zero address");
    exemptWallets[_wallet] = false;
    emit LogExemptWalletRemoved(_wallet);
  }

  /**
  * @notice set transfer limit per wallet an exempt wallet
  * @param _wallet wallet address
  * @param _transferLimit transfer limit for the wallet in tokens
  */
  function setTransferLimitForWallet(address _wallet, uint _transferLimit) public withPerm(ADMIN) {
    require(!isTransferLimitInPercentage, "Transfer limit not in token amount");
    specialTransferLimitWallets[_wallet] = true;
    specialTransferLimits[_wallet] = _transferLimit;
    emit LogTransferLimitInTokensSet(_wallet, _transferLimit);
  }

  /**
  * @notice set transfer limit per wallet an exempt wallet
  * @param _wallet wallet address
  * @param _transferLimitInPercentage transfer limit for the wallet in percentage. Multiple the percentage by 10^16. Eg 22% will be 22*10^16
  */
  function setTransferLimitInPercentage(address _wallet, uint _transferLimitInPercentage) public withPerm(ADMIN) {
    require(isTransferLimitInPercentage, "Transfer limit not in percentage");
    specialTransferLimitWallets[_wallet] = true;
    specialTransferLimits[_wallet] = _transferLimitInPercentage;
    emit LogTransferLimitInPercentageSet(_wallet, _transferLimitInPercentage);
  }

  /**
  * @notice removes transfer limit for a wallet
  * @param _wallet wallet address
  */
  function removeTransferLimitForWallet(address _wallet) public withPerm(ADMIN) {
    require(specialTransferLimitWallets[_wallet], "Wallet Address does not have a transfer limit");
    specialTransferLimitWallets[_wallet] = false;
    specialTransferLimits[_wallet] = 0;
    emit LogTransferLimitRemoved(_wallet);
  }

  /**
  * @notice This function returns the signature of configure function
  */
  function getInitFunction() public pure returns (bytes4) {
      return bytes4(keccak256("configure(bool,uint256)"));
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
