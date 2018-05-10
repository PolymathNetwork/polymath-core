pragma solidity ^0.4.23;

import "./ITransferManager.sol";

contract CountTransferManager is ITransferManager {

    uint256 public maxHolderCount;

    event LogModifyHolderCount(uint256 _oldHolderCount, uint256 _newHolderCount);

    constructor (address _securityToken, address _polyAddress)
    public
    IModule(_securityToken, _polyAddress)
    {
    }

    function verifyTransfer(address /* _from */, address _to, uint256 /* _amount */) public view returns(Result) {
        if (!paused) {
            if (maxHolderCount < ISecurityToken(securityToken).investorCount()) {
                // Allow trannsfers to existing maxHolders
                if (ISecurityToken(securityToken).balanceOf(_to) != 0) {
                    return Result.VALID;
                }
                return Result.INVALID;
            }
            return Result.NA;
        }
        return Result.NA;
    }

    function configure(uint256 _maxHolderCount) public onlyFactory {
        maxHolderCount = _maxHolderCount;
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(keccak256("configure(uint256)"));
    }

    function changeHolderCount(uint256 _maxHolderCount) public onlyOwner {
        emit LogModifyHolderCount(maxHolderCount, _maxHolderCount);
        maxHolderCount = _maxHolderCount;
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

}
