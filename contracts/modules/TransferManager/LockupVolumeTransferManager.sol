pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract LockupVolumeTransferManager is ITransferManager {

    using SafeMath for uint256;
    
    bytes32 public constant ADMIN = "ADMIN";
    
    struct LockUp {
        uint startTime;
        uint lockUpPeriod;
        uint releaseFrequency;        
        uint lockUpAmount;
    }

    event PrintOut (
        uint _number
    );
    
    event AddLockUp (
        address indexed investor,
        uint startTime,
        uint lockUpPeriod,
        uint releaseFrequency,
        uint lockUpAmount
    );

    mapping (address => LockUp[]) internal investorToLockUps;

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     * @param _polyAddress Address of the polytoken
     */
    constructor (address _securityToken, address _polyAddress)
    public
    Module(_securityToken, _polyAddress)
    {
    }


    /** @notice Used to verify the transfer transaction and prevent locked up tokens from being transferred
     * @param _from Address of the sender
     * @param _amount The amount of tokens to transfer
     * @param _isTransfer Whether or not this is an actual transfer or just a test to see if the tokens would be transferrable
     */
    function verifyTransfer(address  _from, address /* _to*/, uint256  _amount, bytes /* _data */, bool  _isTransfer) public returns(Result) {

        if (!paused) {

            uint currentLockUp = _getInvestorCurrentLockUpAmount(_from);
            uint currentBalance = ISecurityToken(securityToken).balanceOf(_from);
            uint currentAllowTransfer = currentBalance.sub(currentLockUp);
            
            if ( currentAllowTransfer >= _amount) {

                if(!_isTransfer){
                    return Result.VALID;
                }
                
                require(msg.sender == securityToken, "Sender is not securityToken");
                
                return Result.VALID;
            }
            
            return Result.INVALID;
        }
        
        return Result.NA;
    }


    function _getInvestorCurrentLockUpAmount(address _from) internal returns(uint) {
        
        uint investorCurrentLockUpAmount = 0;

        for (uint i = 0; i < investorToLockUps[_from].length; i++) {
            
            LockUp storage aLockUp = investorToLockUps[_from][i];
            
            // if already end of lockup
            uint currentLockUpAmount = 0;

            // lockup not yet start
            if (now <= aLockUp.startTime) {
                currentLockUpAmount = aLockUp.lockUpAmount;
            }

            // inside valid lockup time
            if (now > aLockUp.startTime && now < aLockUp.startTime.add(aLockUp.lockUpPeriod)) {

                // calculate current lockup
                uint elepsedPeriods = now.sub(aLockUp.startTime).div(aLockUp.releaseFrequency);
                uint totalPeriods = aLockUp.lockUpPeriod.div(aLockUp.releaseFrequency);
                uint amountPerPeriod = aLockUp.lockUpAmount.div(totalPeriods);
                uint currentLockUpAmount = totalPeriods.sub(elepsedPeriods).mul(amountPerPeriod);    
            }
            
            investorCurrentLockUpAmount.add(currentLockUpAmount);
        }

        // emit PrintOut(currentlockUpAmount);
        return investorCurrentLockUpAmount;
    }


    function addLockUp(
        address _investor,
        uint _startTime,
        uint _lockUpPeriod,
        uint _releaseFrequency,
        uint _lockUpAmount
        )
        public
        withPerm(ADMIN)
    {

        require(_lockUpPeriod != 0, "lock up period can not be 0");
        require(_releaseFrequency != 0, "release frequency can not be 0");
        require(_lockUpAmount != 0, "lockup amount can not be 0");

        if (_startTime == 0) {
            _startTime = now;
        }

        LockUp memory newLockUp = LockUp(_startTime, _lockUpPeriod, _releaseFrequency, _lockUpAmount);
        investorToLockUps[_investor].push(newLockUp);

        emit AddLockUp(
            _investor,
            _startTime,
            _lockUpPeriod,
            _releaseFrequency,
            _lockUpAmount
        );
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }

    /**
     * @notice Return the permissions flag that are associated with Percentage transfer Manager
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }
}
