pragma solidity ^0.4.23;

contract IRegistry {

    /**
     * @dev get the contract address
     * @param _nameKey is the key for the contract address mapping
     */
    function getAddress(string _nameKey) public returns(address);

    /**
     * @dev change the contract address
     * @param _nameKey is the key for the contract address mapping
     * @param _newAddress is the new contract address
     */
    function changeAddress(string _nameKey, address _newAddress) public;

    /**
     * @dev pause (overridden function)
     */
    function unpause() public;

    /**
     * @dev unpause (overridden function)
     */
    function pause() public;

}
