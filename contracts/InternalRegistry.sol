pragma solidity ^0.4.24;

import "./storage/EternalStorage.sol";
import "./libraries/Util.sol";
import "./libraries/Encoder.sol";

contract InternalRegistry is EternalStorage {

    // Emit after ticker registration
    event RegisterTicker(
        address indexed _owner,
        string _ticker,
        string _name,
        uint256 indexed _registrationDate,
        uint256 indexed _expiryDate,
        bool _fromAdmin,
        uint256 _registrationFee
    );

    /**
     * @notice Internal - Sets the details of the ticker
     */
    function addTicker(
        address _owner, 
        string _ticker, 
        string _tokenName, 
        uint256 _registrationDate, 
        uint256 _expiryDate, 
        bool _status, 
        bool _fromAdmin, 
        uint256 _fee
    ) 
        public 
    {
        _setTickerOwnership(_owner, _ticker);
        _storeTickerDetails(_ticker, _owner, _registrationDate, _expiryDate, _tokenName, _status);
        emit RegisterTicker(_owner, _ticker, _tokenName, _registrationDate, _expiryDate, _fromAdmin, _fee);
    }

    /**
     * @notice Internal - Sets the ticker owner
     * @param _owner is the address of the owner of the ticker
     * @param _ticker is the ticker symbol
     */
    function _setTickerOwnership(address _owner, string _ticker) internal {
        bytes32 _ownerKey = Encoder.getKey("userToTickers", _owner);
        uint256 length = uint256(getArrayBytes32(_ownerKey).length);
        pushArray(_ownerKey, Util.stringToBytes32(_ticker));
        set(Encoder.getKey("tickerIndex", _ticker), length);
        bytes32 seenKey = Encoder.getKey("seenUsers", _owner);
        if (!getBool(seenKey)) {
            pushArray(Encoder.getKey("activeUsers"), _owner);
            set(seenKey, true);
        }
    }

    /**
     * @notice Internal - Stores the ticker details
     */
    function _storeTickerDetails(
        string _ticker,
        address _owner,
        uint256 _registrationDate,
        uint256 _expiryDate,
        string _tokenName,
        bool _status
        ) internal {
        bytes32 key = Encoder.getKey("registeredTickers_owner", _ticker);
        if (getAddress(key) != _owner)
            set(key, _owner);
        key = Encoder.getKey("registeredTickers_registrationDate", _ticker);
        if (getUint(key) != _registrationDate)
            set(key, _registrationDate);
        key = Encoder.getKey("registeredTickers_expiryDate", _ticker);
        if (getUint(key) != _expiryDate)
            set(key, _expiryDate);
        key = Encoder.getKey("registeredTickers_tokenName", _ticker);
        if (Encoder.getKey(getString(key)) != Encoder.getKey(_tokenName))
            set(key, _tokenName);
        key = Encoder.getKey("registeredTickers_status", _ticker);
        if (getBool(key) != _status)
            set(key, _status);
    }


}