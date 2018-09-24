pragma solidity ^0.4.24;
import "./GeneralPermissionManager.sol";
import "../TransferManager/ITransferManager.sol";

/**
 * @title AutomateBlacklist
 * @dev to automate blacklist process
 */
contract AutomateBlacklist is GeneralPermissionManager,ITransferManager {
    
    /**
     * @dev structure for the blacklist period
     */

    struct BlacklistDetails {
        uint256 startDate;
        uint256 endDate;
        uint256 repeats;
    }
 
     /** 
     *@dev to check if msg.sender can add new entry
     */
    modifier isAllowed() {
        require(msg.sender == securityToken || checkPermission(msg.sender,address(this),"1"));
        _;
    }
  /// use to hold the different blacklist corresponds to name of blacklist type 
    mapping(string => BlacklistDetails) blacklists;
/// use to hold the blackListed address corresponds to the blacklist type
    mapping(address => string) inverstorToBlacklist;
/// use to get list of the addresses for a particular blacklist
    mapping(string => address[]) blacklistToAddress;
    
    /**
     * @dev to check if transfer can be made
     */
    function verifyTransfer(address _from, address _to, uint256 _amount, bool _isTransfer) public returns(Result) {

        string storage typeOfBlacklist=inverstorToBlacklist[_from];
        require(bytes(inverstorToBlacklist[_from]).length!=0);
        uint256 repetitions = (now / (blacklists[typeOfBlacklist].endDate - blacklists[typeOfBlacklist].startDate + blacklists[typeOfBlacklist].repeats));
        uint256 newStart = blacklists[typeOfBlacklist].startDate + ((blacklists[typeOfBlacklist].endDate - blacklists[typeOfBlacklist].startDate + blacklists[typeOfBlacklist].repeats) * repetitions);
        uint256 newEnd = blacklists[typeOfBlacklist].endDate + ((blacklists[typeOfBlacklist].endDate - blacklists[typeOfBlacklist].startDate + blacklists[typeOfBlacklist].repeats) * repetitions);

        if (now > newStart && now < newEnd){ return Result.INVALID;}
        return Result.VALID;
    }
     /**
      * @dev to add the new blacklist entry
      * @param {string} _type
      * @param {address} _investor
      * @param {uint256} _start
      * @param {uint256} _end
      * @param {uint256} _repeat
      */
    function addEntry(string _type,address _investor,uint256 _start,uint256 _end,uint256 _repeat) isAllowed() public {
        blacklists[_type]=BlacklistDetails(_start,_end,_repeat);
        inverstorToBlacklist[_investor]=_type;
        blacklistToAddress[_type].push(_investor);
    }
 
     

}