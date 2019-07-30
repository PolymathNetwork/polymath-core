function getPermissionList() {
    return {
        ERC20DividendCheckpoint: {
            pushDividendPayment: "OPERATOR",
            pushDividendPaymentToAddresses: "OPERATOR",
            createCheckpoint: "OPERATOR",
            reclaimDividend: "OPERATOR",
            withdrawWithholding: "OPERATOR",
            setDefaultExcluded: "ADMIN",
            setWithholding: "ADMIN",
            setWithholdingFixed: "ADMIN",
            createDividend: "ADMIN",
            createDividendWithCheckpoint: "ADMIN",
            createDividendWithExclusions: "ADMIN",
            createDividendWithCheckpointAndExclusions: "ADMIN"
        },
        EtherDividendCheckpoint: {
            pushDividendPayment: "OPERATOR",
            pushDividendPaymentToAddresses: "OPERATOR",
            createCheckpoint: "OPERATOR",
            reclaimDividend: "OPERATOR",
            withdrawWithholding: "OPERATOR",
            setDefaultExcluded: "ADMIN",
            setWithholding: "ADMIN",
            setWithholdingFixed: "ADMIN",
            createDividend: "ADMIN",
            createDividendWithCheckpoint: "ADMIN",
            createDividendWithExclusions: "ADMIN",
            createDividendWithCheckpointAndExclusions: "ADMIN"
        },
        GeneralPermissionManager: {
            addDelegate: "ADMIN",
            deleteDelegate: "ADMIN",
            changePermission: "ADMIN",
            changePermissionMulti: "ADMIN"
        },
        USDTieredSTO: {
            modifyFunding: "ONLY_OWNER",
            modifyLimits: "ONLY_OWNER",
            modifyTiers: "ONLY_OWNER",
            modifyTimes: "ONLY_OWNER",
            modifyAddresses: "ONLY_OWNER",
            finalize: "ONLY_OWNER",
            changeNonAccreditedLimit: "ONLY_OWNER",
            changeAllowBeneficialInvestments: "ONLY_OWNER"
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
            changeSigningAddress: "ADMIN",
            changeAllowAllTransfers: "ADMIN",
            changeAllowAllWhitelistTransfers: "ADMIN",
            changeAllowAllWhitelistIssuances: "ADMIN",
            changeAllowAllBurnTransfers: "ADMIN",
            modifyKYCData: "ADMIN",
            modifyKYCDataMulti: "ADMIN",
            modifyInvestorFlag: "ADMIN",
            modifyInvestorFlagMulti: "ADMIN"
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
            addIndividualRestriction: "ADMIN",
            addIndividualRestrictionMulti: "ADMIN",
            addGlobalRestriction: "ADMIN",
            addDailyGlobalRestriction: "ADMIN",
            removeIndividualRestriction: "ADMIN",
            removeIndividualRestrictionMulti: "ADMIN",
            removeGlobalRestriction: "ADMIN",
            removeDailyGlobalRestriction: "ADMIN",
            modifyIndividualRestriction: "ADMIN",
            modifyIndividualRestrictionMulti: "ADMIN",
            modifyGlobalRestriction: "ADMIN",
            modifyDailyGlobalRestriction: "ADMIN"
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
            deleteMultiInvestorsFromBlacklistMulti: "ADMIN",
        },
        VestingEscrowWallet: {
            changeTreasuryWallet: "ONLY_OWNER",
            sendToTreasury: "OPERATOR",
            pushAvailableTokens: "OPERATOR",
            pushAvailableTokensMulti: "OPERATOR",
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
            modifyScheduleMulti: "ADMIN"
        }
    }
}

module.exports = {
    verifyPermission: function (contractName, functionName) {
        let list = getPermissionList();
        try {
            return list[contractName][functionName]
        } catch (e) {
            return undefined
        }
    }
};