pragma solidity ^0.4.24;

import "./ICheckpoint.sol";
import "../Module.sol";
import "../../interfaces/ISecurityToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";

/**
 * @title Checkpoint module for issuing ether dividends
 * @dev abstract contract
 */
contract DividendCheckpoint is ICheckpoint, Module {
    using SafeMath for uint256;

    uint256 public EXCLUDED_ADDRESS_LIMIT = 50;
    bytes32 public constant DISTRIBUTE = "DISTRIBUTE";

    struct Dividend {
      uint256 checkpointId;
      uint256 created; // Time at which the dividend was created
      uint256 maturity; // Time after which dividend can be claimed - set to 0 to bypass
      uint256 expiry;  // Time until which dividend can be claimed - after this time any remaining amount can be withdrawn by issuer - set to very high value to bypass
      uint256 amount; // Dividend amount in WEI
      uint256 claimedAmount; // Amount of dividend claimed so far
      uint256 totalSupply; // Total supply at the associated checkpoint (avoids recalculating this)
      bool reclaimed;  // True if expiry has passed and issuer has reclaimed remaining dividend
      uint256 dividendWithheld;
      uint256 dividendWithheldReclaimed;
      mapping (address => bool) claimed; // List of addresses which have claimed dividend
      mapping (address => bool) dividendExcluded; // List of addresses which cannot claim dividends
      bytes32 name; // Name/title - used for identification
    }

    // List of all dividends
    Dividend[] public dividends;

    // List of addresses which cannot claim dividends
    address[] public excluded;

    // Mapping from address to withholding tax as a percentage * 10**16
    mapping (address => uint256) public withholdingTax;

    // Total amount of ETH withheld per investor
    mapping (address => uint256) public investorWithheld;

    event SetDefaultExcludedAddresses(address[] _excluded, uint256 _timestamp);
    event SetWithholding(address[] _investors, uint256[] _withholding, uint256 _timestamp);
    event SetWithholdingFixed(address[] _investors, uint256 _withholding, uint256 _timestamp);

    modifier validDividendIndex(uint256 _dividendIndex) {
        require(_dividendIndex < dividends.length, "Incorrect dividend index");
        require(now >= dividends[_dividendIndex].maturity, "Dividend maturity is in the future");
        require(now < dividends[_dividendIndex].expiry, "Dividend expiry is in the past");
        require(!dividends[_dividendIndex].reclaimed, "Dividend has been reclaimed by issuer");
        _;
    }

    /**
    * @notice Init function i.e generalise function to maintain the structure of the module contract
    * @return bytes4
    */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Return the default excluded addresses
     * @return List of excluded addresses
     */
    function getDefaultExcluded() external view returns (address[]) {
        return excluded;
    }

    /**
     * @notice Function to clear and set list of excluded addresses used for future dividends
     * @param _excluded addresses of investor
     */
    function setDefaultExcluded(address[] _excluded) public onlyOwner {
        require(_excluded.length <= EXCLUDED_ADDRESS_LIMIT, "Too many excluded addresses");
        excluded = _excluded;
        emit SetDefaultExcludedAddresses(excluded, now);
    }

    /**
     * @notice Function to set withholding tax rates for investors
     * @param _investors addresses of investor
     * @param _withholding withholding tax for individual investors (multiplied by 10**16)
     */
    function setWithholding(address[] _investors, uint256[] _withholding) public onlyOwner {
        require(_investors.length == _withholding.length, "Mismatched input lengths");
        emit SetWithholding(_investors, _withholding, now);
        for (uint256 i = 0; i < _investors.length; i++) {
            require(_withholding[i] <= 10**18, "Incorrect withholding tax");
            withholdingTax[_investors[i]] = _withholding[i];
        }
    }

    /**
     * @notice Function to set withholding tax rates for investors
     * @param _investors addresses of investor
     * @param _withholding withholding tax for all investors (multiplied by 10**16)
     */
    function setWithholdingFixed(address[] _investors, uint256 _withholding) public onlyOwner {
        require(_withholding <= 10**18, "Incorrect withholding tax");
        emit SetWithholdingFixed(_investors, _withholding, now);
        for (uint256 i = 0; i < _investors.length; i++) {
            withholdingTax[_investors[i]] = _withholding;
        }
    }

    /**
     * @notice Issuer can push dividends to provided addresses
     * @param _dividendIndex Dividend to push
     * @param _payees Addresses to which to push the dividend
     */
    function pushDividendPaymentToAddresses(uint256 _dividendIndex, address[] _payees) public withPerm(DISTRIBUTE) validDividendIndex(_dividendIndex) {
        Dividend storage dividend = dividends[_dividendIndex];
        for (uint256 i = 0; i < _payees.length; i++) {
            if ((!dividend.claimed[_payees[i]]) && (!dividend.dividendExcluded[_payees[i]])) {
                _payDividend(_payees[i], dividend, _dividendIndex);
            }
        }
    }

    /**
     * @notice Issuer can push dividends using the investor list from the security token
     * @param _dividendIndex Dividend to push
     * @param _start Index in investor list at which to start pushing dividends
     * @param _iterations Number of addresses to push dividends for
     */
    function pushDividendPayment(uint256 _dividendIndex, uint256 _start, uint256 _iterations) public withPerm(DISTRIBUTE) validDividendIndex(_dividendIndex) {
        Dividend storage dividend = dividends[_dividendIndex];
        address[] memory investors = ISecurityToken(securityToken).getInvestors();
        uint256 numberInvestors = Math.min256(investors.length, _start.add(_iterations));
        for (uint256 i = _start; i < numberInvestors; i++) {
            address payee = investors[i];
            if ((!dividend.claimed[payee]) && (!dividend.dividendExcluded[payee])) {
                _payDividend(payee, dividend, _dividendIndex);
            }
        }
    }

    /**
     * @notice Investors can pull their own dividends
     * @param _dividendIndex Dividend to pull
     */
    function pullDividendPayment(uint256 _dividendIndex) public validDividendIndex(_dividendIndex)
    {
        Dividend storage dividend = dividends[_dividendIndex];
        require(!dividend.claimed[msg.sender], "Dividend already claimed by msg.sender");
        require(!dividend.dividendExcluded[msg.sender], "msg.sender excluded from Dividend");
        _payDividend(msg.sender, dividend, _dividendIndex);
    }

    /**
     * @notice Internal function for paying dividends
     * @param _payee address of investor
     * @param _dividend storage with previously issued dividends
     * @param _dividendIndex Dividend to pay
     */
    function _payDividend(address _payee, Dividend storage _dividend, uint256 _dividendIndex) internal;

    /**
     * @notice Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends
     * @param _dividendIndex Dividend to reclaim
     */
    function reclaimDividend(uint256 _dividendIndex) external;

    /**
     * @notice Calculate amount of dividends claimable
     * @param _dividendIndex Dividend to calculate
     * @param _payee Affected investor address
     * @return claim, withheld amounts
     */
    function calculateDividend(uint256 _dividendIndex, address _payee) public view returns(uint256, uint256) {
        require(_dividendIndex < dividends.length, "Incorrect dividend index");
        Dividend storage dividend = dividends[_dividendIndex];
        if (dividend.claimed[_payee] || dividend.dividendExcluded[_payee]) {
            return (0, 0);
        }
        uint256 balance = ISecurityToken(securityToken).balanceOfAt(_payee, dividend.checkpointId);
        uint256 claim = balance.mul(dividend.amount).div(dividend.totalSupply);
        uint256 withheld = claim.mul(withholdingTax[_payee]).div(uint256(10**18));
        return (claim, withheld);
    }

    /**
     * @notice Get the index according to the checkpoint id
     * @param _checkpointId Checkpoint id to query
     * @return uint256[]
     */
    function getDividendIndex(uint256 _checkpointId) public view returns(uint256[]) {
        uint256 counter = 0;
        for(uint256 i = 0; i < dividends.length; i++) {
            if (dividends[i].checkpointId == _checkpointId) {
                counter++;
            }
        }

       uint256[] memory index = new uint256[](counter);
       counter = 0;
       for(uint256 j = 0; j < dividends.length; j++) {
           if (dividends[j].checkpointId == _checkpointId) {
               index[counter] = j;
               counter++;
           }
       }
       return index;
    }

    /**
     * @notice Allows issuer to withdraw withheld tax
     * @param _dividendIndex Dividend to withdraw from
     */
    function withdrawWithholding(uint256 _dividendIndex) external;

    /**
     * @notice Return the permissions flag that are associated with STO
     * @return bytes32 array
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = DISTRIBUTE;
        return allPermissions;
    }

}
