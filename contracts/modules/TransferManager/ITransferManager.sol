pragma solidity ^0.4.23;

import "../../interfaces/IPausable.sol";
import "../../interfaces/IModule.sol";

contract ITransferManager is IModule, IPausable {

    //If verifyTransfer returns:
    //  INVALID, then the transfer should not be allowed regardless of other TM results
    //  NA, then the result from this TM is ignored
    //  VALID, then the transfer is valid for this TM
    enum Result {INVALID, NA, VALID}

    function verifyTransfer(address _from, address _to, uint256 _amount, bool _isTransfer) public returns(Result);

    function unpause() onlyOwner public {
        super._unpause();
    }

    function pause() onlyOwner public {
        super._pause();
    }
}
