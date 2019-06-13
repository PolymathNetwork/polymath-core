pragma solidity 0.5.8;

import "../oracles/PolyOracle.sol";

contract MockPolyOracle is PolyOracle {
    constructor() public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

}
