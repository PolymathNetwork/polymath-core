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
        LockupVolumeRestrictionTM: {
            addLockup: "ADMIN",
            addLockUpMulti: "ADMIN",
            removeLockUp: "ADMIN",
            modifyLockUp: "ADMIN"
        },
        SingleTradeVolumeRestrictionTM: {
            setAllowPrimaryIssuance: "ADMIN",
            changeTransferLimitToPercentage: "ADMIN",
            changeTransferLimitToTokens: "ADMIN",
            changeGlobalLimitInTokens: "ADMIN",
            changeGlobalLimitInPercentage: "ADMIN",
            addExemptWallet: "ADMIN",
            removeExemptWallet: "ADMIN",
            addExemptWalletMulti: "ADMIN",
            removeExemptWalletMulti: "ADMIN",
            setTransferLimitInTokens: "ADMIN",
            setTransferLimitInPercentage: "ADMIN",
            removeTransferLimitInPercentage: "ADMIN",
            removeTransferLimitInTokens: "ADMIN",
            setTransferLimitInTokensMulti: "ADMIN",
            setTransferLimitInPercentageMulti: "ADMIN",
            removeTransferLimitInTokensMulti: "ADMIN",
            removeTransferLimitInPercentageMulti: "ADMIN"
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