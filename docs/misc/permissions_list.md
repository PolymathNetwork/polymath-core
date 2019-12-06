# Permissions List

|  Modules |  Contract Name |  Functions |  Current Permissions |
| :--- | :--- | :--- | :--- |
|  Checkpoint | ERC20DividendCheckpoint | pushDividendPayment\(\) |  withPerm\(OPERATOR\) |
| pushDividendPaymentToAddresses\(\) |  createCheckpoint\(\) |  |  |
|  reclaimDividend\(\) |  |  |  |
|  withdrawWithholding\(\) |  |  |  |
|  setDefaultExcluded\(\) |  withPerm\(ADMIN\) |  |  |
|  setWithholding\(\) |  |  |  |
|  setWithholdingFixed\(\) |  |  |  |
|  createDividend\(\) |  |  |  |
|  createDividendWithCheckpoint\(\) |  |  |  |
|  createDividendWithExclusions\(\) |  |  |  |
|  createDividendWithCheckpointAndExclusions\(\) |  |  |  |
| EtherDividendCheckpoint | pushDividendPayment\(\) |  withPerm\(OPERATOR\) |  |
| pushDividendPaymentToAddresses\(\) |  createCheckpoint\(\) |  |  |
|  reclaimDividend\(\) |  |  |  |
|  withdrawWithholding\(\) |  |  |  |
|  setDefaultExcluded\(\) |  withPerm\(ADMIN\) |  |  |
|  setWithholding\(\) |  |  |  |
|  setWithholdingFixed\(\) |  |  |  |
|  createDividend\(\) |  |  |  |
|  createDividendWithCheckpoint\(\) |  |  |  |
|  createDividendWithExclusions\(\) |  |  |  |
|  createDividendWithCheckpointAndExclusions\(\) |  |  |  |
|  PermissionManager | GeneralPermissionManager | addDelegate\(\) |  withPerm\(ADMIN\) |
|  deleteDelegate\(\) |  |  |  |
|  changePermission\(\) |  |  |  |
|  changePermissionMulti\(\) |  |  |  |
| STO | CappedSTO |  - |  - |
| DummySTO |  - |  - |  |
|  USDTieredSTO |  modifyFunding\(\) |  onlyOwner |  |
|  modifyLimits\(\) |  |  |  |
|  modifyFunding\(\) |  |  |  |
|  modifyTiers\(\) |  |  |  |
|  modifyTimes\(\) |  |  |  |
|  modifyAddresses\(\) |  |  |  |
|  finalize\(\) |  |  |  |
|  changeNonAccreditedLimit\(\) |  |  |  |
|  changeAllowBeneficialInvestments\(\) |  |  |  |
| PreSaleSTO | allocateTokens\(\) | withPerm\(ADMIN\) |  |
| allocateTokensMulti\(\) |  |  |  |
| TransferManager | CountTransferManager | changeHolderCount\(\) | withPerm\(ADMIN\) |
| GeneralTransferManager | changeIssuanceAddress\(\) | withPerm\(ADMIN\) |  |
| changeSigningAddress\(\) |  |  |  |
| changeAllowAllTransfers\(\) |  |  |  |
| changeAllowAllWhitelistTransfers\(\) |  |  |  |
| changeAllowAllWhitelistIssuances\(\) |  |  |  |
| changeAllowAllBurnTransfers\(\) |  |  |  |
| modifyKYCData\(\) |  |  |  |
| modifyKYCDataMulti\(\) | modifyInvestorFlag | modifyInvestorFlagMulti |  |
| ManualApprovalTransferManager | addManualApproval\(\) | withPerm\(ADMIN\) |  |
| addManualApproval\(\) |  |  |  |
| addManualApprovalMulti\(\) |  |  |  |
| modifyManualApproval\(\) |  |  |  |
| modifyManualApprovalMulti\(\) |  |  |  |
| revokeManualApproval\(\) |  |  |  |
| revokeManualApprovalMulti\(\) |  |  |  |
| PercentageTransferManager | modifyWhitelist\(\) | withPerm\(ADMIN\) |  |
|  modifyWhitelistMulti\(\) |  |  |  |
|  setAllowPrimaryIssuance\(\) |  |  |  |
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
| sendToTreasury | withPerm\(OPERATOR\) |  |  |
| pushAvailableTokens\(\) |  |  |  |
| pushAvailableTokensMulti\(\) |  |  |  |
| depositTokens\(\) | withPerm\(ADMIN\) |  |  |
| addTemplate\(\) |  |  |  |
| removeTemplate\(\) |  |  |  |
| addSchedule\(\) |  |  |  |
| addScheduleFromTemplate\(\) |  |  |  |
| modifySchedule\(\) |  |  |  |
| revokeSchedule\(\) |  |  |  |
| revokeAllSchedules\(\) |  |  |  |
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

