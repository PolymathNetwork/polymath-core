function getPermissionList() {
    return {
        ERC20DividendCheckpoint: {
            changeWallet: "ONLY_OWNER",
            setDefaultExcluded: "ADMIN",
            setWithholding: "ADMIN",
            setWithholdingFixed: "ADMIN",
            createDividend: "ADMIN",
            createDividendWithCheckpoint: "ADMIN",
            createDividendWithExclusions: "ADMIN",
            createDividendWithCheckpointAndExclusions: "ADMIN",
            updateDividendDates: "ADMIN",
            pushDividendPayment: "OPERATOR",
            pushDividendPaymentToAddresses: "OPERATOR",
            createCheckpoint: "OPERATOR",
            reclaimDividend: "OPERATOR",
            withdrawWithholding: "OPERATOR"
        },
        EtherDividendCheckpoint: {
            changeWallet: "ONLY_OWNER",
            setDefaultExcluded: "ADMIN",
            setWithholding: "ADMIN",
            setWithholdingFixed: "ADMIN",
            createDividend: "ADMIN",
            createDividendWithCheckpoint: "ADMIN",
            createDividendWithExclusions: "ADMIN",
            createDividendWithCheckpointAndExclusions: "ADMIN",
            updateDividendDates: "ADMIN",
            pushDividendPayment: "OPERATOR",
            pushDividendPaymentToAddresses: "OPERATOR",
            createCheckpoint: "OPERATOR",
            reclaimDividend: "OPERATOR",
            withdrawWithholding: "OPERATOR"
        },
        GeneralPermissionManager: {
            addDelegate: "ADMIN",
            addDelegateMulti: "ADMIN",
            deleteDelegate: "ADMIN",
            deleteDelegateMulti: "ADMIN",
            changePermission: "ADMIN",
            changePermissionMulti: "ADMIN"
        },
        CappedSTO: {
            allowPreMinting: "ADMIN",
            revokePreMintingFlag: "ADMIN",
            finalize: "ADMIN",
            changeAllBeneficialInvestments: "OPERATOR"
        },
        USDTieredSTO: {
            modifyAddresses: "ONLY_OWNER",
            modifyOracles: "ONLY_OWNER",
            allowPreMinting: "ADMIN",
            revokePreMintingFlag: "ADMIN",
            finalize: "ADMIN",
            modifyFunding: "OPERATOR",
            modifyLimits: "OPERATOR",
            modifyTiers: "OPERATOR",
            modifyTimes: "OPERATOR",
            changeNonAccreditedLimit: "OPERATOR",
            changeAllowBeneficialInvestments: "OPERATOR"
        },
        PreSaleSTO: {
            allocateTokens: "ADMIN",
            allocateTokensMulti: "ADMIN"
        },
        CountTransferManager: {
            changeHolderCount: "ADMIN"
        },
        GeneralTransferManager: {
            changeIssuanceAddress: "ADMIN",
            changeDefaults: "ADMIN",
            modifyTransferRequirements: "ADMIN",
            modifyTransferRequirementsMulti: "ADMIN",
            modifyKYCData: "ADMIN",
            modifyKYCDataMulti: "ADMIN",
            modifyInvestorFlag: "ADMIN",
            modifyInvestorFlagMulti: "ADMIN"
        },
        LockUpTransferManager: {
            addNewLockUpTypeMulti: "ADMIN",
            addLockUpByName: "ADMIN",
            addLockUpByNameMulti: "ADMIN",
            addNewLockUpToUser: "ADMIN",
            addNewLockUpToUserMulti: "ADMIN",
            removeLockUpFromUser: "ADMIN",
            removeLockUpFromUserMulti: "ADMIN",
            removeLockupType: "ADMIN",
            removeLockupTypeMulti: "ADMIN",
            modifyLockUpType: "ADMIN",
            modifyLockUpTypeMulti: "ADMIN"
        },
        ManualApprovalTransferManager: {
            addManualApproval: "ADMIN",
            addManualApprovalMulti: "ADMIN",
            modifyManualApproval: "ADMIN",
            modifyManualApprovalMulti: "ADMIN",
            revokeManualApproval: "ADMIN",
            revokeManualApprovalMulti: "ADMIN"
        },
        PercentageTransferManager: {
            modifyWhitelist: "ADMIN",
            modifyWhitelistMulti: "ADMIN",
            setAllowPrimaryIssuance: "ADMIN",
            changeHolderPercentage: "ADMIN"
        },
        VolumeRestrictionTM: {
            changeExemptWalletList: "ADMIN",
            addDefaultRestriction: "ADMIN",
            addDefaultDailyRestriction: "ADMIN",
            addIndividualRestriction: "ADMIN",
            addIndividualRestrictionMulti: "ADMIN",
            addIndividualDailyRestriction: "ADMIN",
            addIndividualDailyRestrictionMulti: "ADMIN",
            removeIndividualRestriction: "ADMIN",
            removeIndividualRestrictionMulti: "ADMIN",
            removeIndividualDailyRestriction: "ADMIN",
            removeIndividualDailyRestrictionMulti: "ADMIN",
            removeDefaultDailyRestriction: "ADMIN",
            removeDefaultRestriction: "ADMIN",
            modifyIndividualRestriction: "ADMIN",
            modifyIndividualRestrictionMulti: "ADMIN",
            modifyIndividualDailyRestriction: "ADMIN",
            modifyIndividualDailyRestrictionMulti: "ADMIN",
            modifyDefaultRestriction: "ADMIN",
            modifyDefaultDailyRestriction: "ADMIN"
        },
        BlacklistTransferManager: {
            addBlacklistType: "ADMIN",
            addBlacklistTypeMulti: "ADMIN",
            modifyBlacklistType: "ADMIN",
            modifyBlacklistTypeMulti: "ADMIN",
            deleteBlacklistType: "ADMIN",
            deleteBlacklistTypeMulti: "ADMIN",
            addInvestorToBlacklist: "ADMIN",
            addInvestorToBlacklistMulti: "ADMIN",
            addMultiInvestorToBlacklistMulti: "ADMIN",
            addInvestorToNewBlacklist: "ADMIN",
            deleteInvestorFromAllBlacklist: "ADMIN",
            deleteInvestorFromAllBlacklistMulti: "ADMIN",
            deleteInvestorFromBlacklist: "ADMIN",
            deleteMultiInvestorsFromBlacklistMulti: "ADMIN"
        },
        RestrictedPartialSaleTM: {
            changeExemptWalletList: "OPERATOR",
            changeExemptWalletListMulti: "OPERATOR"
        },
        VestingEscrowWallet: {
            changeTreasuryWallet: "ONLY_OWNER",
            depositTokens: "ADMIN",
            addTemplate: "ADMIN",
            removeTemplate: "ADMIN",
            addSchedule: "ADMIN",
            addScheduleFromTemplate: "ADMIN",
            modifySchedule: "ADMIN",
            revokeSchedule: "ADMIN",
            revokeAllSchedules: "ADMIN",
            addScheduleMulti: "ADMIN",
            addScheduleFromTemplateMulti: "ADMIN",
            revokeSchedulesMulti: "ADMIN",
            modifyScheduleMulti: "ADMIN",
            sendToTreasury: "OPERATOR",
            pushAvailableTokens: "OPERATOR",
            pushAvailableTokensMulti: "OPERATOR"
        }
    }
}

module.exports = {
    getPermissionList,
    verifyPermission: function (contractName, functionName) {
        let list = getPermissionList();
        try {
            return list[contractName][functionName]
        } catch (e) {
            return undefined
        }
    }
};