pragma solidity 0.5.8;

library StatusCodes {

    // ERC1400 status code inspired from ERC1066
    enum Status {
        TransferFailure,
        TransferSuccess,
        InsufficientBalance,
        InsufficientAllowance,
        TransfersHalted,
        FundsLocked,
        InvalidSender,
        InvalidReceiver,
        InvalidOperator
    }

    function code(Status _status) internal pure returns (byte) {
        return byte(uint8(0x50) + (uint8(_status)));
    }
}
