pragma solidity 0.5.8;

import "../DividendCheckpoint.sol";
import "./ERC20DividendCheckpointStorage.sol";
import "../../../../interfaces/IOwnable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

/**
 * @title Checkpoint module for issuing ERC20 dividends
 */
contract ERC20DividendCheckpoint is ERC20DividendCheckpointStorage, DividendCheckpoint {
    using SafeMath for uint256;

    event ERC20DividendDeposited(
        address indexed _depositor,
        uint256 _checkpointId,
        uint256 _maturity,
        uint256 _expiry,
        address indexed _token,
        uint256 _amount,
        uint256 _totalSupply,
        uint256 _dividendIndex,
        bytes32 indexed _name
    );
    event ERC20DividendClaimed(address indexed _payee, uint256 indexed _dividendIndex, address indexed _token, uint256 _amount, uint256 _withheld);
    event ERC20DividendReclaimed(address indexed _claimer, uint256 indexed _dividendIndex, address indexed _token, uint256 _claimedAmount);
    event ERC20DividendWithholdingWithdrawn(
        address indexed _claimer,
        uint256 indexed _dividendIndex,
        address indexed _token,
        uint256 _withheldAmount
    );

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor(address _securityToken, address _polyToken) public Module(_securityToken, _polyToken) {

    }

    /**
     * @notice Creates a dividend and checkpoint for the dividend
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _name Name/Title for identification
     */
    function createDividend(
        uint256 _maturity,
        uint256 _expiry,
        address _token,
        uint256 _amount,
        bytes32 _name
    )
        external
        withPerm(ADMIN)
    {
        createDividendWithExclusions(_maturity, _expiry, _token, _amount, excluded, _name);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _checkpointId Checkpoint id from which to create dividends
     * @param _name Name/Title for identification
     */
    function createDividendWithCheckpoint(
        uint256 _maturity,
        uint256 _expiry,
        address _token,
        uint256 _amount,
        uint256 _checkpointId,
        bytes32 _name
    )
        external
        withPerm(ADMIN)
    {
        _createDividendWithCheckpointAndExclusions(_maturity, _expiry, _token, _amount, _checkpointId, excluded, _name);
    }

    /**
     * @notice Creates a dividend and checkpoint for the dividend
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _excluded List of addresses to exclude
     * @param _name Name/Title for identification
     */
    function createDividendWithExclusions(
        uint256 _maturity,
        uint256 _expiry,
        address _token,
        uint256 _amount,
        address[] memory _excluded,
        bytes32 _name
    )
        public
        withPerm(ADMIN)
    {
        uint256 checkpointId = securityToken.createCheckpoint();
        _createDividendWithCheckpointAndExclusions(_maturity, _expiry, _token, _amount, checkpointId, _excluded, _name);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _checkpointId Checkpoint id from which to create dividends
     * @param _excluded List of addresses to exclude
     * @param _name Name/Title for identification
     */
    function createDividendWithCheckpointAndExclusions(
        uint256 _maturity,
        uint256 _expiry,
        address _token,
        uint256 _amount,
        uint256 _checkpointId,
        address[] memory _excluded,
        bytes32 _name
    )
        public
        withPerm(ADMIN)
    {
        _createDividendWithCheckpointAndExclusions(_maturity, _expiry, _token, _amount, _checkpointId, _excluded, _name);
    }

    /**
     * @notice Creates a dividend with a provided checkpoint
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _checkpointId Checkpoint id from which to create dividends
     * @param _excluded List of addresses to exclude
     * @param _name Name/Title for identification
     */
    function _createDividendWithCheckpointAndExclusions(
        uint256 _maturity,
        uint256 _expiry,
        address _token,
        uint256 _amount,
        uint256 _checkpointId,
        address[] memory _excluded,
        bytes32 _name
    )
        internal
    {
        require(_excluded.length <= EXCLUDED_ADDRESS_LIMIT, "Too many addresses excluded");
        require(_expiry > _maturity, "Expiry before maturity");
        /*solium-disable-next-line security/no-block-members*/
        require(_expiry > now, "Expiry in past");
        require(_amount > 0, "No dividend sent");
        require(_token != address(0), "Invalid token");
        require(_checkpointId <= securityToken.currentCheckpointId(), "Invalid checkpoint");
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "insufficent allowance");
        require(_name != bytes32(0));
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
                _amount,
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
        dividendTokens[dividendIndex] = _token;
        _emitERC20DividendDepositedEvent(_checkpointId, _maturity, _expiry, _token, _amount, currentSupply, dividendIndex, _name);
    }

    /**
     * @notice Emits the ERC20DividendDeposited event.
     * Seperated into a different function as a workaround for stack too deep error
     */
    function _emitERC20DividendDepositedEvent(
        uint256 _checkpointId,
        uint256 _maturity,
        uint256 _expiry,
        address _token,
        uint256 _amount,
        uint256 currentSupply,
        uint256 dividendIndex,
        bytes32 _name
    )
        internal
    {
        /*solium-disable-next-line security/no-block-members*/
        emit ERC20DividendDeposited(
            msg.sender,
            _checkpointId,
            _maturity,
            _expiry,
            _token,
            _amount,
            currentSupply,
            dividendIndex,
            _name
        );
    }

    /**
     * @notice Internal function for paying dividends
     * @param _payee Address of investor
     * @param _dividend Storage with previously issued dividends
     * @param _dividendIndex Dividend to pay
     */
    function _payDividend(address payable _payee, Dividend storage _dividend, uint256 _dividendIndex) internal {
        (uint256 claim, uint256 withheld) = calculateDividend(_dividendIndex, _payee);
        _dividend.claimed[_payee] = true;
        _dividend.claimedAmount = claim.add(_dividend.claimedAmount);
        uint256 claimAfterWithheld = claim.sub(withheld);
        if (claimAfterWithheld > 0) {
            require(IERC20(dividendTokens[_dividendIndex]).transfer(_payee, claimAfterWithheld), "transfer failed");
        }
        if (withheld > 0) {
            _dividend.totalWithheld = _dividend.totalWithheld.add(withheld);
            _dividend.withheld[_payee] = withheld;
        }
        emit ERC20DividendClaimed(_payee, _dividendIndex, dividendTokens[_dividendIndex], claim, withheld);
    }

    /**
     * @notice Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends
     * @param _dividendIndex Dividend to reclaim
     */
    function reclaimDividend(uint256 _dividendIndex) external withPerm(OPERATOR) {
        require(_dividendIndex < dividends.length, "Invalid dividend");
        /*solium-disable-next-line security/no-block-members*/
        require(now >= dividends[_dividendIndex].expiry, "Dividend expiry in future");
        require(!dividends[_dividendIndex].reclaimed, "already claimed");
        dividends[_dividendIndex].reclaimed = true;
        Dividend storage dividend = dividends[_dividendIndex];
        uint256 remainingAmount = dividend.amount.sub(dividend.claimedAmount);
        require(IERC20(dividendTokens[_dividendIndex]).transfer(getTreasuryWallet(), remainingAmount), "transfer failed");
        emit ERC20DividendReclaimed(wallet, _dividendIndex, dividendTokens[_dividendIndex], remainingAmount);
    }

    /**
     * @notice Allows issuer to withdraw withheld tax
     * @param _dividendIndex Dividend to withdraw from
     */
    function withdrawWithholding(uint256 _dividendIndex) external withPerm(OPERATOR) {
        require(_dividendIndex < dividends.length, "Invalid dividend");
        Dividend storage dividend = dividends[_dividendIndex];
        uint256 remainingWithheld = dividend.totalWithheld.sub(dividend.totalWithheldWithdrawn);
        dividend.totalWithheldWithdrawn = dividend.totalWithheld;
        require(IERC20(dividendTokens[_dividendIndex]).transfer(getTreasuryWallet(), remainingWithheld), "transfer failed");
        emit ERC20DividendWithholdingWithdrawn(wallet, _dividendIndex, dividendTokens[_dividendIndex], remainingWithheld);
    }

}
