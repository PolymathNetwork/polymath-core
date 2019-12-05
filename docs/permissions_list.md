# Permissions List

| Module Type | Contract Name | Function | Current Permissions |
| :--- | :--- | :--- | :--- |
| Checkpoint | ERC20DividendCheckpoint | changeWallet | onlyOwner |
| setDefaultExcluded | withPerm\(ADMIN\) |  |  |
| setWithholding |  |  |  |
| setWithholdingFixed |  |  |  |
| createDividend |  |  |  |
| createDividendWithCheckpoint |  |  |  |
| createDividendWithExclusions |  |  |  |
| createDividendWithCheckpointAndExclusions |  |  |  |
| updateDividendDates |  |  |  |
| pushDividendPayment | withPerm\(OPERATOR\) |  |  |
| pushDividendPaymentToAddresses |  |  |  |
| createCheckpoint |  |  |  |
| reclaimDividend |  |  |  |
| withdrawWithholding |  |  |  |
| EtherDividendCheckpoint | changeWallet | onlyOwner |  |
| setDefaultExcluded | withPerm\(ADMIN\) |  |  |
| setWithholding |  |  |  |
| setWithholdingFixed |  |  |  |
| createDividend |  |  |  |
| createDividendWithCheckpoint |  |  |  |
| createDividendWithExclusions |  |  |  |
| createDividendWithCheckpointAndExclusions |  |  |  |
| updateDividendDates |  |  |  |
| pushDividendPayment | withPerm\(OPERATOR\) |  |  |
| pushDividendPaymentToAddresses |  |  |  |
| createCheckpoint |  |  |  |
| reclaimDividend |  |  |  |
| withdrawWithholding |  |  |  |
| Permission | GeneralPermissionManager | addDelegate | withPerm\(ADMIN\) |
| addDelegateMulti |  |  |  |
| deleteDelegate |  |  |  |
| deleteDelegateMulti |  |  |  |
| changePermission |  |  |  |
| changePermissionMulti |  |  |  |
| STO | CappedSTO | allowPreMinting |  |
| revokePreMintingFlag |  |  |  |
| finalize |  |  |  |
| changeAllBeneficialInvestments | withPerm\(OPERATOR\) |  |  |
| USDTieredSTO | modifyAddresses | onlyOwner |  |
| modifyOracles |  |  |  |
| allowPreMinting | withPerm\(ADMIN\) |  |  |
| revokePreMintingFlag |  |  |  |
| finalize |  |  |  |
| modifyFunding | withPerm\(OPERATOR\) |  |  |
| modifyLimits |  |  |  |
| modifyTiers |  |  |  |
| modifyTimes |  |  |  |
| changeNonAccreditedLimit |  |  |  |
| changeAllowBeneficialInvestments |  |  |  |
| PreSaleSTO | allocateTokens | withPerm\(ADMIN\) |  |
| allocateTokensMulti |  |  |  |
| TransferManager | CountTransferManager | changeHolderCount |  |
| GeneralTransferManager | changeIssuanceAddress |  |  |
| changeDefaults |  |  |  |
| modifyTransferRequirements |  |  |  |
| modifyTransferRequirementsMulti |  |  |  |
| modifyKYCData |  |  |  |
| modifyKYCDataMulti |  |  |  |
| modifyInvestorFlag |  |  |  |
| modifyInvestorFlagMulti |  |  |  |
| LockUpTransferManager | addNewLockUpTypeMulti |  |  |
| addLockUpByName |  |  |  |
| addLockUpByNameMulti |  |  |  |
| addNewLockUpToUser |  |  |  |
| addNewLockUpToUserMulti |  |  |  |
| removeLockUpFromUser |  |  |  |
| removeLockUpFromUserMulti |  |  |  |
| removeLockupType |  |  |  |
| removeLockupTypeMulti |  |  |  |
| modifyLockUpType |  |  |  |
| modifyLockUpTypeMulti |  |  |  |
| ManualApprovalTransferManager | addManualApproval |  |  |
| addManualApprovalMulti |  |  |  |
| modifyManualApproval |  |  |  |
| modifyManualApprovalMulti |  |  |  |
| revokeManualApproval |  |  |  |
| revokeManualApprovalMulti |  |  |  |
| PercentageTransferManager | modifyWhitelist |  |  |
| modifyWhitelistMulti |  |  |  |
| setAllowPrimaryIssuance |  |  |  |
| changeHolderPercentage |  |  |  |
| VolumeRestrictionTM | changeExemptWalletList |  |  |
| addDefaultRestriction |  |  |  |
| addDefaultDailyRestriction |  |  |  |
| addIndividualRestriction |  |  |  |
| addIndividualRestrictionMulti |  |  |  |
| addIndividualDailyRestriction |  |  |  |
| addIndividualDailyRestrictionMulti |  |  |  |
| removeIndividualRestriction |  |  |  |
| removeIndividualRestrictionMulti |  |  |  |
| removeIndividualDailyRestriction |  |  |  |
| removeIndividualDailyRestrictionMulti |  |  |  |
| removeDefaultDailyRestriction |  |  |  |
| removeDefaultRestriction |  |  |  |
| modifyIndividualRestriction |  |  |  |
| modifyIndividualRestrictionMulti |  |  |  |
| modifyIndividualDailyRestriction |  |  |  |
| modifyIndividualDailyRestrictionMulti |  |  |  |
| modifyDefaultRestriction |  |  |  |
| modifyDefaultDailyRestriction |  |  |  |
| BlacklistTransferManager | addBlacklistType |  |  |
| addBlacklistTypeMulti |  |  |  |
| modifyBlacklistType |  |  |  |
| modifyBlacklistTypeMulti |  |  |  |
| deleteBlacklistType |  |  |  |
| deleteBlacklistTypeMulti |  |  |  |
| addInvestorToBlacklist |  |  |  |
| addInvestorToBlacklistMulti |  |  |  |
| addMultiInvestorToBlacklistMulti |  |  |  |
| addInvestorToNewBlacklist |  |  |  |
| deleteInvestorFromAllBlacklist |  |  |  |
| deleteInvestorFromAllBlacklistMulti |  |  |  |
| deleteInvestorFromBlacklist |  |  |  |
| deleteMultiInvestorsFromBlacklistMulti |  |  |  |
| RestrictedPartialSaleTM | changeExemptWalletList | withPerm\(OPERATOR\) |  |
| changeExemptWalletListMulti |  |  |  |
| Wallet | VestingEscrowWallet | changeTreasuryWallet | onlyOwner |
| depositTokens | withPerm\(ADMIN\) |  |  |
| addTemplate |  |  |  |
| removeTemplate |  |  |  |
| addSchedule |  |  |  |
| addScheduleFromTemplate |  |  |  |
| modifySchedule |  |  |  |
| revokeSchedule |  |  |  |
| revokeAllSchedules |  |  |  |
| addScheduleMulti |  |  |  |
| addScheduleFromTemplateMulti |  |  |  |
| revokeSchedulesMulti |  |  |  |
| modifyScheduleMulti |  |  |  |
| sendToTreasury | withPerm\(OPERATOR\) |  |  |
| pushAvailableTokens |  |  |  |
| pushAvailableTokensMulti |  |  |  |
| Issuance | Issuance | issueTokens | withPerm\(ADMIN\) |
| issueTokensMulti |  |  |  |

