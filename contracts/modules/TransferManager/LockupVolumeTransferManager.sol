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
        uint totalLockUp;
    }

    event PrintOut (
        uint _number
    );
    
    event AddLockUp (
        address indexed investor,
        uint startTime,
        uint lockUpPeriod,
        uint releaseFrequency,
        uint totalLockUp
    );

    mapping (address => LockUp[]) internal investerToLockUps;

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

            uint currentLockUp = _calculateCurrentLockUp(_from);            
            uint currentBalance = ISecurityToken(securityToken).balanceOf(_from);
            uint allowTransfer = currentBalance.sub(currentLockUp);
            
            if ( allowTransfer >= _amount) {

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


    function _calculateCurrentLockUp(address _from) internal returns(uint) {
        
        uint totalCurrentLockUp = 0;

        for (uint i = 0; i < investerToLockUps[_from].length; i++) {
            
            LockUp storage aLockUp = investerToLockUps[_from][i];

            // only active lockup
            if (now >= aLockUp.startTime && now <= aLockUp.startTime.add(aLockUp.lockUpPeriod)) {

                // calculate current lockup
                uint elepsedPeriods = now.sub(aLockUp.startTime).div(aLockUp.releaseFrequency);
                uint totalPeriods = aLockUp.lockUpPeriod.div(aLockUp.releaseFrequency);
                uint amountPerPeriod = aLockUp.totalLockUp.div(totalPeriods);
                uint currentLockUp = totalPeriods.sub(elepsedPeriods).mul(amountPerPeriod);

                // accumulate current lockup
                totalCurrentLockUp.add(currentLockUp);
            }
        }

        // emit PrintOut(currentTotalLockUp);
        return totalCurrentLockUp;
    }


    function addLockUp(
        address _investor,
        uint _startTime,
        uint _lockUpPeriod,
        uint _releaseFrequency,
        uint _totalLockUp
        )
        public
        withPerm(ADMIN)
    {
        if (_startTime == 0) {
            _startTime = now;
        }

        LockUp memory newLockUp = LockUp(_startTime, _lockUpPeriod, _releaseFrequency, _totalLockUp);
        investerToLockUps[_investor].push(newLockUp);

        emit AddLockUp(
            _investor,
            _startTime,
            _lockUpPeriod,
            _releaseFrequency,
            _totalLockUp
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
