# Changelog
All notable changes to this project will be documented in this file.

# v1.4.1

## Fixed

* Fix #239: fix basic fee logic for ongoing module fees
* Fix #238: make beneficial investments optionally supported (default to not
allowed)

# v1.4.0 - Release candidate

[__1.4.0__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __13-08-18__

## Added

* USDTieredSTO module added as a new STO type. Allows to raise with multiple tiers while pegging price to USD. The USDTieredSTO contract gets the USD to POLY/ETH rate from the STR which contains references to pricing oracles.
* Added PolyOracle to get POLY/USD price for the USDTieredSTO.
* Added MakerDAOOracle to get ETH/USD price for the USDTieredSTO.
* Added CLI for USDTieredSTO.
* Scripts for monitoring Oracles' status.
* Scripts for monitoring Polymath stats (Tokens registered, tokens deployed, STOs launched).
* Test cases for 1.4.1 migration
* STR Migration script
* Encrypted API Key for CMC queries in PolyOracle

## Changed

* Modified CappedSTOFactory to comply with minor interface changes in iSTO. It now uses a mapping named `fundRaiseType` to specify the fundraise type (ETH / POLY)
* Remove endData update from unpause function
* Allow custom tokens to be added when STR is paused
* PolyOracle does not revert on out of order callbacks (silently ignores instead)
* Removed USDTieredSTO > STR dependency by moving oracle registry to PolymathRegistry

## Fixed

* Modified function name in TickerRegistry and SecurityTokenRegistry from `changePolyRegisterationFee` to `changePolyRegistrationFee`. Event name is modified too from `LogChangePolyRegisterationFee` to `LogChangePolyRegistrationFee`
* Minor CLI fixes
* Rounding edge cases in USDTieredSTO.sol that could have reverted valid transactions
* Bug in ManualApprovalTransferManager that allowed anyone to reduce anyone's transfer allowance 

=======
# v1.3.0  

[__1.3.0__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __25-07-18__

## Added
* Implemented `finishedIssuerMinting / finishedSTOMinting`. The former permanently forbids the issuer from minting tokens. The latter permanently forbids STO modules from minting tokens.     
* Added registry of registries. Contracts should point to the registry which acts as a proxy and delegates to the corresponding registry contract.
* Added ModifyWhitelistMulti to Percentage Transfer Manager.    
* Add the `Transfer` event in the getTokens function call of `PolyTokenFaucet.sol`.     
* Introduce the `_valid` flag in the event of `LogModifyWhitelist` in `PercentageTransferManager.sol`

## Changed
* Removed _locked parameter from modules. This was only used on STOs to allow the issuer to indicate they would not be minting more tokens after the STO (since it wouldn't be possible to remove it), but now we have the finishedSTOMinting flag that they can use to indicate so in a more transparent way.

# v1.2.1

[__1.2.1__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __27-06-18__

## Added
* Further minting can be forbids on the Issuer level and the STO level using the functions `finishMintingIssuer()`,`finishMintingSTO()`.
* `modifyWhitelistMulti` added in `PercentageTransferManager` contract.    

##Changed
* Added extra parameter to TransferManager.verifyTransfer to indicate whether the call is part of a transfer or not.  

## Removed
* Logic of module locking is removed and also removes the `_locked` parameter.    
* Remove `finishMinting()` function from the `SecurityToken` contract.


# v1.2.0

[__1.2.0__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __22-05-18__

## Added

* ERC20DividendCheckpoint module added for on-chain dividend ERC20 payments
* EtherDividendCheckpoint module added for on-chain dividend ETH payments
* Iterable list of investors available on-chain
* STOs are pausable now. It is facilated by using the Pausable contract.
* ManualApprovalTransferManager - allows approval or blocking of explicit address pairs for transfers.
* Module Factories now allow their owner to set 3 types of fees: Setup fee, Usage fee, Monthly fee.
* Added Checkpoint feature to token. This allows the issuer to create snapshots of the token's balances and totalSupply to be used for casting votes or distributing dividends. Created CLI to demo this feature.
* Further minting is forbidden by adding one additional check for `mintingFinished` flag. Issuer can stop minting by calling the `finishMinting()` function.
* Issuer can prevent addresses from participating in the STO. To facilitate this, `_canBuyFromSTO` has been added to modifyWhitelist function.
* Added multi-mint feature.
* Event `LogGenerateModuleFromFactory` emitted at the level of ModuleFactory to log the creation of the module using the respective module factory.
* Added registration fee of `250 POLY` for registering ticker or security token with registry contracts, fee can be changed using `changePolyRegistrationFee`.
* Added ReclaimTokens contract to handle retrieving ERC20 Tokens sent to our contracts.
* Added Pausable feature to registry functions `registerTicker`, `generateSecurityToken`, `registerModule`, `addCustomSecurityToken`.
* Added Registry contract to handle upgradability functionality with a function to change the reference address between registry contracts.
* POLY faucet CLI is added in demo.  
* `getDividendIndex()` is introduced in `ERC20DividendCheckpoint` & `EtherDividendCheckpoint` contract.

## Changed

* Added extra parameter to TransferManager.verifyTransfer to indicate whether the call is part of a transfer or not.  
* Added a new return type to verifyTransfer methods called FORCE_VALID which would override any INVALID returned by TransferManagers if needed. For example, this could be used if we wanted the Manual Approval TM to force a transfer to happen even if the CountTM said that the 2000 investor cap had been reached.
* Burning tokens now respects TransferManagers and investorCount.  
* Updated CLI with MultiMint process.  
* Change the `setupCost` of `cappedSTOFactory` from `0 POLY` to `20K POLY`.      
* Add one more parameter called the `_owner` in the `addCustomSecurityToken()`.
* Change `_addModule` in SecurityToken.sol to get MR address from STR contract.
* Update CLI with POLY payments.  

## Removed

* `ExchangeTransferManagerFactory` and `ExchangeTransferManager` is removed from repository.

# v1.1.0

[__1.1.0__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __18-05-18__

## Changed    

* Factored out the second reference to the POLY token from ISTO contracts
* Defaulted all STs to have 18 decimals
* Removed decimals parameter from `generateSecurityToken`
* Modified TokenBurner to be an interface
* Moved CappedSTO specific functions to CappedSTO from ISTO
* Moved TokenBurner & PolyToken contracts to test directory (out of main contract directory)
* Modified IST20 interface to inherit from ERC20 interfaces
* Modified verifyTransfer function in TransferManagers to return a Result enumeration instead of boolean
* Fixed `capReached()` which was checking fundsRaised agains cap, but the cap is expressed in tokens.    
* Constant key variables migrated from the securityToken to ISecurityToken contract.
* Solidity compiler version get changed to 0.4.23 that leads to the addition of reason string in the `require` and `revert` statements.
* zeppelin-solidity package version and name get changed to openzeppelin-solidity v1.9.0.      

## Added   

* whitelists for CountTransferManager and PercentageTransferManager to bypass logic
* added CountTransferManager to restrict the total number of token holders
* added PercentageTransferManager to restrict the total percentage of tokens held by any single holder
* generateSecurityToken in SecurityTokenRegistry takes an additional parameter specifying whether the token is divisible.
* IModule contract takes the polyToken contract address as the constructor argument to wrapping all the factories with the polyToken contract address.      
* `takeFee()` new function introduced to extract the POLY token from the factory. It only be called by the owner of the factory.      
* Added ability for issuer to provide a signed piece of data to allow investors to whitelist themselves.
* `_securityTokenAddress` get indexed in the `LogNewSecurityToken` event.     
* Now each investor have its `expiryTime` for the KYC. After the expiryTime limit reached, investor will not abe to use transfer related functions.
* Transfers of tokens gets paused at the level of all TM as well as on the ST level. To facilitate this 3 functions get added namely
`pause()`, `unpause()`,`freezeTransfers()`. All 3 functions are called by the issuer of the securityToken only.
* Security token has got a new feature of burning the tokens, To use this feature user need to call the `burn()` function but before that issuer need to deploy the `TokenBurner` contract and set its address into the SecurityToken contract using the function `setTokenBurner()`.            

## Remove     

* `investorStatus()` function in securityToken contract has removed.

***

[__0.3.1__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __06-04-18__

## Added
* Add `emit` keyword to emit the events.    
* Two new variable is added at the time of registration of ticker. `swarmHash` represents the off-chain data storage location on IPFS and `owner` It reperesent the ethereum address of the owner.       
* `LogRegisterTicker` emits two more variable called `_swarmHash` and `_owner`.   
* Two events are added in `GeneralPermissionManager` contract to facilitate the notifications for the UI end.
          __`LogChangePermission`__ :Emit when permissions to a delegate get changed.    
          __`LogAddPermission`__: Emit when delegate is added in permission manager contract.   
* `getInstructions()` is a public function added into the factories contracts. Use to get the useful instructions about the corresponding factory.   
* `_securityTokenRegistry` is more argument is added in __securityTokenV2__ contract.

## Changed
* All contracts get migrated from solc version 0.4.18 to 0.4.21.
* Now symbols get stored in smart contract in uppercase instead of lowercase.    
* Public variable `STRAdress` name in TickerRegistry smart contract changed to `strAddress`.   
* Function `permissions()` name in all module factories get changed to `getPermissions()`.   
* Function `delegateDetails()` name gets changed to `getDelegateDetails()` in GeneralPermissionManager contract.      
* `STVersionProxy_001 & STVersionProxy_002` contract name changed to STVersionProxy001 & STVersionProxy002 respectively.   

***

[__0.3.0__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __02-04-18__

## Added   
* Multiple events are added to `ModuleRegistry` contract to facilitate the Logging of the operations.   
        __`LogModuleUsed`__: Emit when Module get used by a securityToken.    
        __`LogModuleRegistered`__: Emit when a new module gets registered by the polymath for securityToken to use.   
        __`LogModuleVerified`__: Emit when module get verified by the ModuleRegistry owner.   
* ModuleRegistry now know about the SecurityTokenRegistry by using the function `setTokenRegistry` and it only is called by the owner of the ModuleRegistry contract.
* `verifyModule` function added to verify the newly added modules on the polymath platform. It is a type of ownable function.
* `securityTokenRegistry` public variable added to store the address of the SecurityTokenRegistry. And `verified` mapping added to hold the list of verified `moduleFactory` addresses with a bool flag.   
* Now `getSecurityTokenData()` is added to get the securityToken data instead of calling directly the public mapping `securityTokens`.   
* New variable `tokensSold` is added in the __cappedSTO__ contract. It is used to track the amount of securityTokens sold.  
* New moduleFactory called `ExchangeTransferManagerFactory` is added in to the list of the available modules in the Polymath V1 system.   
* **_budget** is a new parameter added in the `addModule`. It signifies the budget of the ongoing module in terms of __POLY__ token.   
* Two new events added into the securityToken contract to facilitate the logging of the operations.   
       __`LogModuleRemoved`__ : Event emit when module get removed from the securityToken.
       __`LogModuleBudgetChanged`__: Emit when module budget get changed.   
* `getModuleData` function added in the securityToken to get the data of the Module with the help of __moduleType__ and the __index of the module__ user want to get.   
* `removeModule` new function added facilitate the removal of the module from the securityToken. It is ownable type function.    
* `changeModuleBudget` function added to change the budget of the module that already been added. It is ownable type function.  

## Changed
* In early release token symbol in uppercase or in lowercase entertain differently. But for this release both upercase and lowercase symbol name are same.   
* Address of the owner of the securityToken is removed from the strucuture of the `SecurityTokenData`.
* Mapping `securityTokens` in ISecurityTokenRegistry is now being private instead of public.   
* `expiryLimit` default value get changed to 7 days instead of the 90 days in TickerRegistry.    
* __contact__ variable is replaced by the __tokenName__ variable in `SymbolDetails` structure of TickerRegistry.  
* Token name is now emitted in the `LogRegisterTicker` event corresponds to **_name** variable.    
* Now __checkValidity__ function takes three arguments insted of two, tokenName is the third one.
* __Cap__ is based on the number of securityToken sold instead of the quantity of the fundraised type.  
* __buyTokensWithPoly__ has only one argument called `_investedPoly` only. Beneficiary Address should be its msg.sender.    
* __getRaiseEther()__ function name changed to __getRaisedEther()__.   
* __getRaisePoly()__ function name changed to __getRaisedPoly()__.   
* `LogModuleAdded` emit one more variable called ___budget__.   
* `modules` mapping in the securityToken contract now returns __the array of ModuleData__.    

## Removed
* `admin` varaible is removed from the TickerRegistry contract.    

***

[__0.2.0__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __26-03-18__

## Added      
* ModuleRegistry contract will provide the list of modules by there types.  
* `SecurityTokenRegistry` is now working on the basis of the proxy version of the securitytoken contract. For that SecurityTokenRegistry has one more variable in the constructor called _STVersionProxy .   
* `setProtocolVersion` new function added in the SecurityTokenRegistry to set the protocol version followed to generate the securityToken. Only be called by the `polymath admin`.   
* `SecurityToken` now have the integration with polyToken. At the time of `addModule()` SecurityToken approve the cost of the module to moduleFactory as the spender.   
* New function `withdrawPoly(uint256 _amount)` is added to withdrawal the unused POLY from the securityToken contract. Called only by the owner of the contract.   
* `checkPermission(address _delegate, address _module, bytes32 _perm)` function is added to check the permissions on the service providers(delegate).
* `STVersionProxy_001.sol` & `STVersionProxy_002.sol` are the two new contract added. Both of those are the proxy contract use to generate the SecurityToken. Both contract constructor takes two variables address of `transferManagerFactory` address of the
`permissionManagerFactory`.   
* New Module type is added called `PermissionManager`. It has three contracts called GeneralPermissionManagerFactory, GeneralPermissionManager, IPermissionManager.
* `GeneralPermissionManger` is all about providing the permission to the delegate corresponds to the SecurityToken. Major functionality is added, check, change the permission of the delegate.   
* Two more functions added for each factory type i.e `getDescription()` & `getTitle()`.  
* `CappedSTO` is now Configurable by choosing the type of fundraise. Either POLY or ETH.
* `CappedSTO` takes 3 more constructor arguments fundRaiseType (uint8), the address of the polyToken & address of the fund's receiver.    
* `buyTokensWithPoly(address _beneficiary, uint256 _investedPoly)` new function added in cappedSTO to facilitate the funds raising with the POLY.   
* `verifyInvestment(address _beneficiary, uint256 _fundsAmount)` new function added in ISTO to check whether the investor provides the allowance to the CappedSTO or not.    
* `LogModifyWhitelist` event of GeneralTransferManager emit two more variables. i.e address which added the investor in whitelist(`_addedBy`) and records the timestamp at which modification in whitelist happen(`_dateAdded`).   
* `permissions()` function added in GeneralTransferManager to get all permissions.  
* `PolyToken.sol` contract is added at contracts/helpers/PolyToken.sol. For now, it has no big use.

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
* Functions of GeneralTransferManager earlier controlled by the owner only, now those can be controlled by the delegates as well with having proper permissions.   

## Removed
* `getCost()` is removed from the ModuleRegistry contract.
* `SafeMath.sol` contract is replaced by the zeppelin-solidity library contract .  
*  No more `SecurityTokens` and `symbol` information will be directly part of the SecurityTokenRegistry. Those information will accessed by inheriting the `ISecurityTokenRegistry`.   
* Remove the Delegable.sol, AclHelpers.sol, DelegablePorting.sol contracts. Now permission manager factory takes their place . * `delegates` mapping removed from the GeneralTransferManager.  
