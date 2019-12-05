# Permissions List

|  Modules |  Contract Name |  Functions |  Current Permissions |
| :--- | :--- | :--- | :--- |
|  Checkpoint | ERC20DividendCheckpoint | pushDividendPayment\(\) |  withPerm\(DISTRIBUTE\) |
| pushDividendPaymentToAddresses\(\) |  |  |  |
|  setDefaultExcluded\(\) |  withPerm\(MANAGE\) |  |  |
|  setWithholding\(\) |  |  |  |
|  setWithholdingFixed\(\) |  |  |  |
|  createDividend\(\) |  |  |  |
|  createDividendWithCheckpoint\(\) |  |  |  |
|  createDividendWithExclusions\(\) |  |  |  |
|  createDividendWithCheckpointAndExclusions\(\) |  |  |  |
|  reclaimDividend\(\) |  |  |  |
|  withdrawWithholding\(\) |  createCheckpoint\(\) |  withPerm\(CHECKPOINT\) |  |
| EtherDividendCheckpoint | pushDividendPayment\(\) |  withPerm\(DISTRIBUTE\) |  |
| pushDividendPaymentToAddresses\(\) |  |  |  |
|  setDefaultExcluded\(\) |  withPerm\(MANAGE\) |  |  |
|  setWithholding\(\) |  |  |  |
|  setWithholdingFixed\(\) |  |  |  |
|  createDividend\(\) |  |  |  |
|  createDividendWithCheckpoint\(\) |  |  |  |
|  createDividendWithExclusions\(\) |  |  |  |
|  createDividendWithCheckpointAndExclusions\(\) |  |  |  |
|  reclaimDividend\(\) |  |  |  |
|  withdrawWithholding\(\) |  createCheckpoint\(\) |  withPerm\(CHECKPOINT\) |  |
|  PermissionManager | GeneralPermissionManager | addDelegate\(\) |  withPerm\(CHANGE\_PERMISSION\) |
|  changePermission\(\) |  |  |  |
|  changePermissionMulti\(\) |  |  |  |
| STO | CappedSTO |  - |  - |
| DummySTO |  - |  - |  |
|  USDTieredSTO |  modifyFunding\(\) |  onlyOwner |  |
|  modifyLimits\(\) |  |  |  |
|  modifyTiers\(\) |  |  |  |
|  modifyAddresses\(\) |  |  |  |
|  finalize\(\) |  |  |  |
|  changeAccredited\(\) |  |  |  |
| PreSaleSTO | allocateTokens\(\) | withPerm\(PRE\_SALE\_ADMIN\) |  |
| allocateTokensMulti\(\) |  |  |  |
| TransferManager | CountTransferManager | changeHolderCount\(\) | withPerm\(ADMIN\) |
| GeneralTransferManager | changeIssuanceAddress\(\) | withPerm\(FLAGS\) |  |
| changeSigningAddress\(\) |  |  |  |
| changeAllowAllTransfers\(\) |  |  |  |
| changeAllowAllWhitelistTransfers\(\) |  |  |  |
| changeAllowAllWhitelistIssuances\(\) |  |  |  |
| changeAllowAllBurnTransfers\(\) |  |  |  |
| modifyWhitelist\(\) | withPerm\(WHITELIST\) |  |  |
| modifyWhitelistMulti\(\) |  |  |  |
| ManualApprovalTransferManager | addManualApproval\(\) | withPerm\(TRANSFER\_APPROVAL\) |  |
| revokeManualApproval\(\) |  |  |  |
| PercentageTransferManager | modifyWhitelist\(\) | withPerm\(WHITELIST\) |  |
|  modifyWhitelistMulti\(\) |  |  |  |
|  setAllowPrimaryIssuance\(\) |  withPerm\(ADMIN\) |  |  |
|  changeHolderPercentage\(\) |  |  |  |
|  VolumeRestrictionTM |  changeExemptWalletList\(\) |  withPerm\(ADMIN\) |  |
| addIndividualRestriction\(\) |  |  |  |
| addIndividualRestrictionMulti\(\) |  |  |  |
| addGlobalRestriction\(\) |  |  |  |
| addDailyGlobalRestriction\(\) |  |  |  |
| removeIndividualRestriction\(\) |  |  |  |
| removeIndividualRestrictionMulti\(\) |  |  |  |
| removeGlobalRestriction\(\) |  |  |  |
| removeDailyGlobalRestriction\(\) |  |  |  |
| modifyIndividualRestriction\(\) |  |  |  |
| modifyIndividualRestrictionMulti\(\) |  |  |  |
| modifyGlobalRestriction\(\) |  |  |  |
| modifyDailyGlobalRestriction\(\) |  |  |  |
|  BlacklistTransferManager |  addBlacklistType\(\) |  withPerm\(ADMIN\) |  |
|  addBlacklistTypeMulti\(\) |  |  |  |
|  modifyBlacklistType\(\) |  |  |  |
|  modifyBlacklistTypeMulti\(\) |  |  |  |
|  deleteBlacklistType\(\) |  |  |  |
|  deleteBlacklistTypeMulti\(\) |  |  |  |
|  addInvestorToBlacklist\(\) |  |  |  |
|  addInvestorToBlacklistMulti\(\) |  |  |  |
|  addMultiInvestorToBlacklistMulti\(\) |  |  |  |
|  addInvestorToNewBlacklist\(\) |  |  |  |
|  deleteInvestorFromAllBlacklist\(\) |  |  |  |
|  deleteInvestorFromAllBlacklistMulti\(\) |  |  |  |
|  deleteInvestorFromBlacklist\(\) |  |  |  |
|  deleteMultiInvestorsFromBlacklistMulti\(\) |  |  |  |
| Wallet | VestingEscrowWallet | changeTreasuryWallet\(\) | onlyOwner |
| depositTokens\(\) | withPerm\(ADMIN\) |  |  |
| sendToTreasury\(\) |  |  |  |
| pushAvailableTokens\(\) |  |  |  |
| addTemplate\(\) |  |  |  |
| removeTemplate\(\) |  |  |  |
| addSchedule\(\) |  |  |  |
| addScheduleFromTemplate\(\) |  |  |  |
| modifySchedule\(\) |  |  |  |
| revokeSchedule\(\) |  |  |  |
| revokeAllSchedules\(\) |  |  |  |
| pushAvailableTokensMulti\(\) |  |  |  |
| addScheduleMulti\(\) |  |  |  |
| addScheduleFromTemplateMulti\(\) |  |  |  |
| revokeSchedulesMulti\(\) |  |  |  |
| modifyScheduleMulti\(\) |  |  |  |

## Permissions on supporting contracts

|  Contract Name |  Functions |  Current Permissions |
| :--- | :--- | :--- |
|  PolyOracle |  schedulePriceUpdatesFixed\(\) |  isAdminOrOwner |
|  schedulePriceUpdatesRolling\(\) |  |  |
|  setGasLimit\(\) |  |  |
|  setPOLYUSD\(\) |  onlyOwner |  |
|  setFreezeOracle\(\) |  |  |
|  setOracleURL\(\) |  |  |
|  setSanityBounds\(\) |  |  |
|  setGasPrice\(\) |  |  |
|  setStaleTime\(\) |  |  |
|  setIgnoreRequestIds\(\) |  |  |
|  setAdmin\(\) |  |  |
|  setOraclizeTimeTolerance\(\) |  |  |
|  |  |  |
|  MakerDAOOracle |  setManualPrice\(\) |  onlyOwner |
|  setManualOverride\(\) |  |  |
|  |  |  |

