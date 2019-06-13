pragma solidity 0.5.8;

import "./ReclaimTokens.sol";
import "./interfaces/IPolymathRegistry.sol";

/**
 * @title Core functionality for registry upgradability
 */
contract PolymathRegistry is ReclaimTokens, IPolymathRegistry {
    mapping(bytes32 => address) public storedAddresses;

    /**
     * @notice Gets the contract address
     * @param _nameKey is the key for the contract address mapping
     * @return address
     */
    function getAddress(string calldata _nameKey) external view returns(address) {
        bytes32 key = keccak256(bytes(_nameKey));
        require(storedAddresses[key] != address(0), "Invalid key");
        return storedAddresses[key];
    }

    /**
     * @notice Changes the contract address
     * @param _nameKey is the key for the contract address mapping
     * @param _newAddress is the new contract address
     */
    function changeAddress(string calldata _nameKey, address _newAddress) external onlyOwner {
        bytes32 key = keccak256(bytes(_nameKey));
        emit ChangeAddress(_nameKey, storedAddresses[key], _newAddress);
        storedAddresses[key] = _newAddress;
    }

}
