pragma solidity ^0.4.24;
import "./ITransferManager.sol";

contract SingleTradeVolumeRestrictionManager is ITransferManager {
  using SafeMath for uint256;
  bool public isPercentage;
  uint256 public globalTransferLimit;
  mapping(address=>bool) public exemptWallets;
  mapping(address => bool) public specialTransferLimitWallets;
  mapping(address => uint) public specialTransferLimits;

  constructor(address _securityToken, address _polyAddress) public
  IModule(_securityToken, _polyAddress)
  {

  }

  function verifyTransfer(address _from, address _to, uint256 _amount, bool /* _isTransfer */) public returns(Result) {
    // TO IMPLEMENT
    /* if(!paused) {
      if(exemptWallets[_from]) return Result.NA;
      if(specialTransferLimitWallets[_from]) {
        if(isPercentage) {
            _amount.div(securityToken.totalSupply())
        }
        else {

        }
      }
    } */
    return Result.NA;
  }

  function configure(bool _isPercentage, uint256 _globalTransferLimit) public onlyFactory {
    isPercentage = _isPercentage;
    changeGlobalLimit(_globalTransferLimit);
  }

  function changeGlobalLimit(uint256 _newGlobalTransferLimit) public {
    if(isPercentage) {
      require(_newGlobalTransferLimit <= 100);
    }
    globalTransferLimit = _newGlobalTransferLimit;
  }

  function addExemptWallet(address _walletAddress) public {
    require(_walletAddress != address(0));
    exemptWallets[_walletAddress] = true;
  }

  function removeExemptWallet(address _walletAddress) public {
    require(_walletAddress != address(0));
    exemptWallets[_walletAddress] = false;
  }

  function setTransferLimitForWallet(address _walletAddress, uint _transferLimit) public {
    if(isPercentage) {
      require(_transferLimit <= 100);
    }
    specialTransferLimitWallets[_walletAddress] = true;
    specialTransferLimits[_walletAddress] = _transferLimit;
  }

  function removeTransferLimitForWallet(address _walletAddress) public {
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
    return allPermissions;
  }
}
