pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../interfaces/ISecurityToken.sol";
import "../interfaces/IModule.sol";

contract KatipultKYC is Ownable {

  mapping (address => uint256) public investorFee;

  mapping (address => address) public transferManagerCache;

  //from and to timestamps that an investor can send / receive tokens respectively
  struct TimeRestriction {
      uint256 fromTime;
      uint256 toTime;
  }

  // An address can only send / receive tokens once their corresponding uint256 > block.number
  // (unless allowAllTransfers == true or allowAllWhitelistTransfers == true)
  mapping (address => mapping (address => TimeRestriction)) public whitelist;

  event LogInvestorFeeChange(address _securityToken, uint256 _investorFee);

  event LogModifyWhitelist(
      address _securityToken,
      address _investor,
      uint256 _dateAdded,
      address _addedBy,
      uint256 _fromTime,
      uint256 _toTime
  );

  function KatipultKYC()
  public
  {
  }

  function invalidateTransferManagerCache(address _securityToken) public onlyOwner {
      transferManagerCache[_securityToken] = address(0);
  }

  function changeInvestorFee(address _securityToken, uint256 _investorFee) public onlyOwner {
      investorFee[_securityToken] = _investorFee;
      emit LogInvestorFeeChange(_securityToken, _investorFee);
  }

  /**
  * @dev adds or removes addresses from the whitelist.
  * @param _investor is the address to whitelist
  * @param _fromTime is the moment when the sale lockup period ends and the investor can freely sell his tokens
  * @param _toTime is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
  */
  function modifyWhitelist(address _securityToken, address _investor, uint256 _fromTime, uint256 _toTime) public onlyOwner {
      //Passing a _time == 0 into this function, is equivalent to removing the _investor from the whitelist
      if (investorFee[_securityToken] != 0) {
          //If we don't have it cached, grab the transferManager for the securityToken
          if (transferManagerCache[_securityToken] == address(0)) {
              address transferManager;
              (, transferManager, ) = ISecurityToken(_securityToken).getModuleByName(ISecurityToken(_securityToken).TRANSFERMANAGER_KEY(), "KatipultTransferManager");
              require(transferManager != address(0));
              transferManagerCache[_securityToken] = transferManager;
          }
          //Levy the fee
          require(IModule(transferManagerCache[_securityToken]).takeFee(investorFee[_securityToken]));
      }
      whitelist[_securityToken][_investor] = TimeRestriction(_fromTime, _toTime);
      emit LogModifyWhitelist(_securityToken, _investor, now, msg.sender, _fromTime, _toTime);
  }

  function modifyWhitelistMulti(
      address[] _securityTokens,
      address[] _investors,
      uint256[] _fromTimes,
      uint256[] _toTimes
  ) public onlyOwner {
      require(_investors.length == _fromTimes.length);
      require(_fromTimes.length == _toTimes.length);
      require(_toTimes.length == _securityTokens.length);
      for (uint256 i = 0; i < _investors.length; i++) {
          modifyWhitelist(_securityTokens[i], _investors[i], _fromTimes[i], _toTimes[i]);
      }
  }

  function getWhitelist(address _securityToken, address _investor) public view returns(uint256, uint256) {
      return (whitelist[_securityToken][_investor].fromTime, whitelist[_securityToken][_investor].toTime);
  }

  function onWhitelist(address _securityToken, address _investor) public view returns(bool) {
      return ((whitelist[_securityToken][_investor].fromTime != 0) || (whitelist[_securityToken][_investor].toTime != 0));
  }

}
