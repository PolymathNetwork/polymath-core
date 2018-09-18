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

  bool public globalTransferLimitInPercentage;

  uint256 public globalTransferLimit;

  mapping(address=>bool) public exemptWallets;

  mapping(address => bool) public specialTransferLimitWallets;

  mapping(address => uint) public specialTransferLimits;

  bytes32 constant public ADMIN = "ADMIN";

  constructor(address _securityToken, address _polyAddress) public
  IModule(_securityToken, _polyAddress)
  {

  }

  function verifyTransfer(address _from, address _to, uint256 _amount, bool /* _isTransfer */) public returns(Result) {
    bool validTransfer;

    if(paused) {
      return Result.NA;
    }

    if(exemptWallets[_from]) return Result.NA;

    if(specialTransferLimitWallets[_from]) {
      if(globalTransferLimitInPercentage) {
        validTransfer = (_amount.mul(100).div(ISecurityToken(securityToken).totalSupply())) <= specialTransferLimits[_from];
      } else {
        validTransfer = _amount <= specialTransferLimits[_from];
      }
    } else {
      if(globalTransferLimitInPercentage) {
        validTransfer = (_amount.mul(100).div(ISecurityToken(securityToken).totalSupply())) <= globalTransferLimit;
      } else {
        validTransfer = _amount <= globalTransferLimit;
      }
    }

    if(validTransfer) return Result.NA;
    return Result.INVALID;
  }

  function configure(bool _globalTransferLimitInPercentage, uint256 _globalTransferLimit) public onlyFactory {
    globalTransferLimitInPercentage = _globalTransferLimitInPercentage;
    changeGlobalLimit(_globalTransferLimit);
  }

  function changeGlobalLimit(uint256 _newGlobalTransferLimit) public withPerm(ADMIN) {
    if(globalTransferLimitInPercentage) {
      require(_newGlobalTransferLimit <= 100);
    }
    globalTransferLimit = _newGlobalTransferLimit;
  }

  function addExemptWallet(address _walletAddress) public withPerm(ADMIN) {
    require(_walletAddress != address(0));
    exemptWallets[_walletAddress] = true;
  }

  function removeExemptWallet(address _walletAddress) public withPerm(ADMIN) {
    require(_walletAddress != address(0));
    exemptWallets[_walletAddress] = false;
  }

  function setTransferLimitForWallet(address _walletAddress, uint _transferLimit) public withPerm(ADMIN) {
    if(globalTransferLimitInPercentage) {
      require(_transferLimit <= 100);
    }
    specialTransferLimitWallets[_walletAddress] = true;
    specialTransferLimits[_walletAddress] = _transferLimit;
  }

  function removeTransferLimitForWallet(address _walletAddress) public withPerm(ADMIN) {
    require(specialTransferLimitWallets[_walletAddress]);
    specialTransferLimitWallets[_walletAddress] = false;
    specialTransferLimits[_walletAddress] = 0;
  }

  /**
   * @notice This function returns the signature of configure function
   */
  function getInitFunction() public pure returns (bytes4) {
      return bytes4(keccak256("configure(bool, uint256)"));
  }

  // TO IMPLEMENT
  function getPermissions() public view returns(bytes32[]) {
    bytes32[] memory allPermissions = new bytes32[](1);
    allPermissions[0] = ADMIN;
    return allPermissions;
  }
}
