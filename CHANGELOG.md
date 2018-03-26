# Changelog
All notable changes to this project will be documented in this file.   

## [Unreleased](https://github.com/PolymathNetwork/polymath-core_v2/compare/npm-publish-2...master)

[__0.1.7__](https://www.npmjs.com/package/polymath-core_v2?activeTab=readme) __25-03-18__

## Added      
* ModuleRegistry contract will provide the list of modules by there types.  
* `SecurityTokenRegistry` is now work on the basis of the proxy version of the securitytoken contract. For that SecurityTokenRegistry has one more variable in the constructor called _STVersionProxy .   
* `setProtocolVersion` new function added in the SecurityTokenRegistry to set the protocol version followed to generate the securityToken. Only be called by the `polymath admin`.   
* `SecurityToken` now have the integaration with polyToken. At the time of `addModule()` SecurityToken approve the cost of the module to moduleFactory as the spender.   
* New function `withdrawPoly(uint256 _amount)` is added to withdrawl the unsed POLY from the securityToken contract. Called only by the owner of the contract.   
* `checkPermission(address _delegate, address _module, bytes32 _perm)` function is added to check the permissions on the service providers(delegate).
* `STVersionProxy_001.sol` & `STVersionProxy_002.sol` are the two new contract added. Both of those are the proxy contract use to generate the SecurityToken. Both contract construtor takes two variables address of `transferManagerFactory` address of the 
`permissionManagerFactory`.   
* New Module type is added called `PermissionManager`. It have three contracts called GeneralPermissionManagerFactory, GeneralPermissionManager, IPermissionManager. 
* `GeneralPermissionManger` is all about providing the permission to the delegate corresponds to the SecurityToken. Major functionality are add, check , change the permission of the delegate.   
* Two more functions added for each factory type i.e `getDescription()` & `getTitle()`.  
* `CappedSTO` is now Configurable by chossing the type of fundraise. Either POLY or ETH.
* `CappedSTO` takes 3 more constructor arguments fundRaiseType (uint8), address of the polyToken & address of the funds receiver.    
* `buyTokensWithPoly(address _beneficiary, uint256 _investedPoly)` new function added in cappedSTO to facilitate the funds raising with the POLY.   
* `verifyInvestment(address _beneficiary, uint256 _fundsAmount)` new function added in ISTO to check whether the investor provide the allowance to the CappedSTO or not.    
* `LogModifyWhitelist` event of GeneralTransferManager emit two more variables. i.e address which added the investor in whitelist(`_addedBy`) and record the timestamp at which modification in whitelist happen(`_dateAdded`).   
* `permissions()` function added in GeneralTransferManager to get all permissions.  
* `PolyToken.sol` contract is added at contracts/helpers/PolyToken.sol. For now it have no big use.

## Changed 
* ModuleRegistry only holds the module type of modules only not there names or cost anymore.   
* No More ModuleReputation struct for counting the reputation of module. Now `reputation` mapping only contains the list of the addresses those used that module factory.    
* `checkModule()` of ModuleRegistry contract rename to `useModule()` with same function parameters.   
* Event `LogModuleAdded` emit only 5 variables instead of 6. timestamp is no longer be a part of the event.  
* `SecurityTokenRegistrar` now renamed as `SecurityTokenRegistry`.   
* Deployment of the securityToken is now performed by the proxy contracts and call being generated form the SecurityTokenRegistry.
* `TickerRegistrar` renamed as `TickerRegistry`.   
* TickerRegistry is now Ownable contract.
* `setTokenRegistrar` functio of TickerRegistry renamed to `setTokenRegistry`.   
* SecurityToken constructor has one change in the variable. i.e `_moduleRegistry` contract address is replaced by the `_owner` address.   
* Their is no `_perm` parameter in the `addModule()` function of the securityToken contract. Now only 4 parameters left.
* Type of Mudules changed    
      - Permission has a type 1        
      - TransferManager has a type 2    
      - STO has a type 3  
* Location of SecurityToken changed to `contracts/token/SecurityToken.sol`
* GeneralTransferManager takes only 1 variables as constructor argument i.e address of the securityToken.  
* Functions of GeneralTransferManager earlier controlled by the owner only, now those can be controlled by the delegates as well with haiving proper permissions.   

## Removed
* `getCost()` is removed from the ModuleRegistry contract.
* `SafeMath.sol` contract is replaced by the zeppelin-solidity library contract .  
*  No more `SecurityTokens` and `symbol` information will be directly part of the SecurityTokenRegistry. Those information will accessed by inheriting the `ISecurityTokenRegistry`.   
* Remove the Delegable.sol, AclHelpers.sol, DelegablePorting.sol contracts. Now permission manager factory takes their place . * `delegates` mapping removed from the GeneralTransferManager.  