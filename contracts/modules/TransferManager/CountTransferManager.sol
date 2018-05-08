pragma solidity ^0.4.23;

import "./ITransferManager.sol";

contract CountTransferManager is ITransferManager {

    uint256 public holderCount;

    event LogModifyHolderCount(uint256 _oldHolderCount, uint256 _newHolderCount);

    constructor (address _securityToken, address _polyAddress)
    public
    IModule(_securityToken, _polyAddress)
    {
    }

    function verifyTransfer(address _from, address _to, uint256 _amount) public view returns(bool) {
        require(holderCount <= ISecurityToken(securityToken).investorCount());
        return true;
    }

    function configure(uint256 _holderCount) public onlyFactory {
        holderCount = _holderCount;
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(keccak256("configure(uint256)"));
    }

    function changeHolderCount(uint256 _holderCount) public onlyOwner {
        emit LogModifyHolderCount(holderCount, _holderCount);
        holderCount = _holderCount;
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

}
