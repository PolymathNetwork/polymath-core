pragma solidity ^0.4.23;

import "./SecurityTokenV2.sol";
import "../SecurityTokenRegistry.sol";
import "../interfaces/ISTProxy.sol";


contract STVersionProxy002 is ISTProxy {

    address public transferManagerFactory;

    //Shoud be set to false when we have more TransferManager options
    bool addTransferManager = true;

    constructor (address _transferManagerFactory) public {
        transferManagerFactory = _transferManagerFactory;
    }

    function deployToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails, address _issuer)
    public returns (address)
    {
        address newSecurityTokenAddress = new SecurityTokenV2(
        _name,
        _symbol,
        _decimals,
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
