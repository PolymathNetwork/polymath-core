pragma solidity ^0.5.0;

import "./../../TransferManager/TransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager for limiting volume of tokens in a single trade
 */

contract SingleTradeVolumeRestrictionTM is TransferManager {
    using SafeMath for uint256;

    bytes32 public constant ADMIN = "ADMIN";

    bool public isTransferLimitInPercentage;

    uint256 public globalTransferLimitInTokens;

    // should be multipled by 10^16. if the transfer percentage is 20%, then globalTransferLimitInPercentage should be 20*10^16
    uint256 public globalTransferLimitInPercentage;

    // Ignore transactions which are part of the primary issuance
    bool public allowPrimaryIssuance = true;

    //mapping to store the wallets that are exempted from the volume restriction
    mapping(address => bool) public exemptWallets;

    //addresses on this list have special transfer restrictions apart from global
    mapping(address => uint) public specialTransferLimitsInTokens;

    mapping(address => uint) public specialTransferLimitsInPercentages;

    event ExemptWalletAdded(address _wallet);
    event ExemptWalletRemoved(address _wallet);
    event TransferLimitInTokensSet(address _wallet, uint256 _amount);
    event TransferLimitInPercentageSet(address _wallet, uint _percentage);
    event TransferLimitInPercentageRemoved(address _wallet);
    event TransferLimitInTokensRemoved(address _wallet);
    event GlobalTransferLimitInTokensSet(uint256 _amount, uint256 _oldAmount);
    event GlobalTransferLimitInPercentageSet(uint256 _percentage, uint256 _oldPercentage);
    event TransferLimitChangedToTokens();
    event TransferLimitChangedtoPercentage();
    event SetAllowPrimaryIssuance(bool _allowPrimaryIssuance, uint256 _timestamp);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
    */
    constructor(address _securityToken, address _polyToken) public Module(_securityToken, _polyToken) {

    }

    /** @notice Used to verify the transfer transaction and prevent an account from sending more tokens than allowed in a single transfer
     * @param _from Address of the sender
     * @param _amount The amount of tokens to transfer
     */
    function verifyTransfer(
        address _from,
        address /* _to */,
        uint256 _amount,
        bytes calldata /* _data */,
        bool /* _isTransfer */
    ) 
        external 
        returns(Result) 
    {
        bool validTransfer;

        if (exemptWallets[_from] || paused) return Result.NA;

        if (_from == address(0) && allowPrimaryIssuance) {
            return Result.NA;
        }

        if (isTransferLimitInPercentage) {
            if (specialTransferLimitsInPercentages[_from] > 0) {
                validTransfer = (_amount.mul(10 ** 18).div(
                    ISecurityToken(securityToken).totalSupply()
                )) <= specialTransferLimitsInPercentages[_from];
            } else {
                validTransfer = (_amount.mul(10 ** 18).div(ISecurityToken(securityToken).totalSupply())) <= globalTransferLimitInPercentage;
            }
        } else {
            if (specialTransferLimitsInTokens[_from] > 0) {
                validTransfer = _amount <= specialTransferLimitsInTokens[_from];
            } else {
                validTransfer = _amount <= globalTransferLimitInTokens;
            }
        }
        if (validTransfer) return Result.NA;
        return Result.INVALID;
    }

    /**
    * @notice Used to intialize the variables of the contract
    * @param _isTransferLimitInPercentage true if the transfer limit is in percentage else false
    * @param _globalTransferLimitInPercentageOrToken transfer limit per single transaction.
    */
    function configure(
        bool _isTransferLimitInPercentage,
        uint256 _globalTransferLimitInPercentageOrToken,
        bool _allowPrimaryIssuance
    ) 
        public 
        onlyFactory 
    {
        isTransferLimitInPercentage = _isTransferLimitInPercentage;
        if (isTransferLimitInPercentage) {
            changeGlobalLimitInPercentage(_globalTransferLimitInPercentageOrToken);
        } else {
            changeGlobalLimitInTokens(_globalTransferLimitInPercentageOrToken);
        }
        allowPrimaryIssuance = _allowPrimaryIssuance;
    }

    /**
    * @notice Sets whether or not to consider primary issuance transfers
    * @param _allowPrimaryIssuance whether to allow all primary issuance transfers
    */
    function setAllowPrimaryIssuance(bool _allowPrimaryIssuance) public withPerm(ADMIN) {
        require(_allowPrimaryIssuance != allowPrimaryIssuance, "Must change setting");
        allowPrimaryIssuance = _allowPrimaryIssuance;
        /*solium-disable-next-line security/no-block-members*/
        emit SetAllowPrimaryIssuance(_allowPrimaryIssuance, now);
    }

    /**
    * @notice Changes the manager to use transfer limit as Percentages
    * @param _newGlobalTransferLimitInPercentage uint256 new global Transfer Limit In Percentage.
    * @dev specialTransferLimits set for wallets have to re-configured
    */
    function changeTransferLimitToPercentage(uint256 _newGlobalTransferLimitInPercentage) public withPerm(ADMIN) {
        require(!isTransferLimitInPercentage, "Transfer limit already in percentage");
        isTransferLimitInPercentage = true;
        changeGlobalLimitInPercentage(_newGlobalTransferLimitInPercentage);
        emit TransferLimitChangedtoPercentage();
    }

    /**
    * @notice Changes the manager to use transfer limit as tokens
    * @param _newGlobalTransferLimit uint256 new global Transfer Limit in tokens.
    * @dev specialTransferLimits set for wallets have to re-configured
    */
    function changeTransferLimitToTokens(uint _newGlobalTransferLimit) public withPerm(ADMIN) {
        require(isTransferLimitInPercentage, "Transfer limit already in tokens");
        isTransferLimitInPercentage = false;
        changeGlobalLimitInTokens(_newGlobalTransferLimit);
        emit TransferLimitChangedToTokens();
    }
    /**
    * @notice Changes the global transfer limit
    * @param _newGlobalTransferLimitInTokens new transfer limit in tokens
    * @dev This function can be used only when The manager is configured to use limits in tokens
    */
    function changeGlobalLimitInTokens(uint256 _newGlobalTransferLimitInTokens) public withPerm(ADMIN) {
        require(!isTransferLimitInPercentage, "Transfer limit not set in tokens");
        require(_newGlobalTransferLimitInTokens > 0, "Transfer limit has to greater than zero");
        emit GlobalTransferLimitInTokensSet(_newGlobalTransferLimitInTokens, globalTransferLimitInTokens);
        globalTransferLimitInTokens = _newGlobalTransferLimitInTokens;

    }

    /**
    * @notice Changes the global transfer limit
    * @param _newGlobalTransferLimitInPercentage new transfer limit in percentage.
    * Multiply the percentage by 10^16. Eg 22% will be 22*10^16
    * @dev This function can be used only when The manager is configured to use limits in percentage
    */
    function changeGlobalLimitInPercentage(uint256 _newGlobalTransferLimitInPercentage) public withPerm(ADMIN) {
        require(isTransferLimitInPercentage, "Transfer limit not set in Percentage");
        require(
            _newGlobalTransferLimitInPercentage > 0 && _newGlobalTransferLimitInPercentage <= 100 * 10 ** 16,
            "Limit not within [0,100]"
        );
        emit GlobalTransferLimitInPercentageSet(_newGlobalTransferLimitInPercentage, globalTransferLimitInPercentage);
        globalTransferLimitInPercentage = _newGlobalTransferLimitInPercentage;

    }

    /**
    * @notice Adds an exempt wallet
    * @param _wallet exempt wallet address
    */
    function addExemptWallet(address _wallet) public withPerm(ADMIN) {
        require(_wallet != address(0), "Wallet address cannot be a zero address");
        exemptWallets[_wallet] = true;
        emit ExemptWalletAdded(_wallet);
    }

    /**
    * @notice Removes an exempt wallet
    * @param _wallet exempt wallet address
    */
    function removeExemptWallet(address _wallet) public withPerm(ADMIN) {
        require(_wallet != address(0), "Wallet address cannot be a zero address");
        exemptWallets[_wallet] = false;
        emit ExemptWalletRemoved(_wallet);
    }

    /**
    * @notice Adds an array of exempt wallet
    * @param _wallets array of exempt wallet addresses
    */
    function addExemptWalletMulti(address[] memory _wallets) public withPerm(ADMIN) {
        require(_wallets.length > 0, "Wallets cannot be empty");
        for (uint256 i = 0; i < _wallets.length; i++) {
            addExemptWallet(_wallets[i]);
        }
    }

    /**
    * @notice Removes an array of exempt wallet
    * @param _wallets array of exempt wallet addresses
    */
    function removeExemptWalletMulti(address[] memory _wallets) public withPerm(ADMIN) {
        require(_wallets.length > 0, "Wallets cannot be empty");
        for (uint256 i = 0; i < _wallets.length; i++) {
            removeExemptWallet(_wallets[i]);
        }
    }

    /**
    * @notice Sets transfer limit per wallet
    * @param _wallet wallet address
    * @param _transferLimit transfer limit for the wallet in tokens
    * @dev the manager has to be configured to use limits in tokens
    */
    function setTransferLimitInTokens(address _wallet, uint _transferLimit) public withPerm(ADMIN) {
        require(_transferLimit > 0, "Transfer limit has to be greater than 0");
        require(!isTransferLimitInPercentage, "Transfer limit not in token amount");
        specialTransferLimitsInTokens[_wallet] = _transferLimit;
        emit TransferLimitInTokensSet(_wallet, _transferLimit);
    }

    /**
    * @notice Sets transfer limit for a wallet
    * @param _wallet wallet address
    * @param _transferLimitInPercentage transfer limit for the wallet in percentage.
    * Multiply the percentage by 10^16. Eg 22% will be 22*10^16
    * @dev The manager has to be configured to use percentages
    */
    function setTransferLimitInPercentage(address _wallet, uint _transferLimitInPercentage) public withPerm(ADMIN) {
        require(isTransferLimitInPercentage, "Transfer limit not in percentage");
        require(_transferLimitInPercentage > 0 && _transferLimitInPercentage <= 100 * 10 ** 16, "Transfer limit not in required range");
        specialTransferLimitsInPercentages[_wallet] = _transferLimitInPercentage;
        emit TransferLimitInPercentageSet(_wallet, _transferLimitInPercentage);
    }

    /**
    * @notice Removes transfer limit set in percentage for a wallet
    * @param _wallet wallet address
    */
    function removeTransferLimitInPercentage(address _wallet) public withPerm(ADMIN) {
        require(specialTransferLimitsInPercentages[_wallet] > 0, "Wallet Address does not have a transfer limit");
        specialTransferLimitsInPercentages[_wallet] = 0;
        emit TransferLimitInPercentageRemoved(_wallet);
    }

    /**
    * @notice Removes transfer limit set in tokens for a wallet
    * @param _wallet wallet address
    */
    function removeTransferLimitInTokens(address _wallet) public withPerm(ADMIN) {
        require(specialTransferLimitsInTokens[_wallet] > 0, "Wallet Address does not have a transfer limit");
        specialTransferLimitsInTokens[_wallet] = 0;
        emit TransferLimitInTokensRemoved(_wallet);
    }

    /**
    * @notice Sets transfer limits for an array of wallet
    * @param _wallets array of wallet addresses
    * @param _transferLimits array of transfer limits for each wallet in tokens
    * @dev The manager has to be configured to use tokens as limit
    */
    function setTransferLimitInTokensMulti(address[] memory _wallets, uint[] memory _transferLimits) public withPerm(ADMIN) {
        require(_wallets.length > 0, "Wallets cannot be empty");
        require(_wallets.length == _transferLimits.length, "Wallets don't match to transfer limits");
        for (uint256 i = 0; i < _wallets.length; i++) {
            setTransferLimitInTokens(_wallets[i], _transferLimits[i]);
        }
    }

    /**
    * @notice Sets transfer limits for an array of wallet
    * @param _wallets array of wallet addresses
    * @param _transferLimitsInPercentage array of transfer limits for each wallet in percentages
    * The percentage has to be multipled by 10 ** 16. Eg: 20% would be 20 * 10 ** 16
    * @dev The manager has to be configured to use percentage as limit
    */
    function setTransferLimitInPercentageMulti(
        address[] memory _wallets,
        uint[] memory _transferLimitsInPercentage
    ) public withPerm(ADMIN) {
        require(_wallets.length > 0, "Wallets cannot be empty");
        require(_wallets.length == _transferLimitsInPercentage.length, "Wallets don't match to percentage limits");
        for (uint256 i = 0; i < _wallets.length; i++) {
            setTransferLimitInPercentage(_wallets[i], _transferLimitsInPercentage[i]);
        }
    }

    /**
    * @notice Removes transfer limits set in tokens for an array of wallet
    * @param _wallets array of wallet addresses
    */
    function removeTransferLimitInTokensMulti(address[] memory _wallets) public withPerm(ADMIN) {
        require(_wallets.length > 0, "Wallets cannot be empty");
        for (uint i = 0; i < _wallets.length; i++) {
            removeTransferLimitInTokens(_wallets[i]);
        }
    }

    /**
    * @notice Removes transfer limits set in percentage for an array of wallet
    * @param _wallets array of wallet addresses
    */
    function removeTransferLimitInPercentageMulti(address[] memory _wallets) public withPerm(ADMIN) {
        require(_wallets.length > 0, "Wallets cannot be empty");
        for (uint i = 0; i < _wallets.length; i++) {
            removeTransferLimitInPercentage(_wallets[i]);
        }
    }

    /**
    * @notice This function returns the signature of configure function
    */
    function getInitFunction() public pure returns(bytes4) {
        return bytes4(keccak256("configure(bool,uint256,bool)"));
    }

    /**
    * @notice Returns the permissions flag that are associated with SingleTradeVolumeRestrictionManager
    */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }
}
