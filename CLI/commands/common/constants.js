module.exports = Object.freeze({
    MODULES_TYPES: {
        PERMISSION: 1,
        TRANSFER: 2,
        STO: 3,
        DIVIDENDS: 4,
        BURN: 5
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
    ADDRESS_ZERO: '0x0000000000000000000000000000000000000000'
});