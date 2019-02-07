function getPermissionList() {
    return {
        ERC20DividendCheckpoint: {
            pushDividendPayment: "DISTRIBUTE",
            pushDividendPaymentToAddresses: "DISTRIBUTE",
            setDefaultExcluded: "MANAGE",
            setWithholding: "MANAGE",
            setWithholdingFixed: "MANAGE",
            createDividend: "MANAGE",
            createDividendWithCheckpoint: "MANAGE",
            createDividendWithExclusions: "MANAGE",
            createDividendWithCheckpointAndExclusions: "MANAGE",
            reclaimDividend: "MANAGE",
            withdrawWithholding: "MANAGE",
            createCheckpoint: "CHECKPOINT"
        },
        EtherDividendCheckpoint: {
            pushDividendPayment: "DISTRIBUTE",
            pushDividendPaymentToAddresses: "DISTRIBUTE",
            setDefaultExcluded: "MANAGE",
            setWithholding: "MANAGE",
            setWithholdingFixed: "MANAGE",
            createDividend: "MANAGE",
            createDividendWithCheckpoint: "MANAGE",
            createDividendWithExclusions: "MANAGE",
            createDividendWithCheckpointAndExclusions: "MANAGE",
            reclaimDividend: "MANAGE",
            withdrawWithholding: "MANAGE",
            createCheckpoint: "CHECKPOINT"
        },
        GeneralPermissionManager: {
            addDelegate: "CHANGE_PERMISSION",
            changePermission: "CHANGE_PERMISSION",
            changePermissionMulti: "CHANGE_PERMISSION"
        },
        USDTieredSTO: {
            modifyFunding: "ONLY_OWNER",
            modifyLimits: "ONLY_OWNER",
            modifyTiers: "ONLY_OWNER",
            modifyAddresses: "ONLY_OWNER",
            finalize: "ONLY_OWNER",
            changeAccredited: "ONLY_OWNER"
        },
        PreSaleSTO: {
            allocateTokens: "PRE_SALE_ADMIN",
            allocateTokensMulti: "PRE_SALE_ADMIN"
        },
        CountTransferManager: {
            changeHolderCount: "ADMIN"
        },
        GeneralTransferManager: {
            changeIssuanceAddress: "FLAGS",
            changeSigningAddress: "FLAGS",
            changeAllowAllTransfers: "FLAGS",
            changeAllowAllWhitelistTransfers: "FLAGS",
            changeAllowAllWhitelistIssuances: "FLAGS",
            changeAllowAllBurnTransfers: "FLAGS",
            modifyWhitelist: "WHITELIST",
            modifyWhitelistMulti: "WHITELIST"
        },
        ManualApprovalTransferManager: {
            addManualApproval: "TRANSFER_APPROVAL",
            revokeManualApproval: "TRANSFER_APPROVAL",
        },
        PercentageTransferManager: {
            modifyWhitelist: "WHITELIST",
            modifyWhitelistMulti: "WHITELIST",
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
            depositTokens: "ADMIN",
            sendToTreasury: "ADMIN",
            pushAvailableTokens: "ADMIN",
            addTemplate: "ADMIN",
            removeTemplate: "ADMIN",
            addSchedule: "ADMIN",
            addScheduleFromTemplate: "ADMIN",
            modifySchedule: "ADMIN",
            revokeSchedule: "ADMIN",
            revokeAllSchedules: "ADMIN",
            pushAvailableTokensMulti: "ADMIN",
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