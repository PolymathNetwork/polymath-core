# Changelog
All notable changes to this project will be documented in this file.

# v3.0.0 - Release Candidate

[__3.0.0__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __10-11-18__

## SecurityToken
* Added new function `addModuleWithLabel()` which takes an extra param `_label` that used for giving the customize label to the module for display purpose. #428
* Changed the first three params in Security Token `event ModuleAdded()` to be indexed for search. Params are `unit8[] types`, `bytes32 _name` and `address _moduleFactory`
* Fixed `addModule` function to be backwards compatible and call the new `addModuleWithLabel` function with an empty label.
* Fixed event `ModuleAdded` to also emit `_label`.    
* Fixed function `getModule` to also return the respective module label.
* Added datastore that is used to store data like investor list that is shared among modules.
* `getInvestorCount()` now returns length of investor array that is everyone who ever held some st or has kyc data attached.
* `holderCount()` returns the number of current st holders.
* Added flags for Investors. Accredited and canbuyfromsto are now flags.
* Add `_archived` flag in `addModule()` to allow issuers to add archived modules into the ST.    
* Add `upgradeModule()` function to upgrade the already attached module. It can only be called by owner of the token.   
* Add `upgradeToken()` function to upgrade the token to the latest version. Can only be executed by the owner of the token.    
* Add `changeDataStore()` function to change the dataStore contract address attached with the ST.    
* Issuer is allowed to change the name of the token using the `changeName()` function.   
* Add `changeTreasuryWallet()` funtion to change the treasury wallet of the token.     
* `transferWithData()` & `transferFromWithData()` function doesn't return the bool anymore.    
* Introduced `balanceOfByPartition()` function to read the balance of the token holder according to the given partition.  
* Add `transferByPartition()` function to transfer the tokens as per the given partition.   
* Removed `verifyTransfer()` function.   
* Add `authorizeOperator`, `revokeOperator`, `authorizeOperatorByPartition`, `revokeOperatorByPartition`, `operatorTransferByPartition` as the operator functions.   
* Remove `freezeMinting()` and introduced `freezeIssuance()`.      
* Rename the `mintWithData()` function to `issue()` function and `mintMulti()` to `issueMulti()`, remove `mint` function.          
* Rename the `burnWithData()` function to `redeem()` function and `burnFromWithData()` to `redeemFrom()`, remove `burn` function.
* Add `redeemByPartition()` & `operatorRedeemByPartition()` function.   
* Add `issueByPartition()` to issue the tokens as per given partition.     
* `disableController()` now takes the sender signature to confirm the operation.    
* Introduce `canTransfer()`, `canTransferFrom()` & `canTransferByPartition()` to validate the transfer before actually executing it.  
* Add document specific functions `setDocument()`, `removeDocument()`.   
* Rename `forceTransfer()` to `controllerTransfer()` similarly `forceBurn()` to `controllerRedeem()`.   
* Add `isControllable()` to know whether the controller functions are allowed to execute or not.    
* Add `isIssuable()`, `getInvestorsSubsetAt()`, `getTreasuryWallet()`, `isOperator()`, `isOperatorForPartition()`, `partitionsOf()`, `getDocument()`, `getAllDocument()` functions as getters to support ST functionality.   
* Remove the `bool` return parameter from the `canTransfer` & `canTransferFrom` function.
* Rename `increaseApproval()` & `decreaseApproval()` to `increaseAllowance()` & `decreaseAllowance()` respectively.   

## STR
* Introduce new contract `STRGetter.sol`. It only contains the getter functions of the STR.
* Replaced `updatePolyTokenAddress()` function with `updateFromRegistry()` in `SecurityTokenRegistry`.  
* Migrate all the getters of `SecurityTokenRegistry.sol` to `STRGetter.sol` contract.
* Removed `_polyToken` parameter from `initialize` function in `SecurityTokenRegistry`.
* Allows an explicit token factory version to be used during creation of securityToken.
* Rename the `getProtocolVersion()` to `getLatestProtocolVersion()`.
* Add `generateNewSecurityToken()` function to generate the 3.0 tokens.    
* Add `refreshSecurityToken()` function to update the 2.x tokens to 3.0 tokens.   
* Add `changeFeesAmountAndCurrency()` function to sets the ticker registration and ST launch fee amount and currency.     
* Rename `setProtocolVersion()` to `setProtocolFactory()`, Add `removeProtocolFactory()`.   
* Add `getTokensByDelegate()`, `getSTFactoryAddressOfVersion()`, `getLatestProtocolVersion()`, `getIsFeeInPoly()` some getters.  
* Add `RegisterTicker` event with two new parameters `_registrationFeePoly` & `_registrationFeeUsd`. (Note- there is 2 events with the same name to maintain the backwards compatibility).   
* Add `NewSecurityToken` event with three new parameters `_usdFee`, `_polyFee` & `_protocolVersion`. (Note- there is 2 events with the same name to maintain the backwards compatibility). 
* Add `registerNewTicker()` function to register the ticker for `3.0.0` release. NB- `registerTicker()` is also present in the code to maintain the backwards compatibility.  
* Add `modifyExistingTicker()` to modify the ticker & `modifyExistingSecurityToken()` to modify the ST.  
* Add `tickerAvailable()` to get the status of ticker availability.  

## MR   
* Add `_isUpgrade` param in function `useModule()`. NB - `useModule()` function exists with the same arguments to maintain the backwards compatibility.    
* Add `isCompatibleModule()` to check whether the given module and ST is compatible or not.   
* Remove `_isVerified` param from the `verifyModule()` function and introduced `unverifyModule()` function to unverify module.     
* Removed `getReputationByFactory()`.
* `getFactoryDetails()` is now return one extra parameter i.e address of the factory owner.
* `getAllModulesByType()` add new function to return array that contains the list of addresses of module factory contracts.   

## GeneralTransferManager
* `modifyWhitelist()` function renamed to `modifyKYCData()`.
* Added functions to modify and get flags
* `canBuyFromSto` is now `canNotBuyFromSto` and it is the flag `1`
* GTM logic reworked. Now, instead of flags like allowAllTransfers, there is a matrix of transfer requirements that must be fulfilled based on type of transfer.
* Remove `changeSigningAddress()`, `changeAllowAllTransfers()`, `changeAllowAllWhitelistTransfers()`, `changeAllowAllWhitelistIssuances()`, `changeAllowAllBurnTransfers`.   
* Introduced `modifyTransferRequirements()` & `modifyTransferRequirementsMulti()` to modify the transfer requirements.   
* Add `modifyInvestorFlag()` & `modifyInvestorFlagMulti()` function to modify the flag.   
* `modifyWhitelistSigned()` rename to `modifyKYCDataSigned()`. Add `modifyKYCDataSignedMulti`.    
* Add `getAllInvestorFlags()`, `getInvestorFlag()`,`getInvestorFlags()`, `getAllKYCData()`, `getKYCData()` & `getTokensByPartition()`. 

## USDTiererdSTO
* Removed `changeAccredited()` function.    
* `buyWithETH()`, `buyWithPOLY()`, `buyWithUSD()`, `buyWithETHRateLimited()`, `buyWithPOLYRateLimited()` & `buyWithUSDRateLimited()` will return spentUSD, spentValue & amount of mint tokens.   
* Remove `buyTokensView()` function.  
* Add `modifyOracle()` function allow issuer to add their personalize oracles.   

## Modules   
* Introduced BTM, LTM, Voting and VEW modules.  
* Remove the  `_usageCost` variable when deploying any module factory.  
* Remove `takeUsageFee()` function from evey module.   
* Remove `changeUsageCost()` & `usageCostInPoly()` from every module factory. 
* Remove `takeFee()` function.
* `getTreasuryWallet()` function added to `DividendCheckpoint.sol`.

## Generalize
* Removed `_polyAddress` parameter from constructors of all modules and module factories.
* All modules are upgradeable now. 
* Permission types are only `ADMIN` and `OPERATOR` now.      

# v2.1.0 - Release Candidate    

[__2.1.0__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __13-09-18__


## CappedSTO 2.1.0
* `rate` is now accepted as multiplied by 10^18 to allow settting higher price than 1ETH/POLY per token.
* Indivisble tokens are now supported. When trying to buy partial tokens, allowed full units of tokens will be purchased and remaining funds will be returned.

## USDTieredSTO 2.1.0
* Added `stableCoinsRaised` function that returns amount of individual stable coin raised when address of that stable coin is passed.
* Added support for multiple stable coins in USDTSTO.
* Added `buyTokensView` and `getTokensMintedByTier` to USDTSTO.
* Added `getSTODetails` to USDTSTO.
* Added an Array of Tiers that will hold data about every tier in USDTSTO.
* Added `buyWithETHRateLimited`, `buyWithPOLYRateLimited` and `buyWithUSDRateLimited` to USDTSTO.
* Added `getTokensSoldByTier` to return sold (not minted during finalisation) tokens in each tier to USDTSTO.
* Removed individual mappings for tier data removed in UDSTSTO.
* Removed the old Proxy deployment method of USDTieredSTO and adopt the new inherited proxy deployment approach.
* Bump the version to `2.1.0`
* Added `getAccreditedData` to return accredited & non-accredited investor data.
* Event `TokenPurchase` has uint256 tier instead of uint8 tier.  
* Event `SetAddresses` has non-indexed array of address of `_usdTokens` rather than single indexed address.
* Added `getUsdTokens()` function that returns array of accepted stable coin (usd token) addresses.
* Pass an array of `_usdToken` address in `configure` function instead of singleton address. This will require changes in bytes data generation when deploying a usdtsto through factory.

## GeneralTransferManager
* `getInvestors`, `getAllInvestorsData`, `getInvestorsData` added to GTM to allow easy data queries.
* `changeDefaults(uint64 _defaultFromTime, uint64 _defaultToTime)` added which sets a default timestamp used when `fromTime` or `toTime` are 0.
* Add `address[] public investors` to record a list of all addresses that have been added to the whitelist (`getInvestors`).
* Fix for when `allowAllWhitelistIssuances` is FALSE
* Make GTM a Proxy based implementation to reduce deployment gas costs
* Changed the version of `GeneralTransferManagerFactory` from `1.0.0` to `2.1.0`.
* `_investor` and `_addedBy` is now indexed in the `ModifyWhitelist` event.
* Add public variable `defaults` to get the offset timing.

## Manual Approval TransferManager
* Removed `0x0` check for the `_from` address to `ManualApprovalTransferManager`. This allows for the Issuer/Transfer Agent to approve a one-off mint of tokens that otherwise would not be possible.
* Changed the version of `ManualApprovalTransferManagerFactory` from `1.0.0` to `2.1.0`.   
* Deployed 2.0.1 `ManualApprovalTransferManagerFactory` to address 0x6af2afad53cb334e62b90ddbdcf3a086f654c298
* Add `getActiveApprovalsToUser()` function to access all the active approvals for a user whether user is in the `from` or in `to`.  
* Add `getApprovalDetails()` to get the details of the approval corresponds to `_from` and `_to` address.
* Add feature to modify the details of the active approval using `modifyApproval()` & `modifyApprovalMulti()`.
* Add `addManualApprovalMulti()` and `revokeManualApprovalMulti()` batch function for adding and revoking the manual approval respectively.
* Add `_description` parameter during the `addManualApproval()` function call. It will be a `bytes32` variable which depicts the cause of manual approval.
* Remove `addManualBlocking()` , `revokeManualBlocking()` functions.
* Add `getTotalApprovalsLength()` to get the number of active approvals.
* Add `getAllApprovals()` to get the details of all approvals.

## Dividends
* Changed the version of `ERC20DividendCheckpointFactory` & `EtherDividendCheckpointFactory` from `1.0.0` to `2.1.0`.
* Applied proxy pattern to Dividends modules.
* During the launch of dividend module issuer need to pass the reclaimed wallet that receive the left over funds from the module.
i.e pass `_wallet` in `configure()` function of dividend module. It emits `SetWallet` event for the confirmation of the same.
* Add `changeWallet()` function to change the reclaimed wallet address (only be called by the owner).
* Add `getDividendsData()` getter to receive the details about all the dividend.
* Add `getDividendData()` getter to receive the details about the particular dividend by passing a corresponding dividend index.
* Add `getDividendProgress()` getter to retrieves the list of investors and their details corresponds to particular dividend.
* Add `getCheckpointData()` use to retrieves list of investors, their balances, and their current withholding tax percentage corresponds to checkpointId.
* `isExcluded()` a view function added to check whether an address is excluded from claming a dividend or not.
* `isClaimed()` a view function added to checks whether an address has claimed a dividend or not.
*  DividendIndex is indexed in the events `ERC20DividendClaimed`, `ERC20DividendReclaimed`, `ERC20DividendWithholdingWithdrawn`. Similarly for the Ether dividend module `EtherDividendClaimed`, `EtherDividendReclaimed`, `EtherDividendClaimFailed`, `EtherDividendWithholdingWithdrawn`.
* `EXCLUDED_ADDRESS_LIMIT` changed from 50 to 150.

## Experimental modules
* Remove the `SingleTradeVolumeRestrictionTMFactory.sol` and its corresponding module `SingleTradeVolumeRestrictionTM.sol`.
* Add the new TM called `BlacklistTransferManager.sol` and its corresponding factory `BlacklistTransferManagerFactory.sol`.
* Chnage the name of module from `LockupVolumeRestrictionTM.sol` to `LockUpTransferManager.sol`, similarly factory become `LockUpTransferManagerFactory.sol`.
* Add new module called `VestingEscrowWallet.sol` and its corresponding factory `VestingEscrowWalletFactory.sol`.

## STR & MR
* `getArrayAddress(), getArrayBytes32(), getArrayUint()` are now public getters.
*  `getUintValues(), getBoolValues(), getStringValues(), getAddressValues(), getBytes32Values(), getBytesValues()` rename to `getUintValue(), getBoolValue(), getStringValue(), getAddressValue(), getBytes32Value(), getBytesValue()`. #488

## Added
* Add new module called `VolumeRestrictionTM.sol` under the TransferManager modules list. It will be used to restrict the token
volume traded in a given rolling period.

## Changed
* `getAllModulesAndPermsFromTypes()` does not take securityToken address as a parameter anymore.


# v1.5.0 - Release Candidate

[__1.5.0__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __15-08-18__

## Added
* Added `getInvestorsAt` which returns the investors (non-zero balances) at a particular checkpoint
* Added `iterateInvestors` to allow an a subset of `investors` to be returned from the security token in case `investors` is large.
* `ChangeModuleBudget` in SecurityToken now takes in the change in budget rather than absoulte budget. Added boolean paramter to decide increase/decrease.
* Added `createCheckpoint() withPerm(CHECKPOINT)` to dividend checkpoint modules.
* Added `deleteDelegate()` to general permission manager. It will disable the delegate but not delete the perms.
* Migrated from `npm` to `yarn`.
* Added `SingleTradeVolumeRestrictionManager` module
* Added flag in `PercentageTransferManager` to allow ignoring of issuance transfers
* Added `transferWithData`, `transferFromWithData`, `mintWithData`, `burnWithData` to allow passing of a `bytes _data` for off-chain validation
* Added ability for modules to have multiple types
* Added `name` field to dividends struct in DividendCheckpoint. #295
* Added `getTagsByType`, `getTagsByTypeAndToken`, `getModulesByType`, `getModulesByTypeAndToken` to MR
* Added `getTokensByOwner` to STR
* Added withholding tax to ether & erc20 dividends
* Generalised MakerDAO oracle to allow different instances referencing different currencies
* Added DAI as a fundraising currency to USDTieredSTO
* `transferTickerOwnership()` function is introduced in `TickerRegistry` to transfer the ticker ownership after the registeration #191.
* `getTickersByOwner()` function is used to get the list of tickers owned by the issuer #189.   
* New function `addCustomTicker()` is used the add the Ticker in tickerRegistry. To avail the facility to Registry owner to add the tokens without paying the fee #190.  
* Adding the functionality to change the `version`,`name`,`description`,`title` of a Module factory.   
* Add the `registrationTimestamp` in the `SecurityTokenData` structure that also leads the change in the `getSecurityTokenData()` return parameters. #199
* Add `_deployedAt` new parameter in the `addCustomSecurityToken`. #199
* Add `getReputationOfFactory()` & `getModuleListOfType()` functions to get the array type data from the ModuleRegistry contract.   
* Add `_setupCost` in `LogGenerateModuleFromFactory` event.   
* Add new function `getAllModulesByName()`, To get the list of modules having the same name. #198.  
* Add new function `modifyTickerDetails()`, To modify the details of undeployed ticker. #230



## Fixed
* 0x0 and duplicate address in exclusions are no longer allowed in dividend modules.
* All permissions are denied if no permission manager is active.
* Generalize the STO varaible names and added them in `ISTO.sol` to use the common standard in all STOs.
* Generalize the event when any new token get registered with the polymath ecosystem. `LogNewSecurityToken` should emit _ticker_, _name_, _securityTokenAddress_, _owner_, _addedAt_, _registrant_ respectively. #230  
* Change the function name of `withdraPoly` to `withdrawERC20` and make the function generalize to extract tokens from the ST contract. parmeters are contract address and the value need to extract from the securityToken.     

## Removed
* Removed investors list pruning
* Remove `swarmHash` from the `registerTicker(), addCustomTicker(), generateSecurityToken(), addCustomSecurityToken()` functions of TickerRegistry.sol and SecurityTokenRegistry.sol. #230  
* Remove `Log` prefix from all the event present in the ecosystem.    
* Removed `addTagByModuleType` & `removeTagsByModuleType` from MR.

======

# v1.4.1

[__1.4.1__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __13-08-18__

## Added

* Test cases for 1.4.1 migration
* STR Migration script
* Encrypted API Key for CMC queries in PolyOracle

## Changed

* Remove endData update from unpause function
* Allow custom tokens to be added when STR is paused
* PolyOracle does not revert on out of order callbacks (silently ignores instead)
* Removed USDTieredSTO > STR dependency by moving oracle registry to PolymathRegistry

## Fixed

* Rounding edge cases in USDTieredSTO.sol that could have reverted valid transactions      
* Fix #239: fix basic fee logic for ongoing module fees
* Fix #238: make beneficial investments optionally supported (default to not
allowed)

# v1.4.0

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
* Change in the datastructure of SymbolDetails new variable `expiredTimestamp` introduced and change the variable name `timestamp` to `registeredTimestamp` in Tickerregistry.sol #192.      
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
* `LogModuleAdded` emit one more variable called __budget__.   
* `modules` mapping in the securityToken contract now returns __the array of ModuleData__.    

## Removed
* `admin` varaible is removed from the TickerRegistry contract.    

***

[__0.2.0__](https://www.npmjs.com/package/polymath-core?activeTab=readme) __26-03-18__

## Added      
* ModuleRegistry contract will provide the list of modules by there types.  
* `SecurityTokenRegistry` is now working on the basis of the proxy version of the securitytoken contract. For that SecurityTokenRegistry has one more variable in the constructor called _STVersionProxy_ .   
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
* `setTokenRegistrar` function of TickerRegistry renamed to `setTokenRegistry`.   
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
