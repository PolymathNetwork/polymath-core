function getPermissionList() {
    return {
        ERC20DividendCheckpoint: {
            pushDividendPayment: "DISTRIBUTE",
            pushDividendPaymentToAddresses: "DISTRIBUTE"
        },
        EtherDividendCheckpoint: {
            pushDividendPayment: "DISTRIBUTE",
            pushDividendPaymentToAddresses: "DISTRIBUTE"
        },
        GeneralPermissionManager: {
            addDelegate: "CHANGE_PERMISSION",
            changePermission: "CHANGE_PERMISSION"
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
            addManualBlocking: "TRANSFER_APPROVAL",
            revokeManualApproval: "TRANSFER_APPROVAL",
            revokeManualBlocking: "TRANSFER_APPROVAL"
        },
        PercentageTransferManager: {
            modifyWhitelist: "WHITELIST"
        }
    }
}

module.exports = {
    verifyPermission: function(contractName, functionName) {
        let list = getPermissionList();
        try {
            return list[contractName][functionName]
        } catch (e) {
            return undefined
        }
    }
};