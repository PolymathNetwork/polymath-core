pragma solidity ^0.4.23;

import "./Pausable.sol";
import "./ReclaimTokens.sol";

contract Registry is Pausable, ReclaimTokens {

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
     * @dev get the contract address
     * @param _nameKey is the key for the contract address mapping
     */
    function getAddress(string _nameKey) public returns(address) {
        require(validAddressKeys[keccak256(_nameKey)]);
        return storedAddresses[keccak256(_nameKey)];
    }

    /**
     * @dev change the contract address
     * @param _nameKey is the key for the contract address mapping
     * @param _newAddress is the new contract address
     */
    function changeAddress(string _nameKey, address _newAddress) public onlyOwner {
        address oldAddress;
        if (validAddressKeys[keccak256(_nameKey)]) {
            oldAddress = getAddress(_nameKey);
        } else {
            validAddressKeys[keccak256(_nameKey)] = true;
        }
        storedAddresses[keccak256(_nameKey)] = _newAddress;
        emit LogChangeAddress(_nameKey, oldAddress, _newAddress);
    }

    /**
     * @dev pause (overridden function)
     */
    function unpause() public onlyOwner  {
        super._unpause();
    }

    /**
     * @dev unpause (overridden function)
     */
    function pause() public onlyOwner {
        super._pause();
    }

}
