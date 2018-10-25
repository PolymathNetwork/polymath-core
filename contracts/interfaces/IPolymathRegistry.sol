pragma solidity ^0.4.24;

    
interface IPolymathRegistry {

    /**
     * @notice Returns the contract address
     * @param _nameKey is the key for the contract address mapping
     * @return address
     */
    function getAddress(string _nameKey) view external returns(address); 

}
    