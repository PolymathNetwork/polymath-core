pragma solidity ^0.4.23;

import "./ITransferManager.sol";
import "../Fund/ISimpleDaicoFund.sol";

/////////////////////
// Module permissions
/////////////////////

contract SimpleDaicoTransferManager is ITransferManager {

    ISimpleDaicoFund public daicoContract;

    constructor (address _securityToken,address _polyAddress) public IModule(_securityToken, _polyAddress) {}

    function verifyTransfer(address _from, address _to, uint256 _amount) public view returns(Result) {
        if (!paused) {
            return (daicoContract.callOnTransfer(_from,_to,_amount) ? Result.VALID : Result.NA);
        }
        return Result.NA;
    }

    function configure(address _daicoContract) public onlyFactory {
        daicoContract = ISimpleDaicoFund(_daicoContract);
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(keccak256("configure(address)"));
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

}
