pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module for manually approving or blocking transactions between accounts
 */
contract BlacklisTransferManager is ITransferManager {
    using SafeMath for uint256;

    bytes32 constant ADMIN = "ADMIN";

    struct BlacklistsDetails {
        uint256 startDate;
        uint256 endDate;
        uint256 repeatPeriodInDays;
    }

    //hold the different blacklist corresponds to name of blacklist type
    mapping(bytes32 => BlacklistDetails) blacklists;

    //hold the blacklisted address corresponds to the blacklist type
    mapping(address => bytes32) investorToBlacklist;

    //get list of the addresses for a particular blacklist
    mapping(bytes32 => address[]) blacklistToAddress;

    // Emit when new blacklist type is added
    event AddBlacklistType(uint256 _startDate,uint256 _endDate,bytes32 _name,uint256 _repeatPeriodInDays);
    
    // Emit when there is change in the blacklist type
    event ModifyBlacklistType(uint256 _startDate,uint256 _endDate,bytes32 _name,uint256 _repeatPeriodInDays);
    
    // Emit when the added blacklist type is deleted
    event DeleteBlacklistType(bytes32 _name);

    // Emit when new investor is added to the blacklist type
    event AddInvestorToBlacklist(address _investor,bytes32 _blacklistName);
    

    ///@notice Used to verify the transfer transaction 
    function verifyTransfer(address _from, uint256 /* _amount */, uint256 /* _isTransfer */) public returns(Result) {
        if (investorToBlacklist[_from] != bytes32(0)) {
            uint256 repeater = 
            now.div((blacklists[investorToBlacklist[_from]].endDate
            .sub(blacklists[investorToBlacklist[_from]].startDate))
            .add(blacklists[investorToBlacklist[_from]].repeatPeriodInDays));
            if (blacklists[investorToBlacklist[_from]].endDate.mul(repeater) >= now && blacklists[investorToBlacklist[_from]].startDate.mul(repeater) <= now) {
                return Result.INVALID;
            }
            return Result.VALID;
        } 
        return Result.NA;
    }

    /**
    *@notice Used to add the blacklist type
    *@param _startdate start date of the blacklist type
    *@param _endDate end date of the blacklist type
    *@param _name name of the blacklist type
    *@param _repeatPeriodInDays repeat period of the blacklist type
    */
    function addBlacklistType(uint256 _startDate, uint256 _endDate, bytes32 _name, uint256 _repeatPeriodInDays) public withPerm(ADMIN){
        require(blacklist[_name].endDate == 0 && _name != bytes(0) && _startDate !=0 && _endDate != 0 && _repeatPeriodInDays != 0);
        blacklist[_name] = BlacklistsDetails(_startDate,_endDate,_repeatPeriodInDays);
        emit AddBlacklistType(_startDate, _endDate, _name, _repeatPeriodInDays);
    }

    /**
    *@notice Used to edit the blacklist type
    *@param _startdate start date of the blacklist type
    *@param _endDate end date of the blacklist type
    *@param _name name of the blacklist type
    *@param _repeatPeriodInDays repeat period of the blacklist type
    */
    function modifyBlacklistType(uint256 _startDate, uint256 _endDate, bytes32 _name, uint256 _repeatPeriodInDays) public withPerm(ADMIN){
        require(blacklist[_name].endDate != 0 && _name != bytes(0) && _startDate != 0 && _endDate != 0 && _repeatPeriodInDays != 0);
        blacklist[_name] = BlacklistsDetails(_startDate,_endDate,_repeatPeriodInDays);
        emit ModifyBlacklistType(_startDate, _endDate, _name, _repeatPeriodInDays);
    }

    /**
    *@notice Used to delete the blacklist type
    *@param _name name of the blacklist type
    */
    function deleteBlacklistType(bytes32 _name) public withPerm(ADMIN){
        require(blacklist[_name].endDate != 0);
        delete(blacklist[_name]);
        emit DeleteBlacklistType(_name);
    }

    /**
    *@notice Used to assign the blacklist type to the investor
    *@param _investor address of the investor
    *@param _blacklistName name of the blacklist
    */
    function addInvestorToBlacklist(address _investor, bytes32 _blacklistName) public withPerm(ADMIN){
        require(blacklist[_blacklistName].endDate != 0 && _investor != address(0));
        investorToBlacklist[_investor] = _blacklistName;
        blacklistToAddress[_blacklistName].push(_investor);
        emit AddInvestorToBlacklist(_investor, _blacklistName);
    }

    /**
    *@notice Used to assign the blacklist type to the multiple investor
    *@param _investor address of the investor
    *@param _blacklistName name of the blacklist
    */
    function addInvestorToBlacklistMulti(address[] _investor, bytes32 _blacklistName) public withPerm(ADMIN){
        for(uint8 i = 0; i < _investor.length; i++){
            addInvestorToBlacklist(_investor[i], _blacklistName);
        }
    }

    /**
    *@notice Used to assign the new blacklist type to the investor
    *@param _startdate start date of the blacklist type
    *@param _endDate end date of the blacklist type
    *@param _name name of the blacklist type
    *@param _repeatPeriodInDays repeat period of the blacklist type
    *@param _investor address of the investor
    */
    function addInvestorToNewBlacklist(uint256 _startDate, uint256 _endDate, bytes32 _name, uint256 _repeatPeriodInDays,address _investor) public withPerm(ADMIN){
        addBlacklistType(_startDate, _endDate, _name, _repeatPeriodInDays);
        addInvestorToBlacklist(_investor, _name);
    }

    /**
    *@notice get the list of the investors of a blacklist type
    *@param _blacklistName name of the blacklist type
    */
    function getListofAddresses(bytes32 _blacklistName) public returns(address[]) {
        return blacklistToAddress[_blacklistName];
    }
}
