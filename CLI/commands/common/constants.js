module.exports = Object.freeze({
    MODULES_TYPES: {
        PERMISSION: 1,
        TRANSFER: 2,
        STO: 3,
        DIVIDENDS: 4,
        BURN: 5,
        WALLET: 7
    },
    DURATION: {
        seconds: function (val) {
            return val
        },
        minutes: function (val) {
            return val * this.seconds(60)
        },
        hours: function (val) {
            return val * this.minutes(60)
        },
        days: function (val) {
            return val * this.hours(24)
        },
        weeks: function (val) {
            return val * this.days(7)
        },
        years: function (val) {
            return val * this.days(365)
        }
    },
    FUND_RAISE_TYPES: {
        ETH: 0,
        POLY: 1,
        STABLE: 2
    },
    DEFAULT_BATCH_SIZE: 75,
    ADDRESS_ZERO: '0x0000000000000000000000000000000000000000',
    TRASFER_RESULT: {
        INVALID: '0',
        NA: '1',
        VALID: '2',
        FORCE_VALID: '3'
    },
    TRANSFER_STATUS_CODES: {
        TransferFailure: '0x50',
        TransferSuccess: '0x51',
        InsufficientBalance: '0x52',
        InsufficientAllowance: '0x53',
        TransfersHalted: '0x54',
        FundsLocked: '0x55',
        InvalidSender: '0x56',
        InvalidReceiver: '0x57',
        InvalidOperator: '0x58'
    }
});
