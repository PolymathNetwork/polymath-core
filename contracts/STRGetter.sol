pragma solidity ^0.5.0;

import "./storage/EternalStorage.sol";
import "./libraries/Util.sol";
import "./libraries/Encoder.sol";
import "./interfaces/IOwnable.sol";
import "./libraries/VersionUtils.sol";

contract STRGetter is EternalStorage {

    bytes32 constant STLAUNCHFEE = 0xd677304bb45536bb7fdfa6b9e47a3c58fe413f9e8f01474b0a4b9c6e0275baf2;
    bytes32 constant TICKERREGFEE = 0x2fcc69711628630fb5a42566c68bd1092bc4aa26826736293969fddcd11cb2d2;
    bytes32 constant EXPIRYLIMIT = 0x604268e9a73dfd777dcecb8a614493dd65c638bad2f5e7d709d378bd2fb0baee;

    /**
     * @notice Returns the list of tickers owned by the selected address
     * @param _owner is the address which owns the list of tickers
     */
    function getTickersByOwner(address _owner) external view returns(bytes32[] memory) {
        uint counter = 0;
        // accessing the data structure userTotickers[_owner].length
        bytes32[] memory tickers = getArrayBytes32(Encoder.getKey("userToTickers", _owner));
        uint i;
        for (i = 0; i < tickers.length; i++) {
            string memory ticker = Util.bytes32ToString(tickers[i]);
            /*solium-disable-next-line security/no-block-members*/
            if (getUintValue(Encoder.getKey("registeredTickers_expiryDate", ticker)) >= now || getTickerStatus(ticker)) {
                counter ++;
            }
        }
        bytes32[] memory tempList = new bytes32[](counter);
        counter = 0;
        for (i = 0; i < tickers.length; i++) {
            string memory ticker = Util.bytes32ToString(tickers[i]);
            /*solium-disable-next-line security/no-block-members*/
            if (getUintValue(Encoder.getKey("registeredTickers_expiryDate", ticker)) >= now || getTickerStatus(ticker)) {
                tempList[counter] = tickers[i];
                counter ++;
            }
        }
        return tempList;
    }

    /**
     * @notice Returns the list of tokens owned by the selected address
     * @param _owner is the address which owns the list of tickers
     * @dev Intention is that this is called off-chain so block gas limit is not relevant
     */
    function getTokensByOwner(address _owner) external view returns(address[] memory) {
        return _getTokens(false, _owner);
    }

    /**
     * @notice Returns the list of all tokens
     * @dev Intention is that this is called off-chain so block gas limit is not relevant
     */
    function getTokens() external view returns(address[] memory) {
        return _getTokens(true, address(0));
    }
    /**
     * @notice Returns the list of tokens owned by the selected address
     * @param _allTokens if _allTokens is true returns all tokens despite on the second parameter
     * @param _owner is the address which owns the list of tickers
     */
    function _getTokens(bool _allTokens, address _owner) internal view returns(address[] memory) {
        // Loop over all active users, then all associated tickers of those users
        // This ensures we find tokens, even if their owner has been modified
        address[] memory activeUsers = getArrayAddress(Encoder.getKey("activeUsers"));
        bytes32[] memory tickers;
        address token;
        uint256 count = 0;
        uint256 i = 0;
        uint256 j = 0;
        for (i = 0; i < activeUsers.length; i++) {
            tickers = getArrayBytes32(Encoder.getKey("userToTickers", activeUsers[i]));
            for (j = 0; j < tickers.length; j++) {
                token = getAddressValue(Encoder.getKey("tickerToSecurityToken", Util.bytes32ToString(tickers[j])));
                if (token != address(0)) {
                    if (_allTokens || IOwnable(token).owner() == _owner) {
                        count = count + 1;
                    }
                }
            }
        }
        uint256 index = 0;
        address[] memory result = new address[](count);
        for (i = 0; i < activeUsers.length; i++) {
            tickers = getArrayBytes32(Encoder.getKey("userToTickers", activeUsers[i]));
            for (j = 0; j < tickers.length; j++) {
                token = getAddressValue(Encoder.getKey("tickerToSecurityToken", Util.bytes32ToString(tickers[j])));
                if (token != address(0)) {
                    if (_allTokens || IOwnable(token).owner() == _owner) {
                        result[index] = token;
                        index = index + 1;
                    }
                }
            }
        }
        return result;
    }

    /**
     * @notice Returns the owner and timestamp for a given ticker
     * @param _ticker is the ticker symbol
     * @return address
     * @return uint256
     * @return uint256
     * @return string
     * @return bool
     */
    function getTickerDetails(string calldata _ticker) external view returns (address, uint256, uint256, string memory, bool) {
        string memory ticker = Util.upper(_ticker);
        bool tickerStatus = getTickerStatus(ticker);
        uint256 expiryDate = getUintValue(Encoder.getKey("registeredTickers_expiryDate", ticker));
        /*solium-disable-next-line security/no-block-members*/
        if ((tickerStatus == true) || (expiryDate > now)) {
            return
            (
                getTickerOwner(ticker),
                getUintValue(Encoder.getKey("registeredTickers_registrationDate", ticker)),
                expiryDate,
                getStringValue(Encoder.getKey("registeredTickers_tokenName", ticker)),
                tickerStatus
            );
        } else {
            return (address(0), uint256(0), uint256(0), "", false);
        }
    }

    /**
     * @notice Returns the security token address by ticker symbol
     * @param _ticker is the ticker of the security token
     * @return address
     */
    function getSecurityTokenAddress(string calldata _ticker) external view returns (address) {
        string memory ticker = Util.upper(_ticker);
        return getAddressValue(Encoder.getKey("tickerToSecurityToken", ticker));
    }

    /**
    * @notice Returns the security token data by address
    * @param _securityToken is the address of the security token.
    * @return string is the ticker of the security Token.
    * @return address is the issuer of the security Token.
    * @return string is the details of the security token.
    * @return uint256 is the timestamp at which security Token was deployed.
    */
    function getSecurityTokenData(address _securityToken) external view returns (string memory, address, string memory, uint256) {
        return (
            getStringValue(Encoder.getKey("securityTokens_ticker", _securityToken)),
            IOwnable(_securityToken).owner(),
            getStringValue(Encoder.getKey("securityTokens_tokenDetails", _securityToken)),
            getUintValue(Encoder.getKey("securityTokens_deployedAt", _securityToken))
        );
    }

    /**
     * @notice Returns the current STFactory Address
     */
    function getSTFactoryAddress() public view returns(address) {
        return getAddressValue(Encoder.getKey("protocolVersionST", getUintValue(Encoder.getKey("latestVersion"))));
    }

    /**
     * @notice Gets Protocol version
     */
    function getProtocolVersion() public view returns(uint8[] memory) {
        return VersionUtils.unpack(uint24(getUintValue(Encoder.getKey("latestVersion"))));
    }

    /**
     * @notice Gets the security token launch fee
     * @return Fee amount
     */
    function getSecurityTokenLaunchFee() public view returns(uint256) {
        return getUintValue(STLAUNCHFEE);
    }

    /**
     * @notice Gets the ticker registration fee
     * @return Fee amount
     */
    function getTickerRegistrationFee() public view returns(uint256) {
        return getUintValue(TICKERREGFEE);
    }

    /**
     * @notice Gets the expiry limit
     * @return Expiry limit
     */
    function getExpiryLimit() public view returns(uint256) {
        return getUintValue(EXPIRYLIMIT);
    }

    /**
     * @notice Gets the status of the ticker
     * @param _ticker Ticker whose status need to determine
     * @return bool
     */
    function getTickerStatus(string memory _ticker) public view returns(bool) {
        return getBoolValue(Encoder.getKey("registeredTickers_status", _ticker));
    }

    /**
     * @notice Gets the owner of the ticker
     * @param _ticker Ticker whose owner need to determine
     * @return address Address of the owner
     */
    function getTickerOwner(string memory _ticker) public view returns(address) {
        return getAddressValue(Encoder.getKey("registeredTickers_owner", _ticker));
    }

}
