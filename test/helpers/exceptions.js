const PREFIX = "VM Exception while processing transaction: ";
const PREFIX2 = "Returned error: VM Exception while processing transaction: ";

async function tryCatch(promise, message) {
    try {
        await promise;
        throw null;
    } catch (error) {
        assert(error, "Expected an error but did not get one");
        try {
            assert(
                error.message.startsWith(PREFIX + message),
                "Expected an error starting with '" + PREFIX + message + "' but got '" + error.message + "' instead"
            );
        } catch (err) {
            assert(
                error.message.startsWith(PREFIX2 + message),
                "Expected an error starting with '" + PREFIX + message + "' but got '" + error.message + "' instead"
            );
        }
    }
}

module.exports = {
    catchRevert: async function(promise) {
        await tryCatch(promise, "revert");
    },
    catchPermission: async function(promise) {
        await tryCatch(promise, "revert Permission check failed");
    },
    catchOutOfGas: async function(promise) {
        await tryCatch(promise, "out of gas");
    },
    catchInvalidJump: async function(promise) {
        await tryCatch(promise, "invalid JUMP");
    },
    catchInvalidOpcode: async function(promise) {
        await tryCatch(promise, "invalid opcode");
    },
    catchStackOverflow: async function(promise) {
        await tryCatch(promise, "stack overflow");
    },
    catchStackUnderflow: async function(promise) {
        await tryCatch(promise, "stack underflow");
    },
    catchStaticStateChange: async function(promise) {
        await tryCatch(promise, "static state change");
    }
};
