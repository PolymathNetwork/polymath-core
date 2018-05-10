pragma solidity ^0.4.23;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract PercentageTransferManager is ITransferManager {
    using SafeMath for uint256;

    uint256 public holderPercentage; // percentage multiplied by 10**16 - e.g. 20% is 20 * 10**16

    event LogModifyHolderPercentage(uint256 _oldHolderPercentage, uint256 _newHolderPercentage);

    constructor (address _securityToken, address _polyAddress)
    public
    IModule(_securityToken, _polyAddress)
    {
    }

    function verifyTransfer(address /* _from */, address _to, uint256 _amount) public view returns(Result) {
        if (!paused) {
            uint256 newBalance = ISecurityToken(securityToken).balanceOf(_to).add(_amount);
            if (newBalance.mul(10**18).div(ISecurityToken(securityToken).totalSupply()) > holderPercentage) {
                return Result.INVALID;
            }
        }
        return Result.NA;
    }

    function configure(uint256 _holderPercentage) public onlyFactory {
        holderPercentage = _holderPercentage;
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(keccak256("configure(uint256)"));
    }

    function changeHolderPercentage(uint256 _holderPercentage) public onlyOwner {
        emit LogModifyHolderPercentage(holderPercentage, _holderPercentage);
        holderPercentage = _holderPercentage;
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

}
