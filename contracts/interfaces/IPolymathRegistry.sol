pragma solidity 0.5.8;

interface IPolymathRegistry {

    event ChangeAddress(string _nameKey, address indexed _oldAddress, address indexed _newAddress);
    
    /**
     * @notice Returns the contract address
     * @param _nameKey is the key for the contract address mapping
     * @return address
     */
    function getAddress(string calldata _nameKey) external view returns(address registryAddress);

    /**
     * @notice Changes the contract address
     * @param _nameKey is the key for the contract address mapping
     * @param _newAddress is the new contract address
     */
    function changeAddress(string calldata _nameKey, address _newAddress) external;

}
