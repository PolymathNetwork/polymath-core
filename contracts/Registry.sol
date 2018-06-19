pragma solidity ^0.4.24;

import "./Pausable.sol";
import "./ReclaimTokens.sol";
import "./interfaces/IRegistry.sol";

/**
 * @title Core functionality for registry upgradability
 */
contract Registry is IRegistry, Pausable, ReclaimTokens {

    /*
    Valid Address Keys
    tickerRegistry = getAddress("TickerRegistry")
    securityTokenRegistry = getAddress("SecurityTokenRegistry")
    moduleRegistry = getAddress("ModuleRegistry")
    polyToken = getAddress("PolyToken")
    */

    mapping (bytes32 => address) public storedAddresses;
    mapping (bytes32 => bool) public validAddressKeys;

    event LogChangeAddress(string _nameKey, address indexed _oldAddress, address indexed _newAddress);

    /**
     * @notice Get the contract address
     * @param _nameKey is the key for the contract address mapping
     * @return address
     */
    function getAddress(string _nameKey) view public returns(address) {
        require(validAddressKeys[keccak256(bytes(_nameKey))]);
        return storedAddresses[keccak256(bytes(_nameKey))];
    }

    /**
     * @notice change the contract address
     * @param _nameKey is the key for the contract address mapping
     * @param _newAddress is the new contract address
     */
    function changeAddress(string _nameKey, address _newAddress) public onlyOwner {
        address oldAddress;
        if (validAddressKeys[keccak256(bytes(_nameKey))]) {
            oldAddress = getAddress(_nameKey);
        } else {
            validAddressKeys[keccak256(bytes(_nameKey))] = true;
        }
        storedAddresses[keccak256(bytes(_nameKey))] = _newAddress;
        emit LogChangeAddress(_nameKey, oldAddress, _newAddress);
    }

    /**
     * @notice pause registration function
     */
    function unpause() public onlyOwner  {
        super._unpause();
    }

    /**
     * @notice unpause registration function
     */
    function pause() public onlyOwner {
        super._pause();
    }

}
