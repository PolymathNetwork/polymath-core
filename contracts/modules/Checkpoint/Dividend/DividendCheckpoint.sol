/**
 * DISCLAIMER: Under certain conditions, the function pushDividendPayment
 * may fail due to block gas limits.
 * If the total number of investors that ever held tokens is greater than ~15,000 then
 * the function may fail. If this happens investors can pull their dividends, or the Issuer
 * can use pushDividendPaymentToAddresses to provide an explict address list in batches
 */
pragma solidity 0.5.8;

import ".././ICheckpoint.sol";
import "../../../storage/modules/Checkpoint/Dividend/DividendCheckpointStorage.sol";
import "../../Module.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";

/**
 * @title Checkpoint module for issuing ether dividends
 * @dev abstract contract
 */
contract DividendCheckpoint is DividendCheckpointStorage, ICheckpoint, Module {
    using SafeMath for uint256;
    uint256 internal constant e18 = uint256(10) ** uint256(18);

    event SetDefaultExcludedAddresses(address[] _excluded);
    event SetWithholding(address[] _investors, uint256[] _withholding);
    event SetWithholdingFixed(address[] _investors, uint256 _withholding);
    event SetWallet(address indexed _oldWallet, address indexed _newWallet);
    event UpdateDividendDates(uint256 indexed _dividendIndex, uint256 _maturity, uint256 _expiry);

    function _validDividendIndex(uint256 _dividendIndex) internal view {
        require(_dividendIndex < dividends.length, "Invalid dividend");
        require(!dividends[_dividendIndex].reclaimed, "Dividend reclaimed");
        /*solium-disable-next-line security/no-block-members*/
        require(now >= dividends[_dividendIndex].maturity, "Dividend maturity in future");
        /*solium-disable-next-line security/no-block-members*/
        require(now < dividends[_dividendIndex].expiry, "Dividend expiry in past");
    }

    /**
     * @notice Function used to intialize the contract variables
     * @param _wallet Ethereum account address to receive reclaimed dividends and tax
     */
    function configure(
        address payable _wallet
    ) public onlyFactory {
        _setWallet(_wallet);
    }

    /**
    * @notice Init function i.e generalise function to maintain the structure of the module contract
    * @return bytes4
    */
    function getInitFunction() public pure returns(bytes4) {
        return this.configure.selector;
    }

    /**
     * @notice Function used to change wallet address
     * @param _wallet Ethereum account address to receive reclaimed dividends and tax
     */
    function changeWallet(address payable _wallet) external {
        _onlySecurityTokenOwner();
        _setWallet(_wallet);
    }

    function _setWallet(address payable _wallet) internal {
        emit SetWallet(wallet, _wallet);
        wallet = _wallet;
    }

    /**
     * @notice Return the default excluded addresses
     * @return List of excluded addresses
     */
    function getDefaultExcluded() external view returns(address[] memory) {
        return excluded;
    }

    /**
     * @notice Returns the treasury wallet address
     */
    function getTreasuryWallet() public view returns(address payable) {
        if (wallet == address(0)) {
            address payable treasuryWallet = address(uint160(IDataStore(getDataStore()).getAddress(TREASURY)));
            require(address(treasuryWallet) != address(0), "Invalid address");
            return treasuryWallet;
        }
        else
            return wallet;
    }

    /**
     * @notice Creates a checkpoint on the security token
     * @return Checkpoint ID
     */
    function createCheckpoint() public withPerm(OPERATOR) returns(uint256) {
        return securityToken.createCheckpoint();
    }

    /**
     * @notice Function to clear and set list of excluded addresses used for future dividends
     * @param _excluded Addresses of investors
     */
    function setDefaultExcluded(address[] memory _excluded) public withPerm(ADMIN) {
        require(_excluded.length <= EXCLUDED_ADDRESS_LIMIT, "Too many excluded addresses");
        for (uint256 j = 0; j < _excluded.length; j++) {
            require(_excluded[j] != address(0), "Invalid address");
            for (uint256 i = j + 1; i < _excluded.length; i++) {
                require(_excluded[j] != _excluded[i], "Duplicate exclude address");
            }
        }
        excluded = _excluded;
        /*solium-disable-next-line security/no-block-members*/
        emit SetDefaultExcludedAddresses(excluded);
    }

    /**
     * @notice Function to set withholding tax rates for investors
     * @param _investors Addresses of investors
     * @param _withholding Withholding tax for individual investors (multiplied by 10**16)
     */
    function setWithholding(address[] memory _investors, uint256[] memory _withholding) public withPerm(ADMIN) {
        require(_investors.length == _withholding.length, "Mismatched input lengths");
        /*solium-disable-next-line security/no-block-members*/
        emit SetWithholding(_investors, _withholding);
        for (uint256 i = 0; i < _investors.length; i++) {
            require(_withholding[i] <= e18, "Incorrect withholding tax");
            withholdingTax[_investors[i]] = _withholding[i];
        }
    }

    /**
     * @notice Function to set withholding tax rates for investors
     * @param _investors Addresses of investor
     * @param _withholding Withholding tax for all investors (multiplied by 10**16)
     */
    function setWithholdingFixed(address[] memory _investors, uint256 _withholding) public withPerm(ADMIN) {
        require(_withholding <= e18, "Incorrect withholding tax");
        /*solium-disable-next-line security/no-block-members*/
        emit SetWithholdingFixed(_investors, _withholding);
        for (uint256 i = 0; i < _investors.length; i++) {
            withholdingTax[_investors[i]] = _withholding;
        }
    }

    /**
     * @notice Issuer can push dividends to provided addresses
     * @param _dividendIndex Dividend to push
     * @param _payees Addresses to which to push the dividend
     */
    function pushDividendPaymentToAddresses(
        uint256 _dividendIndex,
        address payable[] memory _payees
    )
        public
        withPerm(OPERATOR)
    {
        _validDividendIndex(_dividendIndex);
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
     * @param _end Index in investor list at which to stop pushing dividends
     */
    function pushDividendPayment(
        uint256 _dividendIndex,
        uint256 _start,
        uint256 _end
    )
        public
        withPerm(OPERATOR)
    {
        //NB If possible, please use pushDividendPaymentToAddresses as it is cheaper than this function
        _validDividendIndex(_dividendIndex);
        Dividend storage dividend = dividends[_dividendIndex];
        uint256 checkpointId = dividend.checkpointId;
        address[] memory investors = securityToken.getInvestorsSubsetAt(checkpointId, _start, _end);
        // The investors list maybe smaller than _end - _start becuase it only contains addresses that had a positive balance
        // the _start and _end used here are for the address list stored in the dataStore
        for (uint256 i = 0; i < investors.length; i++) {
            address payable payee = address(uint160(investors[i]));
            if ((!dividend.claimed[payee]) && (!dividend.dividendExcluded[payee])) {
                _payDividend(payee, dividend, _dividendIndex);
            }
        }
    }

    /**
     * @notice Investors can pull their own dividends
     * @param _dividendIndex Dividend to pull
     */
    function pullDividendPayment(uint256 _dividendIndex) public whenNotPaused {
        _validDividendIndex(_dividendIndex);
        Dividend storage dividend = dividends[_dividendIndex];
        require(!dividend.claimed[msg.sender], "Dividend already claimed");
        require(!dividend.dividendExcluded[msg.sender], "msg.sender excluded from Dividend");
        _payDividend(msg.sender, dividend, _dividendIndex);
    }

    /**
     * @notice Internal function for paying dividends
     * @param _payee Address of investor
     * @param _dividend Storage with previously issued dividends
     * @param _dividendIndex Dividend to pay
     */
    function _payDividend(address payable _payee, Dividend storage _dividend, uint256 _dividendIndex) internal;

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
        require(_dividendIndex < dividends.length, "Invalid dividend");
        Dividend storage dividend = dividends[_dividendIndex];
        if (dividend.claimed[_payee] || dividend.dividendExcluded[_payee]) {
            return (0, 0);
        }
        uint256 balance = securityToken.balanceOfAt(_payee, dividend.checkpointId);
        uint256 claim = balance.mul(dividend.amount).div(dividend.totalSupply);
        uint256 withheld = claim.mul(withholdingTax[_payee]).div(e18);
        return (claim, withheld);
    }

    /**
     * @notice Get the index according to the checkpoint id
     * @param _checkpointId Checkpoint id to query
     * @return uint256[]
     */
    function getDividendIndex(uint256 _checkpointId) public view returns(uint256[] memory) {
        uint256 counter = 0;
        for (uint256 i = 0; i < dividends.length; i++) {
            if (dividends[i].checkpointId == _checkpointId) {
                counter++;
            }
        }

        uint256[] memory index = new uint256[](counter);
        counter = 0;
        for (uint256 j = 0; j < dividends.length; j++) {
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
     * @notice Allows issuer to change maturity / expiry dates for dividends
     * @dev NB - setting the maturity of a currently matured dividend to a future date
     * @dev will effectively refreeze claims on that dividend until the new maturity date passes
     * @ dev NB - setting the expiry date to a past date will mean no more payments can be pulled
     * @dev or pushed out of a dividend
     * @param _dividendIndex Dividend to withdraw from
     * @param _maturity updated maturity date
     * @param _expiry updated expiry date
     */
    function updateDividendDates(uint256 _dividendIndex, uint256 _maturity, uint256 _expiry) external withPerm(ADMIN) {
        require(_dividendIndex < dividends.length, "Invalid dividend");
        require(_expiry > _maturity, "Expiry before maturity");
        Dividend storage dividend = dividends[_dividendIndex];
        require(dividend.expiry > now, "Dividend already expired");
        dividend.expiry = _expiry;
        dividend.maturity = _maturity;
        emit UpdateDividendDates(_dividendIndex, _maturity, _expiry);
    }

    /**
     * @notice Get static dividend data
     * @return uint256[] timestamp of dividends creation
     * @return uint256[] timestamp of dividends maturity
     * @return uint256[] timestamp of dividends expiry
     * @return uint256[] amount of dividends
     * @return uint256[] claimed amount of dividends
     * @return bytes32[] name of dividends
     */
    function getDividendsData() external view returns (
        uint256[] memory createds,
        uint256[] memory maturitys,
        uint256[] memory expirys,
        uint256[] memory amounts,
        uint256[] memory claimedAmounts,
        bytes32[] memory names)
    {
        createds = new uint256[](dividends.length);
        maturitys = new uint256[](dividends.length);
        expirys = new uint256[](dividends.length);
        amounts = new uint256[](dividends.length);
        claimedAmounts = new uint256[](dividends.length);
        names = new bytes32[](dividends.length);
        for (uint256 i = 0; i < dividends.length; i++) {
            (createds[i], maturitys[i], expirys[i], amounts[i], claimedAmounts[i], names[i]) = getDividendData(i);
        }
    }

    /**
     * @notice Get static dividend data
     * @return uint256 timestamp of dividend creation
     * @return uint256 timestamp of dividend maturity
     * @return uint256 timestamp of dividend expiry
     * @return uint256 amount of dividend
     * @return uint256 claimed amount of dividend
     * @return bytes32 name of dividend
     */
    function getDividendData(uint256 _dividendIndex) public view returns (
        uint256 created,
        uint256 maturity,
        uint256 expiry,
        uint256 amount,
        uint256 claimedAmount,
        bytes32 name)
    {
        created = dividends[_dividendIndex].created;
        maturity = dividends[_dividendIndex].maturity;
        expiry = dividends[_dividendIndex].expiry;
        amount = dividends[_dividendIndex].amount;
        claimedAmount = dividends[_dividendIndex].claimedAmount;
        name = dividends[_dividendIndex].name;
    }

    /**
     * @notice Retrieves list of investors, their claim status and whether they are excluded
     * @param _dividendIndex Dividend to withdraw from
     * @return address[] list of investors
     * @return bool[] whether investor has claimed
     * @return bool[] whether investor is excluded
     * @return uint256[] amount of withheld tax (estimate if not claimed)
     * @return uint256[] amount of claim (estimate if not claimeed)
     * @return uint256[] investor balance
     */
    function getDividendProgress(uint256 _dividendIndex) external view returns (
        address[] memory investors,
        bool[] memory resultClaimed,
        bool[] memory resultExcluded,
        uint256[] memory resultWithheld,
        uint256[] memory resultAmount,
        uint256[] memory resultBalance)
    {
        require(_dividendIndex < dividends.length, "Invalid dividend");
        //Get list of Investors
        Dividend storage dividend = dividends[_dividendIndex];
        uint256 checkpointId = dividend.checkpointId;
        investors = securityToken.getInvestorsAt(checkpointId);
        resultClaimed = new bool[](investors.length);
        resultExcluded = new bool[](investors.length);
        resultWithheld = new uint256[](investors.length);
        resultAmount = new uint256[](investors.length);
        resultBalance = new uint256[](investors.length);
        for (uint256 i; i < investors.length; i++) {
            resultClaimed[i] = dividend.claimed[investors[i]];
            resultExcluded[i] = dividend.dividendExcluded[investors[i]];
            resultBalance[i] = securityToken.balanceOfAt(investors[i], dividend.checkpointId);
            if (!resultExcluded[i]) {
                if (resultClaimed[i]) {
                    resultWithheld[i] = dividend.withheld[investors[i]];
                    resultAmount[i] = resultBalance[i].mul(dividend.amount).div(dividend.totalSupply).sub(resultWithheld[i]);
                } else {
                    (uint256 claim, uint256 withheld) = calculateDividend(_dividendIndex, investors[i]);
                    resultWithheld[i] = withheld;
                    resultAmount[i] = claim.sub(withheld);
                }
            }
        }
    }

    /**
     * @notice Retrieves list of investors, their balances, and their current withholding tax percentage
     * @param _checkpointId Checkpoint Id to query for
     * @return address[] list of investors
     * @return uint256[] investor balances
     * @return uint256[] investor withheld percentages
     */
    function getCheckpointData(uint256 _checkpointId) external view returns (address[] memory investors, uint256[] memory balances, uint256[] memory withholdings) {
        require(_checkpointId <= securityToken.currentCheckpointId(), "Invalid checkpoint");
        investors = securityToken.getInvestorsAt(_checkpointId);
        balances = new uint256[](investors.length);
        withholdings = new uint256[](investors.length);
        for (uint256 i; i < investors.length; i++) {
            balances[i] = securityToken.balanceOfAt(investors[i], _checkpointId);
            withholdings[i] = withholdingTax[investors[i]];
        }
    }

    /**
     * @notice Checks whether an address is excluded from claiming a dividend
     * @param _dividendIndex Dividend to withdraw from
     * @return bool whether the address is excluded
     */
    function isExcluded(address _investor, uint256 _dividendIndex) external view returns (bool) {
        require(_dividendIndex < dividends.length, "Invalid dividend");
        return dividends[_dividendIndex].dividendExcluded[_investor];
    }

    /**
     * @notice Checks whether an address has claimed a dividend
     * @param _dividendIndex Dividend to withdraw from
     * @return bool whether the address has claimed
     */
    function isClaimed(address _investor, uint256 _dividendIndex) external view returns (bool) {
        require(_dividendIndex < dividends.length, "Invalid dividend");
        return dividends[_dividendIndex].claimed[_investor];
    }

    /**
     * @notice Return the permissions flag that are associated with this module
     * @return bytes32 array
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](2);
        allPermissions[0] = ADMIN;
        allPermissions[1] = OPERATOR;
        return allPermissions;
    }

}
