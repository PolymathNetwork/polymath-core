pragma solidity ^0.4.18;

import './SecurityTokenV2.sol';
import '../SecurityTokenRegistrar.sol';
import '../interfaces/ISTProxy.sol';

contract STVersionProxy_002 is ISTProxy {

  address public transferManagerFactory;
  address public permissionManagerFactory;

  //Shoud be set to false when we have more TransferManager options
  bool addTransferManager = true;
  bool addPermissionManager = true;

  function STVersionProxy_002(address _transferManagerFactory, address _permissionManagerFactory) public {
    transferManagerFactory = _transferManagerFactory;
    permissionManagerFactory = _permissionManagerFactory;
  }

  function deployToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails, address _issuer)
  public returns (address){
    address newSecurityTokenAddress = new SecurityTokenV2(
      _name,
      _symbol,
      _decimals,
      _tokenDetails,
      msg.sender
    );

    if (addPermissionManager) {
      SecurityToken(newSecurityTokenAddress).addModule(permissionManagerFactory, "", 0, true);
    }
    if (addTransferManager) {
      SecurityToken(newSecurityTokenAddress).addModule(transferManagerFactory, "", 0, true);
    }

    SecurityToken(newSecurityTokenAddress).transferOwnership(_issuer);

    return newSecurityTokenAddress;
  }
}
