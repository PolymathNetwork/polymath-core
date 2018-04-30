pragma solidity ^0.4.23;

import "./SecurityToken.sol";
import "../SecurityTokenRegistry.sol";
import "../interfaces/ISTProxy.sol";


contract STVersionProxy001 is ISTProxy {

    address public transferManagerFactory;

    //Shoud be set to false when we have more TransferManager options
    bool addTransferManager = true;

    constructor (address _transferManagerFactory) public {
        transferManagerFactory = _transferManagerFactory;
    }
    /**
    * @dev deploys the token and adds default modules like permission manager and transfer manager.
    * Future versions of the proxy can attach different modules or pass some other paramters.
    */
    function deployToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails, address _issuer)
    public returns (address) {
        address newSecurityTokenAddress = new SecurityToken(
        _name,
        _symbol,
        _decimals,
        uint256(10)**_decimals,
        _tokenDetails,
        msg.sender
        );

        if (addTransferManager) {
            SecurityToken(newSecurityTokenAddress).addModule(transferManagerFactory, "", 0, 0, false);
        }

        SecurityToken(newSecurityTokenAddress).transferOwnership(_issuer);

        return newSecurityTokenAddress;
    }
}
