pragma solidity ^0.5.0;

/**
 * @title Interface for security token proxy deployment
 */
interface ISTFactory {
    /**
     * @notice Deploys the token and adds default modules like permission manager and transfer manager.
     * Future versions of the proxy can attach different modules or pass some other paramters.
     * @param _name is the name of the Security token
     * @param _symbol is the symbol of the Security Token
     * @param _decimals is the number of decimals of the Security Token
     * @param _tokenDetails is the off-chain data associated with the Security Token
     * @param _issuer is the owner of the Security Token
     * @param _divisible whether the token is divisible or not
     * @param _polymathRegistry is the address of the Polymath Registry contract
     */
    function deployToken(
        string calldata _name,
        string calldata _symbol,
        uint8 _decimals,
        string calldata _tokenDetails,
        address _issuer,
        bool _divisible,
        address _polymathRegistry
    ) 
    external 
    returns(address);
}
