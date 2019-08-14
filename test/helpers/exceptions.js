async function tryCatch(promise, expectedError) {
    try {
        await promise;
    } catch (error) {
        if (error.message.indexOf(expectedError) === -1) {
        throw Error(`Wrong failure type, expected '${expectedError}' and got '${error.message}'`);
        }
        return;
    }

    throw Error('Expected failure not received');
}

module.exports = {
    catchRevert: async function(promise, message = 'revert') {
        await tryCatch(promise, message);
    },
    catchPermission: async function(promise) {
        await tryCatch(promise, "revert Permission check failed");
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
