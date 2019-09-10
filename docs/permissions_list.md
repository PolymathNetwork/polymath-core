# Permissions List

<table>
    <thead>
        <tr>
            <th>Module Type</th>
            <th>Contract Name</th>
            <th>Function</th>
            <th>Current Permissions</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan="28">Checkpoint</td>
            <td rowspan="14">ERC20DividendCheckpoint</td>
            <td rowspan="1">changeWallet</td>
            <td rowspan="1">onlyOwner</td>
        </tr>
        <tr>
            <td rowspan="1">setDefaultExcluded</td>
            <td rowspan="8">withPerm(ADMIN)</td>
        </tr>
        <tr>
            <td rowspan="1">setWithholding</td>
        </tr>
        <tr>
            <td rowspan="1">setWithholdingFixed</td>
        </tr>
        <tr>
            <td rowspan="1">createDividend</td>
        </tr>
        <tr>
            <td rowspan="1">createDividendWithCheckpoint</td>
        </tr>
        <tr>
            <td rowspan="1">createDividendWithExclusions</td>
        </tr>
        <tr>
            <td rowspan="1">createDividendWithCheckpointAndExclusions</td>
        </tr>
        <tr>
            <td rowspan="1">updateDividendDates</td>
        </tr>
        <tr>
            <td rowspan="1">pushDividendPayment</td>
            <td rowspan="5">withPerm(OPERATOR)</td>
        </tr>
        <tr>
            <td rowspan="1">pushDividendPaymentToAddresses</td>
        </tr>
        <tr>
            <td rowspan="1">createCheckpoint</td>
        </tr>
        <tr>
            <td rowspan="1">reclaimDividend</td>
        </tr>
        <tr>
            <td rowspan="1">withdrawWithholding</td>
        </tr>
        <tr>
            <td rowspan="14">EtherDividendCheckpoint</td>
            <td rowspan="1">changeWallet</td>
            <td rowspan="1">onlyOwner</td>
        </tr>
        <tr>
            <td rowspan="1">setDefaultExcluded</td>
            <td rowspan="8">withPerm(ADMIN)</td>
        </tr>
        <tr>
            <td rowspan="1">setWithholding</td>
        </tr>
        <tr>
            <td rowspan="1">setWithholdingFixed</td>
        </tr>
        <tr>
            <td rowspan="1">createDividend</td>
        </tr>
        <tr>
            <td rowspan="1">createDividendWithCheckpoint</td>
        </tr>
        <tr>
            <td rowspan="1">createDividendWithExclusions</td>
        </tr>
        <tr>
            <td rowspan="1">createDividendWithCheckpointAndExclusions</td>
        </tr>
        <tr>
            <td rowspan="1">updateDividendDates</td>
        </tr>
        <tr>
            <td rowspan="1">pushDividendPayment</td>
            <td rowspan="5">withPerm(OPERATOR)</td>
        </tr>
        <tr>
            <td rowspan="1">pushDividendPaymentToAddresses</td>
        </tr>
        <tr>
            <td rowspan="1">createCheckpoint</td>
        </tr>
        <tr>
            <td rowspan="1">reclaimDividend</td>
        </tr>
        <tr>
            <td rowspan="1">withdrawWithholding</td>
        </tr>
        <tr>
            <td rowspan="6">Permission</td>
            <td rowspan="6">GeneralPermissionManager</td>
            <td rowspan="1">addDelegate</td>
            <td rowspan="9">withPerm(ADMIN)</td>
        </tr>
        <tr>
            <td rowspan="1">addDelegateMulti</td>
        </tr>
        <tr>
            <td rowspan="1">deleteDelegate</td>
        </tr>
        <tr>
            <td rowspan="1">deleteDelegateMulti</td>
        </tr>
        <tr>
            <td rowspan="1">changePermission</td>
        </tr>
        <tr>
            <td rowspan="1">changePermissionMulti</td>
        </tr>
        <tr>
            <td rowspan="17">STO</td>
            <td rowspan="4">CappedSTO</td>
            <td rowspan="1">allowPreMinting</td>
        </tr>
        <tr>
            <td rowspan="1">revokePreMintingFlag</td>
        </tr>
        <tr>
            <td rowspan="1">finalize</td>
        </tr>
        <tr>
            <td rowspan="1">changeAllBeneficialInvestments</td>
            <td rowspan="1">withPerm(OPERATOR)</td>
        </tr>
        <tr>
            <td rowspan="11">USDTieredSTO</td>
            <td rowspan="1">modifyAddresses</td>
            <td rowspan="2">onlyOwner</td>
        </tr>
        <tr>
            <td rowspan="1">modifyOracles</td>
        </tr>
        <tr>
            <td rowspan="1">allowPreMinting</td>
            <td rowspan="3">withPerm(ADMIN)</td>
        </tr>
        <tr>
            <td rowspan="1">revokePreMintingFlag</td>
        </tr>
        <tr>
            <td rowspan="1">finalize</td>
        </tr>
        <tr>
            <td rowspan="1">modifyFunding</td>
            <td rowspan="6">withPerm(OPERATOR)</td>
        </tr>
        <tr>
            <td rowspan="1">modifyLimits</td>
        </tr>
        <tr>
            <td rowspan="1">modifyTiers</td>
        </tr>
        <tr>
            <td rowspan="1">modifyTimes</td>
        </tr>
        <tr>
            <td rowspan="1">changeNonAccreditedLimit</td>
        </tr>
        <tr>
            <td rowspan="1">changeAllowBeneficialInvestments</td>
        </tr>
        <tr>
            <td rowspan="2">PreSaleSTO</td>
            <td rowspan="1">allocateTokens</td>
            <td rowspan="65">withPerm(ADMIN)</td>
        </tr>
        <tr>
            <td rowspan="1">allocateTokensMulti</td>
        </tr>
        <tr>
            <td rowspan="65">TransferManager</td>
            <td rowspan="1">CountTransferManager</td>
            <td rowspan="1">changeHolderCount</td>
        </tr>
        <tr>
            <td rowspan="8">GeneralTransferManager</td>
            <td rowspan="1">changeIssuanceAddress</td>
        </tr>
        <tr>
            <td rowspan="1">changeDefaults</td>
        </tr>
        <tr>
            <td rowspan="1">modifyTransferRequirements</td>
        </tr>
        <tr>
            <td rowspan="1">modifyTransferRequirementsMulti</td>
        </tr>
        <tr>
            <td rowspan="1">modifyKYCData</td>
        </tr>
        <tr>
            <td rowspan="1">modifyKYCDataMulti</td>
        </tr>
        <tr>
            <td rowspan="1">modifyInvestorFlag</td>
        </tr>
        <tr>
            <td rowspan="1">modifyInvestorFlagMulti</td>
        </tr>
        <tr>
            <td rowspan="11">LockUpTransferManager</td>
            <td rowspan="1">addNewLockUpTypeMulti</td>
        </tr>
        <tr>
            <td rowspan="1">addLockUpByName</td>
        </tr>
        <tr>
            <td rowspan="1">addLockUpByNameMulti</td>
        </tr>
        <tr>
            <td rowspan="1">addNewLockUpToUser</td>
        </tr>
        <tr>
            <td rowspan="1">addNewLockUpToUserMulti</td>
        </tr>
        <tr>
            <td rowspan="1">removeLockUpFromUser</td>
        </tr>
        <tr>
            <td rowspan="1">removeLockUpFromUserMulti</td>
        </tr>
        <tr>
            <td rowspan="1">removeLockupType</td>
        </tr>
        <tr>
            <td rowspan="1">removeLockupTypeMulti</td>
        </tr>
        <tr>
            <td rowspan="1">modifyLockUpType</td>
        </tr>
        <tr>
            <td rowspan="1">modifyLockUpTypeMulti</td>
        </tr>
        <tr>
            <td rowspan="6">ManualApprovalTransferManager</td>
            <td rowspan="1">addManualApproval</td>
        </tr>
        <tr>
            <td rowspan="1">addManualApprovalMulti</td>
        </tr>
        <tr>
            <td rowspan="1">modifyManualApproval</td>
        </tr>
        <tr>
            <td rowspan="1">modifyManualApprovalMulti</td>
        </tr>
        <tr>
            <td rowspan="1">revokeManualApproval</td>
        </tr>
        <tr>
            <td rowspan="1">revokeManualApprovalMulti</td>
        </tr>
        <tr>
            <td rowspan="4">PercentageTransferManager</td>
            <td rowspan="1">modifyWhitelist</td>
        </tr>
        <tr>
            <td rowspan="1">modifyWhitelistMulti</td>
        </tr>
        <tr>
            <td rowspan="1">setAllowPrimaryIssuance</td>
        </tr>
        <tr>
            <td rowspan="1">changeHolderPercentage</td>
        </tr>
        <tr>
            <td rowspan="19">VolumeRestrictionTM</td>
            <td rowspan="1">changeExemptWalletList</td>
        </tr>
        <tr>
            <td rowspan="1">addDefaultRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">addDefaultDailyRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">addIndividualRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">addIndividualRestrictionMulti</td>
        </tr>
        <tr>
            <td rowspan="1">addIndividualDailyRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">addIndividualDailyRestrictionMulti</td>
        </tr>
        <tr>
            <td rowspan="1">removeIndividualRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">removeIndividualRestrictionMulti</td>
        </tr>
        <tr>
            <td rowspan="1">removeIndividualDailyRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">removeIndividualDailyRestrictionMulti</td>
        </tr>
        <tr>
            <td rowspan="1">removeDefaultDailyRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">removeDefaultRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">modifyIndividualRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">modifyIndividualRestrictionMulti</td>
        </tr>
        <tr>
            <td rowspan="1">modifyIndividualDailyRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">modifyIndividualDailyRestrictionMulti</td>
        </tr>
        <tr>
            <td rowspan="1">modifyDefaultRestriction</td>
        </tr>
        <tr>
            <td rowspan="1">modifyDefaultDailyRestriction</td>
        </tr>
        <tr>
            <td rowspan="14">BlacklistTransferManager</td>
            <td rowspan="1">addBlacklistType</td>
        </tr>
        <tr>
            <td rowspan="1">addBlacklistTypeMulti</td>
        </tr>
        <tr>
            <td rowspan="1">modifyBlacklistType</td>
        </tr>
        <tr>
            <td rowspan="1">modifyBlacklistTypeMulti</td>
        </tr>
        <tr>
            <td rowspan="1">deleteBlacklistType</td>
        </tr>
        <tr>
            <td rowspan="1">deleteBlacklistTypeMulti</td>
        </tr>
        <tr>
            <td rowspan="1">addInvestorToBlacklist</td>
        </tr>
        <tr>
            <td rowspan="1">addInvestorToBlacklistMulti</td>
        </tr>
        <tr>
            <td rowspan="1">addMultiInvestorToBlacklistMulti</td>
        </tr>
        <tr>
            <td rowspan="1">addInvestorToNewBlacklist</td>
        </tr>
        <tr>
            <td rowspan="1">deleteInvestorFromAllBlacklist</td>
        </tr>
        <tr>
            <td rowspan="1">deleteInvestorFromAllBlacklistMulti</td>
        </tr>
        <tr>
            <td rowspan="1">deleteInvestorFromBlacklist</td>
        </tr>
        <tr>
            <td rowspan="1">deleteMultiInvestorsFromBlacklistMulti</td>
        </tr>
        <tr>
            <td rowspan="2">RestrictedPartialSaleTM</td>
            <td rowspan="1">changeExemptWalletList</td>
            <td rowspan="2">withPerm(OPERATOR)</td>
        </tr>
        <tr>
            <td rowspan="1">changeExemptWalletListMulti</td>
        </tr>
        <tr>
            <td rowspan="16">Wallet</td>
            <td rowspan="16">VestingEscrowWallet</td>
            <td rowspan="1">changeTreasuryWallet</td>
            <td rowspan="1">onlyOwner</td>
        </tr>
        <tr>
            <td rowspan="1">depositTokens</td>
            <td rowspan="12">withPerm(ADMIN)</td>
        </tr>
        <tr>
            <td rowspan="1">addTemplate</td>
        </tr>
        <tr>
            <td rowspan="1">removeTemplate</td>
        </tr>
        <tr>
            <td rowspan="1">addSchedule</td>
        </tr>
        <tr>
            <td rowspan="1">addScheduleFromTemplate</td>
        </tr>
        <tr>
            <td rowspan="1">modifySchedule</td>
        </tr>
        <tr>
            <td rowspan="1">revokeSchedule</td>
        </tr>
        <tr>
            <td rowspan="1">revokeAllSchedules</td>
        </tr>
        <tr>
            <td rowspan="1">addScheduleMulti</td>
        </tr>
        <tr>
            <td rowspan="1">addScheduleFromTemplateMulti</td>
        </tr>
        <tr>
            <td rowspan="1">revokeSchedulesMulti</td>
        </tr>
        <tr>
            <td rowspan="1">modifyScheduleMulti</td>
        </tr>
        <tr>
            <td rowspan="1">sendToTreasury</td>
            <td rowspan="3">withPerm(OPERATOR)</td>
        </tr>
        <tr>
            <td rowspan="1">pushAvailableTokens</td>
        </tr>
        <tr>
            <td rowspan="1">pushAvailableTokensMulti</td>
        </tr>
    </tbody>
</table>
