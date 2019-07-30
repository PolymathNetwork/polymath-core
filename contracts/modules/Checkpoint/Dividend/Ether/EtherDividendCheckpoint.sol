pragma solidity 0.5.8;

import "../DividendCheckpoint.sol";
import "../../../../interfaces/IOwnable.sol";

/**
 * @title Checkpoint module for issuing ether dividends
 */
contract EtherDividendCheckpoint is DividendCheckpoint {
    using SafeMath for uint256;

    event EtherDividendDeposited(
        address indexed _depositor,
        uint256 _checkpointId,
        uint256 _maturity,
        uint256 _expiry,
        uint256 _amount,
        uint256 _totalSupply,
        uint256 indexed _dividendIndex,
        bytes32 indexed _name
    );
    event EtherDividendClaimed(address indexed _payee, uint256 indexed _dividendIndex, uint256 _amount, uint256 _withheld);
    event EtherDividendReclaimed(address indexed _claimer, uint256 indexed _dividendIndex, uint256 _claimedAmount);
    event EtherDividendClaimFailed(address indexed _payee, uint256 indexed _dividendIndex, uint256 _amount, uint256 _withheld);
    event EtherDividendWithholdingWithdrawn(address indexed _claimer, uint256 indexed _dividendIndex, uint256 _withheldAmount);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor(address _securityToken, address _polyToken) public Module(_securityToken, _polyToken) {

    }

    /**
     * @notice Creates a dividend and checkpoint for the dividend, using global list of excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _name Name/title for identification
     */
    function createDividend(uint256 _maturity, uint256 _expiry, bytes32 _name) external payable withPerm(ADMIN) {
        createDividendWithExclusions(_maturity, _expiry, excluded, _name);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint, using global list of excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _checkpointId Id of the checkpoint from which to issue dividend
     * @param _name Name/title for identification
     */
    function createDividendWithCheckpoint(
        uint256 _maturity,
        uint256 _expiry,
        uint256 _checkpointId,
        bytes32 _name
    )
        external
        payable
        withPerm(ADMIN)
    {
        _createDividendWithCheckpointAndExclusions(_maturity, _expiry, _checkpointId, excluded, _name);
    }

    /**
     * @notice Creates a dividend and checkpoint for the dividend, specifying explicit excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _excluded List of addresses to exclude
     * @param _name Name/title for identification
     */
    function createDividendWithExclusions(
        uint256 _maturity,
        uint256 _expiry,
        address[] memory _excluded,
        bytes32 _name
    )
        public
        payable
        withPerm(ADMIN)
    {
        uint256 checkpointId = securityToken.createCheckpoint();
        _createDividendWithCheckpointAndExclusions(_maturity, _expiry, checkpointId, _excluded, _name);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint, specifying explicit excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _checkpointId Id of the checkpoint from which to issue dividend
     * @param _excluded List of addresses to exclude
     * @param _name Name/title for identification
     */
    function createDividendWithCheckpointAndExclusions(
        uint256 _maturity,
        uint256 _expiry,
        uint256 _checkpointId,
        address[] memory _excluded,
        bytes32 _name
    )
        public
        payable
        withPerm(ADMIN)
    {
        _createDividendWithCheckpointAndExclusions(_maturity, _expiry, _checkpointId, _excluded, _name);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint, specifying explicit excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _checkpointId Id of the checkpoint from which to issue dividend
     * @param _excluded List of addresses to exclude
     * @param _name Name/title for identification
     */
    function _createDividendWithCheckpointAndExclusions(
        uint256 _maturity,
        uint256 _expiry,
        uint256 _checkpointId,
        address[] memory _excluded,
        bytes32 _name
    )
        internal
    {
        require(_excluded.length <= EXCLUDED_ADDRESS_LIMIT, "Too many addresses excluded");
        require(_expiry > _maturity, "Expiry is before maturity");
        /*solium-disable-next-line security/no-block-members*/
        require(_expiry > now, "Expiry is in the past");
        require(msg.value > 0, "No dividend sent");
        require(_checkpointId <= securityToken.currentCheckpointId());
        require(_name[0] != bytes32(0));
        uint256 dividendIndex = dividends.length;
        uint256 currentSupply = securityToken.totalSupplyAt(_checkpointId);
        require(currentSupply > 0, "Invalid supply");
        uint256 excludedSupply = 0;
        dividends.push(
            Dividend(
                _checkpointId,
                now, /*solium-disable-line security/no-block-members*/
                _maturity,
                _expiry,
                msg.value,
                0,
                0,
                false,
                0,
                0,
                _name
            )
        );

        for (uint256 j = 0; j < _excluded.length; j++) {
            require(_excluded[j] != address(0), "Invalid address");
            require(!dividends[dividendIndex].dividendExcluded[_excluded[j]], "duped exclude address");
            excludedSupply = excludedSupply.add(securityToken.balanceOfAt(_excluded[j], _checkpointId));
            dividends[dividendIndex].dividendExcluded[_excluded[j]] = true;
        }
        require(currentSupply > excludedSupply, "Invalid supply");
        dividends[dividendIndex].totalSupply = currentSupply - excludedSupply;
        /*solium-disable-next-line security/no-block-members*/
        emit EtherDividendDeposited(msg.sender, _checkpointId, _maturity, _expiry, msg.value, currentSupply, dividendIndex, _name);
    }

    /**
     * @notice Internal function for paying dividends
     * @param _payee address of investor
     * @param _dividend storage with previously issued dividends
     * @param _dividendIndex Dividend to pay
     */
    function _payDividend(address payable _payee, Dividend storage _dividend, uint256 _dividendIndex) internal {
        (uint256 claim, uint256 withheld) = calculateDividend(_dividendIndex, _payee);
        _dividend.claimed[_payee] = true;
        uint256 claimAfterWithheld = claim.sub(withheld);
        /*solium-disable-next-line security/no-send*/
        if (_payee.send(claimAfterWithheld)) {
            _dividend.claimedAmount = _dividend.claimedAmount.add(claim);
            if (withheld > 0) {
                _dividend.totalWithheld = _dividend.totalWithheld.add(withheld);
                _dividend.withheld[_payee] = withheld;
            }
            emit EtherDividendClaimed(_payee, _dividendIndex, claim, withheld);
        } else {
            _dividend.claimed[_payee] = false;
            emit EtherDividendClaimFailed(_payee, _dividendIndex, claim, withheld);
        }
    }

    /**
     * @notice Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends
     * @param _dividendIndex Dividend to reclaim
     */
    function reclaimDividend(uint256 _dividendIndex) external withPerm(OPERATOR) {
        require(_dividendIndex < dividends.length, "Incorrect dividend index");
        /*solium-disable-next-line security/no-block-members*/
        require(now >= dividends[_dividendIndex].expiry, "Dividend expiry is in the future");
        require(!dividends[_dividendIndex].reclaimed, "Dividend is already claimed");
        Dividend storage dividend = dividends[_dividendIndex];
        dividend.reclaimed = true;
        uint256 remainingAmount = dividend.amount.sub(dividend.claimedAmount);
        address payable wallet = getTreasuryWallet();
        wallet.transfer(remainingAmount);
        emit EtherDividendReclaimed(wallet, _dividendIndex, remainingAmount);
    }

    /**
     * @notice Allows issuer to withdraw withheld tax
     * @param _dividendIndex Dividend to withdraw from
     */
    function withdrawWithholding(uint256 _dividendIndex) external withPerm(OPERATOR) {
        require(_dividendIndex < dividends.length, "Incorrect dividend index");
        Dividend storage dividend = dividends[_dividendIndex];
        uint256 remainingWithheld = dividend.totalWithheld.sub(dividend.totalWithheldWithdrawn);
        dividend.totalWithheldWithdrawn = dividend.totalWithheld;
        address payable wallet = getTreasuryWallet();
        wallet.transfer(remainingWithheld);
        emit EtherDividendWithholdingWithdrawn(wallet, _dividendIndex, remainingWithheld);
    }

}
