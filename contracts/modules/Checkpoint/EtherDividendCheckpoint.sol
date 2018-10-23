pragma solidity ^0.4.24;

import "./DividendCheckpoint.sol";
import "../../interfaces/IOwnable.sol";

/**
 * @title Checkpoint module for issuing ether dividends
 */
contract EtherDividendCheckpoint is DividendCheckpoint {
    using SafeMath for uint256;
    /*solium-disable-next-line indentation*/
    event EtherDividendDeposited(address indexed _depositor, uint256 _checkpointId, uint256 _created, uint256 _maturity, uint256 _expiry,
                                 uint256 _amount, uint256 _totalSupply, uint256 _dividendIndex, bytes32 indexed _name); /*solium-disable-line indentation*/
    event EtherDividendClaimed(address indexed _payee, uint256 _dividendIndex, uint256 _amount, uint256 _withheld);
    event EtherDividendReclaimed(address indexed _claimer, uint256 _dividendIndex, uint256 _claimedAmount);
    event EtherDividendClaimFailed(address indexed _payee, uint256 _dividendIndex, uint256 _amount, uint256 _withheld);
    event EtherDividendWithholdingWithdrawn(address indexed _claimer, uint256 _dividendIndex, uint256 _withheldAmount);

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
     * @notice Creates a dividend and checkpoint for the dividend, using global list of excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _name name/title for identification
     */
    function createDividend(uint256 _maturity, uint256 _expiry, bytes32 _name) external payable withPerm(MANAGE) {
        createDividendWithExclusions(_maturity, _expiry, excluded, _name);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint, using global list of excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _checkpointId Id of the checkpoint from which to issue dividend
     * @param _name name/title for identification
     */
    function createDividendWithCheckpoint(uint256 _maturity, uint256 _expiry, uint256 _checkpointId, bytes32 _name) external payable withPerm(MANAGE) {
        _createDividendWithCheckpointAndExclusions(_maturity, _expiry, _checkpointId, excluded, _name);
    }

    /**
     * @notice Creates a dividend and checkpoint for the dividend, specifying explicit excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _excluded List of addresses to exclude
     * @param _name name/title for identification
     */
    function createDividendWithExclusions(uint256 _maturity, uint256 _expiry, address[] _excluded, bytes32 _name) public payable withPerm(MANAGE) {
        uint256 checkpointId = ISecurityToken(securityToken).createCheckpoint();
        _createDividendWithCheckpointAndExclusions(_maturity, _expiry, checkpointId, _excluded, _name);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint, specifying explicit excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _checkpointId Id of the checkpoint from which to issue dividend
     * @param _excluded List of addresses to exclude
     * @param _name name/title for identification
     */
    function createDividendWithCheckpointAndExclusions(
        uint256 _maturity, 
        uint256 _expiry, 
        uint256 _checkpointId, 
        address[] _excluded, 
        bytes32 _name
    )
        public
        payable
        withPerm(MANAGE)
    {
        _createDividendWithCheckpointAndExclusions(_maturity, _expiry, _checkpointId, _excluded, _name);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint, specifying explicit excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _checkpointId Id of the checkpoint from which to issue dividend
     * @param _excluded List of addresses to exclude
     * @param _name name/title for identification
     */
    function _createDividendWithCheckpointAndExclusions(
        uint256 _maturity, 
        uint256 _expiry, 
        uint256 _checkpointId, 
        address[] _excluded, 
        bytes32 _name
    ) 
        internal
    {
        require(_excluded.length <= EXCLUDED_ADDRESS_LIMIT, "Too many addresses excluded");
        require(_expiry > _maturity, "Expiry is before maturity");
        require(_expiry > now, "Expiry is in the past");
        require(msg.value > 0, "No dividend sent");
        require(_checkpointId <= ISecurityToken(securityToken).currentCheckpointId());
        require(_name[0] != 0);
        uint256 dividendIndex = dividends.length;
        uint256 currentSupply = ISecurityToken(securityToken).totalSupplyAt(_checkpointId);
        uint256 excludedSupply = 0;
        for (uint256 i = 0; i < _excluded.length; i++) {
            excludedSupply = excludedSupply.add(ISecurityToken(securityToken).balanceOfAt(_excluded[i], _checkpointId));
        }
        dividends.push(
          Dividend(
            _checkpointId,
            now,
            _maturity,
            _expiry,
            msg.value,
            0,
            currentSupply.sub(excludedSupply),
            false,
            0,
            0,
            _name
          )
        );
        for (uint256 j = 0; j < _excluded.length; j++) {
            dividends[dividends.length - 1].dividendExcluded[_excluded[j]] = true;
        }
        emit EtherDividendDeposited(msg.sender, _checkpointId, now, _maturity, _expiry, msg.value, currentSupply, dividendIndex, _name);
    }

    /**
     * @notice Internal function for paying dividends
     * @param _payee address of investor
     * @param _dividend storage with previously issued dividends
     * @param _dividendIndex Dividend to pay
     */
    function _payDividend(address _payee, Dividend storage _dividend, uint256 _dividendIndex) internal {
        (uint256 claim, uint256 withheld) = calculateDividend(_dividendIndex, _payee);
        _dividend.claimed[_payee] = true;      
        uint256 claimAfterWithheld = claim.sub(withheld);
        if (claimAfterWithheld > 0) {
            if (_payee.send(claimAfterWithheld)) {
                _dividend.claimedAmount = _dividend.claimedAmount.add(claim);
                _dividend.dividendWithheld = _dividend.dividendWithheld.add(withheld);
                investorWithheld[_payee] = investorWithheld[_payee].add(withheld);
                emit EtherDividendClaimed(_payee, _dividendIndex, claim, withheld);
            } else {
                _dividend.claimed[_payee] = false;
                emit EtherDividendClaimFailed(_payee, _dividendIndex, claim, withheld);
            }
        }
    }

    /**
     * @notice Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends
     * @param _dividendIndex Dividend to reclaim
     */
    function reclaimDividend(uint256 _dividendIndex) external withPerm(MANAGE) {
        require(_dividendIndex < dividends.length, "Incorrect dividend index");
        require(now >= dividends[_dividendIndex].expiry, "Dividend expiry is in the future");
        require(!dividends[_dividendIndex].reclaimed, "Dividend already claimed");
        Dividend storage dividend = dividends[_dividendIndex];
        dividend.reclaimed = true;
        uint256 remainingAmount = dividend.amount.sub(dividend.claimedAmount);
        address owner = IOwnable(securityToken).owner();
        owner.transfer(remainingAmount);
        emit EtherDividendReclaimed(owner, _dividendIndex, remainingAmount);
    }

    /**
     * @notice Allows issuer to withdraw withheld tax
     * @param _dividendIndex Dividend to withdraw from
     */
    function withdrawWithholding(uint256 _dividendIndex) external withPerm(MANAGE) {
        require(_dividendIndex < dividends.length, "Incorrect dividend index");
        Dividend storage dividend = dividends[_dividendIndex];
        uint256 remainingWithheld = dividend.dividendWithheld.sub(dividend.dividendWithheldReclaimed);
        dividend.dividendWithheldReclaimed = dividend.dividendWithheld;
        address owner = IOwnable(securityToken).owner();
        owner.transfer(remainingWithheld);
        emit EtherDividendWithholdingWithdrawn(owner, _dividendIndex, remainingWithheld);
    }

}
