pragma solidity ^0.4.24;
import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager for limiting volume of tokens in a single trade
 */

contract SingleTradeVolumeRestrictionManager is ITransferManager {
    using SafeMath for uint256;

    bool public isTransferLimitInPercentage;

    uint256 public globalTransferLimit;

    // should be multipled by 10^16. if the transfer percentage is 20%, then globalTransferLimitInPercentage should be 20*10^16
    uint256 public globalTransferLimitInPercentage;

    mapping(address=>bool) public exemptWallets;

    mapping(address => uint) public specialTransferLimits;

    event ExemptWalletAdded(address _wallet);
    event ExemptWalletRemoved(address _wallet);
    event TransferLimitInTokensSet(address _wallet, uint256 _amount);
    event TransferLimitInPercentageSet(address _wallet, uint _percentage);
    event TransferLimitRemoved(address _wallet);
    event GlobalTransferLimitInTokensSet(uint256 _amount, uint256 _oldAmount);
    event GlobalTransferLimitInPercentageSet(uint256 _percentage, uint256 _oldPercentage);
    event TransferLimitChangedToTokens();
    event TransferLimitChangedtoPercentage();
    bytes32 constant public ADMIN = "ADMIN";

   /**
    * @notice Constructor
    * @param _securityToken Address of the security token
    * @param _polyAddress Address of the polytoken
    */
    constructor(address _securityToken, address _polyAddress) public
    Module(_securityToken, _polyAddress)
    {

    }

    /// @notice Used to verify the transfer transaction according to the rule implemented in the transfer manager
    function verifyTransfer(address _from, address /* _to */, uint256 _amount, bool /* _isTransfer */) public returns(Result) {
        bool validTransfer;

        if(exemptWallets[_from] || paused) return Result.NA;

        if(specialTransferLimits[_from] > 0) {
            if (isTransferLimitInPercentage) {
                validTransfer = (_amount.mul(10**18).div(ISecurityToken(securityToken).totalSupply())) <= specialTransferLimits[_from];
            } else {
                validTransfer = _amount <= specialTransferLimits[_from];
            }
        } else {
            if (isTransferLimitInPercentage) {
                validTransfer = (_amount.mul(10**18).div(ISecurityToken(securityToken).totalSupply())) <= globalTransferLimitInPercentage;
            } else {
                validTransfer = _amount <= globalTransferLimit;
            }
        }
        if(validTransfer) return Result.NA;
        return Result.INVALID;
    }

    /**
    * @notice Used to intialize the variables of the contract
    * @param _isTransferLimitInPercentage true if the transfer limit is in percentage else false
    * @param _globalTransferLimitInPercentageOrToken transfer limit per single transaction.
    */
    function configure(bool _isTransferLimitInPercentage, uint256 _globalTransferLimitInPercentageOrToken) public onlyFactory {
        require(_globalTransferLimitInPercentageOrToken > 0, "global transfer limit has to greater than 0");
        isTransferLimitInPercentage = _isTransferLimitInPercentage;
        if (isTransferLimitInPercentage) {
            changeGlobalLimitInPercentage(_globalTransferLimitInPercentageOrToken);
        } else {
            changeGlobalLimitInTokens(_globalTransferLimitInPercentageOrToken);
        }
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
    * @notice Change the global transfer limit
    * @param _newGlobalTransferLimit new transfer limit in tokens
    * @dev This function can be used only when The manager is configured to use limits in tokens
    */
    function changeGlobalLimitInTokens(uint256 _newGlobalTransferLimit) public withPerm(ADMIN) {
        require(!isTransferLimitInPercentage, "Transfer limit not set in tokens");
        require(_newGlobalTransferLimit > 0, "Transfer limit has to greater than zero");
        emit GlobalTransferLimitInTokensSet(_newGlobalTransferLimit, globalTransferLimit);
        globalTransferLimit = _newGlobalTransferLimit;

    }

    /**
    * @notice Change the global transfer limit
    * @param _newGlobalTransferLimitInPercentage new transfer limit in percentage.
    * Multiply the percentage by 10^16. Eg 22% will be 22*10^16
    * @dev This function can be used only when The manager is configured to use limits in percentage
    */
    function changeGlobalLimitInPercentage(uint256 _newGlobalTransferLimitInPercentage) public withPerm(ADMIN) {
        require(isTransferLimitInPercentage, "Transfer limit not set in Percentage");
        require(_newGlobalTransferLimitInPercentage > 0 &&  _newGlobalTransferLimitInPercentage <= 100 * 10 ** 16);
        emit GlobalTransferLimitInPercentageSet(_newGlobalTransferLimitInPercentage, globalTransferLimitInPercentage);
        globalTransferLimitInPercentage = _newGlobalTransferLimitInPercentage;

    }

    /**
    * @notice add an exempt wallet
    * @param _wallet exempt wallet address
    */
    function addExemptWallet(address _wallet) public withPerm(ADMIN) {
        require(_wallet != address(0), "Wallet address cannot be a zero address");
        exemptWallets[_wallet] = true;
        emit ExemptWalletAdded(_wallet);
    }

    /**
    * @notice remove an exempt wallet
    * @param _wallet exempt wallet address
    */
    function removeExemptWallet(address _wallet) public withPerm(ADMIN) {
        require(_wallet != address(0), "Wallet address cannot be a zero address");
        exemptWallets[_wallet] = false;
        emit ExemptWalletRemoved(_wallet);
    }

    /**
    * @notice adds an array of exempt wallet
    * @param _wallets array of exempt wallet addresses
    */
    function addExemptWalletMulti(address[] _wallets) public withPerm(ADMIN) {
        require(_wallets.length > 0, "Wallets cannot be empty");
        for (uint256 i = 0; i < _wallets.length; i++) {
            addExemptWallet(_wallets[i]);
        }
    }

    /**
    * @notice removes an array of exempt wallet
    * @param _wallets array of exempt wallet addresses
    */
    function removeExemptWalletMulti(address[] _wallets) public withPerm(ADMIN) {
        require(_wallets.length > 0, "Wallets cannot be empty");
        for (uint256 i = 0; i < _wallets.length; i++) {
            removeExemptWallet(_wallets[i]);
        }
    }

    /**
    * @notice set transfer limit per wallet
    * @param _wallet wallet address
    * @param _transferLimit transfer limit for the wallet in tokens
    * @dev the manager has to be configured to use limits in tokens
    */
    function setTransferLimitForWallet(address _wallet, uint _transferLimit) public withPerm(ADMIN) {
        require(_transferLimit > 0, "Transfer limit has to be greater than 0");
        require(!isTransferLimitInPercentage, "Transfer limit not in token amount");
        specialTransferLimits[_wallet] = _transferLimit;
        emit TransferLimitInTokensSet(_wallet, _transferLimit);
    }

    /**
    * @notice set transfer limit for a wallet
    * @param _wallet wallet address
    * @param _transferLimitInPercentage transfer limit for the wallet in percentage.
    * Multiply the percentage by 10^16. Eg 22% will be 22*10^16
    * @dev The manager has to be configured to use percentages
    */
    function setTransferLimitInPercentage(address _wallet, uint _transferLimitInPercentage) public withPerm(ADMIN) {
        require(isTransferLimitInPercentage, "Transfer limit not in percentage");
        require(_transferLimitInPercentage > 0 && _transferLimitInPercentage <= 100 * 10 ** 16, "Transfer limit not in required range");
        specialTransferLimits[_wallet] = _transferLimitInPercentage;
        emit TransferLimitInPercentageSet(_wallet, _transferLimitInPercentage);
    }


    /**
    * @notice removes transfer limit for a wallet
    * @param _wallet wallet address
    */
    function removeTransferLimitForWallet(address _wallet) public withPerm(ADMIN) {
        require(specialTransferLimits[_wallet] > 0 , "Wallet Address does not have a transfer limit");
        specialTransferLimits[_wallet] = 0;
        emit TransferLimitRemoved(_wallet);
    }

    /**
    * @notice sets transfer limits for an array of wallet
    * @param _wallets array of wallet addresses
    * @param _transferLimits array of transfer limits for each wallet in tokens
    * @dev The manager has to be configured to use tokens as limit
    */
    function setTransferLimitForWalletMulti(address[] _wallets, uint[] _transferLimits) public withPerm(ADMIN) {
        require(_wallets.length  > 0, "Wallets cannot be empty");
        require(_wallets.length == _transferLimits.length);
        for (uint256 i=0; i < _wallets.length; i++ ) {
            setTransferLimitForWallet(_wallets[i], _transferLimits[i]);
        }
    }

    /**
    * @notice sets transfer limits for an array of wallet
    * @param _wallets array of wallet addresses
    * @param _transferLimitsInPercentage array of transfer limits for each wallet in percentages
    * The percentage has to be multipled by 10 ** 16. Eg: 20% would be 20 * 10 ** 16
    * @dev The manager has to be configured to use percentage as limit
    */
    function setTransferLimitInPercentageMulti(address[] _wallets, uint[] _transferLimitsInPercentage) public withPerm(ADMIN) {
        require(_wallets.length > 0, "Wallets cannot be empty");
        require(_wallets.length == _transferLimitsInPercentage.length);
        for (uint256 i=0; i < _wallets.length; i++) {
            setTransferLimitInPercentage(_wallets[i], _transferLimitsInPercentage[i]);
        }
    }

    /**
    * @notice removes transfer limits for an array of wallet
    * @param _wallets array of wallet addresses
    */
    function removeTransferLimitForWalletMulti(address[] _wallets) public withPerm(ADMIN) {
        require(_wallets.length > 0, "Wallets cannot be empty");
        for (uint i = 0; i < _wallets.length; i++) {
            removeTransferLimitForWallet(_wallets[i]);
        }
    }

    /**
    * @notice This function returns the signature of configure function
    */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(keccak256("configure(bool,uint256)"));
    }

    /**
    * @notice Return the permissions flag that are associated with SingleTradeVolumeRestrictionManager
    */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }
}
