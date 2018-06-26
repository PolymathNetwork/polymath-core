pragma solidity ^0.4.24;

import "./EtherDividendCheckpoint.sol";

/**
 * @title Checkpoint module for issuing ether dividends
 */
contract EtherDividendWithholdingCheckpoint is EtherDividendCheckpoint {
  using SafeMath for uint256;

  // Mapping from address to withholding tax as a percentage * 10**16
  mapping (address => uint256) public withholdingTax;

  uint256 public totalWithheld;
  mapping (uint256 => uint256) public dividendWithheld;
  mapping (uint256 => uint256) public dividendWithheldReclaimed;
  mapping (address => uint256) public investorWithheld;

  event EtherDividendWithholdingClaimed(address indexed _payee, uint256 _dividendIndex, uint256 _amount, uint256 _withheld);
  event EtherDividendWithholdingClaimFailed(address indexed _payee, uint256 _dividendIndex, uint256 _amount, uint256 _withheld);
  event EtherDividendWithholdingWithdrawn(address indexed _claimer, uint256 _dividendIndex, uint256 _withheldAmount);

  /**
   * @notice Constructor
   * @param _securityToken Address of the security token
   * @param _polyAddress Address of the polytoken
   */
  constructor (address _securityToken, address _polyAddress) public
  EtherDividendCheckpoint(_securityToken, _polyAddress)
  {
  }

  /**
   * @notice Function to set withholding tax rates for investors
   * @param _investors addresses of investor
   * @param _withholding withholding tax for individual investors (multiplied by 10**16)
   */
  function setWithholding(address[] _investors, uint256[] _withholding) public onlyOwner {
      require(_investors.length == _withholding.length);
      for (uint256 i = 0; i < _investors.length; i++) {
          withholdingTax[_investors[i]] = _withholding[i];
      }
  }

  /**
   * @notice Function to set withholding tax rates for investors
   * @param _investors addresses of investor
   * @param _withholding withholding tax for all investors (multiplied by 10**16)
   */
  function setWithholdingFixed(address[] _investors, uint256 _withholding) public onlyOwner {
      for (uint256 i = 0; i < _investors.length; i++) {
          withholdingTax[_investors[i]] = _withholding;
      }
  }

  /**
   * @notice Internal function for paying dividends
   * @param _payee address of investor
   * @param _dividend storage with previously issued dividends
   * @param _dividendIndex Dividend to pay
   */
  function _payDividend(address _payee, Dividend storage _dividend, uint256 _dividendIndex) internal {
      (uint256 claim, uint256 withheld) = calculateDividendWithholding(_dividendIndex, _payee);
      _dividend.claimed[_payee] = true;
      _dividend.claimedAmount = claim.add(_dividend.claimedAmount);
      uint256 claimAfterWithheld = claim.sub(withheld);
      if (claimAfterWithheld > 0) {
          if (_payee.send(claimAfterWithheld)) {
            totalWithheld = totalWithheld.add(withheld);
            dividendWithheld[_dividendIndex] = dividendWithheld[_dividendIndex].add(withheld);
            investorWithheld[_payee] = investorWithheld[_payee].add(withheld);
            emit EtherDividendWithholdingClaimed(_payee, _dividendIndex, claim, withheld);
          } else {
            _dividend.claimed[_payee] = false;
            emit EtherDividendWithholdingClaimFailed(_payee, _dividendIndex, claim, withheld);
          }
      }
  }

  /**
   * @notice Calculate amount of dividends claimable
   * @param _dividendIndex Dividend to calculate
   * @param _payee Affected investor address
   * @return full claim
   * @return amount to be withheld
   */
  function calculateDividendWithholding(uint256 _dividendIndex, address _payee) public view returns(uint256, uint256) {
      Dividend storage dividend = dividends[_dividendIndex];
      if (dividend.claimed[_payee]) {
          return (0, 0);
      }
      uint256 balance = ISecurityToken(securityToken).balanceOfAt(_payee, dividend.checkpointId);
      uint256 claim = balance.mul(dividend.amount).div(dividend.totalSupply);
      uint256 withheld = claim.mul(uint256(10**18).sub(withholdingTax[_payee])).div(uint256(10**18));
      return (claim, withheld);
  }

  /**
   * @notice Allows issuer to withdraw withheld tax
   * @param _dividendIndex Dividend to withdraw from
   */
  function withdrawWithholding(uint256 _dividendIndex) public onlyOwner {
      uint256 remainingWithheld = dividendWithheld[_dividendIndex].sub(dividendWithheldReclaimed[_dividendIndex]);
      dividendWithheldReclaimed[_dividendIndex] = dividendWithheld[_dividendIndex];
      msg.sender.transfer(remainingWithheld);
      emit EtherDividendWithholdingWithdrawn(msg.sender, _dividendIndex, remainingWithheld);
  }

}
