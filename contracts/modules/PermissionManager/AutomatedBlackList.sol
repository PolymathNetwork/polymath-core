pragma solidity ^0.4.24;
import "../Module.sol";
import "../TransferManager/ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
/**
 * @title AutomateBlacklist
 * @dev to automate blacklist process
 */
contract AutomateBlacklist is Module,ITransferManager {
    using SafeMath for uint256;
    /**
     * @dev structure for the blacklist period
     */

    struct BlacklistDetails {
        uint256 startDate;
        uint256 endDate;
        uint256 repeats;
    }
    //Flag has to be set
    bytes32 public constant PERMISSION_FLAG = "FLAG";
  /// use to hold the different blacklist corresponds to name of blacklist type 
    mapping(string => BlacklistDetails) blacklists;
/// use to hold the blackListed address corresponds to the blacklist type
    mapping(address => string) inverstorToBlacklist;
/// use to get list of the addresses for a particular blacklist
    mapping(string => address[]) _blackListName;
    
    /**
     * @dev to check if transfer can be made
     */
    function verifyTransfer(address _from, address _to, uint256 _amount, bool _isTransfer) public withPerm(PERMISSION_FLAG)  returns(Result) {

        string storage typeOfBlacklist=inverstorToBlacklist[_from];
        require(bytes(inverstorToBlacklist[_from]).length!=0);
        uint256 repetitions = (now / (blacklists[typeOfBlacklist].endDate - blacklists[typeOfBlacklist].startDate + blacklists[typeOfBlacklist].repeats));
        uint256 newStart = blacklists[typeOfBlacklist].startDate + ((blacklists[typeOfBlacklist].endDate - blacklists[typeOfBlacklist].startDate + blacklists[typeOfBlacklist].repeats) * repetitions);
        uint256 newEnd = blacklists[typeOfBlacklist].endDate + ((blacklists[typeOfBlacklist].endDate - blacklists[typeOfBlacklist].startDate + blacklists[typeOfBlacklist].repeats) * repetitions);

        if (now > newStart && now < newEnd){ return Result.INVALID;}
        return Result.VALID;
    }
 
 
    function addBlackListType(uint256 _startDate, uint256 _endDate, string _name, uint256 _repeatPeriodInDays) {
       blacklists[_name]=BlacklistDetails(_startDate,_endDate,_repeatPeriodInDays);
    }
    function addInvestorToBlackList(address _investor, string _blackListName) {
       inverstorToBlacklist[_investor]=_blackListName;
       _blackListName[_blackListName].push(_investor);
    }

 
     

}