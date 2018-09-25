pragma solidity ^0.4.24;

import "./DividendCheckpoint.sol";
import "../../interfaces/IERC20.sol";

/**
 * @title Checkpoint module for issuing ERC20 dividends
 */
contract ERC20DividendCheckpoint is DividendCheckpoint {
    using SafeMath for uint256;

    // Mapping to token address for each dividend
    mapping (uint256 => address) public dividendTokens;

    event ERC20DividendDeposited(address indexed _depositor, uint256 _checkpointId, uint256 _created, uint256 _maturity, uint256 _expiry, address indexed _token, uint256 _amount, uint256 _totalSupply, uint256 _dividendIndex);
    event ERC20DividendClaimed(address indexed _payee, uint256 _dividendIndex, address indexed _token, uint256 _amount, uint256 _withheld);
    event ERC20DividendReclaimed(address indexed _claimer, uint256 _dividendIndex, address indexed _token, uint256 _claimedAmount);
    event ERC20DividendWithholdingWithdrawn(address indexed _claimer, uint256 _dividendIndex, address indexed _token, uint256 _withheldAmount);

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
     * @notice Creates a dividend and checkpoint for the dividend
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     */
    function createDividend(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount) external onlyOwner {
        createDividendWithExclusions(_maturity, _expiry, _token, _amount, excluded);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _checkpointId Checkpoint id from which to create dividends
     */
    function createDividendWithCheckpoint(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, uint256 _checkpointId) external onlyOwner {
        createDividendWithCheckpointAndExclusions(_maturity, _expiry, _token, _amount, _checkpointId, excluded);
    }

    /**
     * @notice Creates a dividend and checkpoint for the dividend
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _excluded List of addresses to exclude
     */
    function createDividendWithExclusions(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, address[] _excluded) public onlyOwner {
        uint256 checkpointId = ISecurityToken(securityToken).createCheckpoint();
        createDividendWithCheckpointAndExclusions(_maturity, _expiry, _token, _amount, checkpointId, _excluded);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _checkpointId Checkpoint id from which to create dividends
     * @param _excluded List of addresses to exclude
     */
    function createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, uint256 _checkpointId, address[] _excluded) public onlyOwner {
        require(_excluded.length <= EXCLUDED_ADDRESS_LIMIT, "Too many addresses excluded");
        require(_expiry > _maturity, "Expiry is before maturity");
        require(_expiry > now, "Expiry is in the past");
        require(_amount > 0, "No dividend sent");
        require(_token != address(0), "0x not valid token");
        require(_checkpointId <= ISecurityToken(securityToken).currentCheckpointId(), "Invalid checkpoint");
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "Unable to transfer tokens for dividend");
        uint256 dividendIndex = dividends.length;
        uint256 currentSupply = ISecurityToken(securityToken).totalSupplyAt(_checkpointId);
        uint256 excludedSupply = 0;
        for (uint256 i = 0; i < _excluded.length; i++) {
            excludedSupply = excludedSupply.add(ISecurityToken(securityToken).balanceOf(_excluded[i]));
        }
        dividends.push(
          Dividend(
            _checkpointId,
            now,
            _maturity,
            _expiry,
            _amount,
            0,
            currentSupply.sub(excludedSupply),
            false,
            0,
            0
          )
        );
        for (uint256 j = 0; j < _excluded.length; j++) {
            dividends[dividends.length - 1].dividendExcluded[_excluded[j]] = true;
        }
        dividendTokens[dividendIndex] = _token;
        emit ERC20DividendDeposited(msg.sender, _checkpointId, now, _maturity, _expiry, _token, _amount, currentSupply, dividendIndex);
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
        _dividend.claimedAmount = claim.add(_dividend.claimedAmount);
        uint256 claimAfterWithheld = claim.sub(withheld);
        if (claimAfterWithheld > 0) {
            require(IERC20(dividendTokens[_dividendIndex]).transfer(_payee, claim), "Unable to transfer tokens");
            emit ERC20DividendClaimed(_payee, _dividendIndex, dividendTokens[_dividendIndex], claim, withheld);
        }
    }

    /**
     * @notice Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends
     * @param _dividendIndex Dividend to reclaim
     */
    function reclaimDividend(uint256 _dividendIndex) external onlyOwner {
        require(_dividendIndex < dividends.length, "Incorrect dividend index");
        require(now >= dividends[_dividendIndex].expiry, "Dividend expiry is in the future");
        require(!dividends[_dividendIndex].reclaimed, "Dividend already claimed");
        dividends[_dividendIndex].reclaimed = true;
        Dividend storage dividend = dividends[_dividendIndex];
        uint256 remainingAmount = dividend.amount.sub(dividend.claimedAmount);
        require(IERC20(dividendTokens[_dividendIndex]).transfer(msg.sender, remainingAmount), "Unable to transfer tokens");
        emit ERC20DividendReclaimed(msg.sender, _dividendIndex, dividendTokens[_dividendIndex], remainingAmount);
    }

    /**
     * @notice Allows issuer to withdraw withheld tax
     * @param _dividendIndex Dividend to withdraw from
     */
    function withdrawWithholding(uint256 _dividendIndex) external onlyOwner {
        require(_dividendIndex < dividends.length, "Incorrect dividend index");
        Dividend storage dividend = dividends[_dividendIndex];
        uint256 remainingWithheld = dividend.dividendWithheld.sub(dividend.dividendWithheldReclaimed);
        dividend.dividendWithheldReclaimed = dividend.dividendWithheld;
        require(IERC20(dividendTokens[_dividendIndex]).transfer(msg.sender, remainingWithheld), "Unable to transfer tokens");
        emit ERC20DividendWithholdingWithdrawn(msg.sender, _dividendIndex, dividendTokens[_dividendIndex], remainingWithheld);
    }

}
