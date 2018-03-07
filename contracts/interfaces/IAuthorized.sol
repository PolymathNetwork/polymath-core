pragma solidity ^0.4.18;

interface IAuthorized {

    /**
     * @dev checking the permission provided to the holder of the token
            also checks the regulation for the transfer of the token
        ------------------------- WIP ----------------------------
     * @param _securityToken Address of the security token contract
     * @param _to Ethereum address whom token would transfer
     * @param _from Ethereum address from token would transfer
     * @return bool
     */

    function validatePermission(address _securityToken, address _to, address _from) external returns(bool);

}