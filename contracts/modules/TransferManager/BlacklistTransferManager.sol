pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module to automate blacklist to restrict transfer
 */
contract BlacklistTransferManager is ITransferManager {
    using SafeMath for uint256;

    bytes32 public constant ADMIN = "ADMIN";
    
    struct BlacklistsDetails {
        uint256 startTime;
        uint256 endTime;
        uint256 repeatPeriodTime;
    }

    //hold the different blacklist corresponds to name of blacklist type
    mapping(bytes32 => BlacklistsDetails) blacklists;

    //hold the blacklisted address corresponds to the blacklist type
    mapping(address => bytes32[]) investorToBlacklist;

    //get list of the addresses for a particular blacklist
    mapping(bytes32 => address[]) blacklistToInvestor;

    //store the index of the investor to blacklist
    mapping(address => mapping(bytes32 => uint256)) investorToIndex;

    //store the index of the blacklist to investor
    mapping(bytes32 => mapping(address => uint256)) blacklistToIndex;

    //store the investor to blacklist status
    mapping(address => mapping(bytes32 => bool)) investorBlacklistStatus;
   
    // Emit when new blacklist type is added
    event AddBlacklistType(
        uint256 _startTime, 
        uint256 _endTime, 
        bytes32 _name, 
        uint256 _repeatPeriodTime
    );
    
    // Emit when there is change in the blacklist type
    event ModifyBlacklistType(
        uint256 _startTime,
        uint256 _endTime, 
        bytes32 _name, 
        uint256 _repeatPeriodTime
    );
    
    // Emit when the added blacklist type is deleted
    event DeleteBlacklistType(
        bytes32 _name
    );

    // Emit when new investor is added to the blacklist type
    event AddInvestorToBlacklist(
        address _investor, 
        bytes32 _blacklistName
    );
    
    // Emit when investor is deleted from the blacklist type
    event DeleteInvestorFromBlacklist(
        address _investor,
        bytes32 _blacklist
    );

   
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

    /**
    * @notice This function returns the signature of configure function
    */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(0);
    }


    /** 
    * @notice Used to verify the transfer transaction
    * @param _from Address of the sender
    * @dev Restrict the blacklist address to transfer token 
    * if the current time is in the time frame define for the 
    * blacklist type associated with the blacklist address
    */
    function verifyTransfer(address _from, address /* _to */, uint256 /* _amount */, bytes /* _data */, bool /* _isTransfer */) public returns(Result) {
        if (!paused) {
            if (investorToBlacklist[_from].length != 0) {
                for (uint256 i = 0; i < investorToBlacklist[_from].length; i++) {
                    uint256 endTimeTemp = blacklists[investorToBlacklist[_from][i]].endTime;
                    uint256 startTimeTemp = blacklists[investorToBlacklist[_from][i]].startTime;
                    uint256 repeatPeriodTimeTemp = blacklists[investorToBlacklist[_from][i]].repeatPeriodTime * 1 days;
                    // blacklistTime time is used to find the new startTime and endTime 
                    // suppose startTime=500,endTime=1500,repeatPeriodTime=500 then blacklistTime =1500
                    // if you add blacklistTime to startTime and endTime i.e startTime = 2000 and endTime = 3000
                    uint256 blacklistTime = (endTimeTemp.sub(startTimeTemp)).add(repeatPeriodTimeTemp);
                    if (now > startTimeTemp) {
                    // Find the repeating parameter that will be used to calculate the new startTime and endTime
                    // based on the new current time value   
                        uint256 repeater = (now.sub(startTimeTemp)).div(blacklistTime); 
                        if (startTimeTemp.add(blacklistTime.mul(repeater)) <= now && endTimeTemp.add(blacklistTime.mul(repeater)) >= now) {
                            return Result.INVALID;
                        }    
                    }   
                }    
            }     
        }
        return Result.NA;
    }

    /**
    * @notice Used to add the blacklist type
    * @param _startTime start date of the blacklist type
    * @param _endTime end date of the blacklist type
    * @param _name name of the blacklist type
    * @param _repeatPeriodTime repeat period of the blacklist type
    */
    function addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _name, uint256 _repeatPeriodTime) public withPerm(ADMIN) {
        require(blacklists[_name].endTime == 0, "Blacklist type already exist"); 
        _validParams(_startTime, _endTime, _name, _repeatPeriodTime);
        blacklists[_name] = BlacklistsDetails(_startTime, _endTime, _repeatPeriodTime);
        emit AddBlacklistType(_startTime, _endTime, _name, _repeatPeriodTime);
    }
    
    /**
     * @notice Internal function 
     */
    function _validParams(uint256 _startTime, uint256 _endTime, bytes32 _name, uint256 _repeatPeriodTime) internal pure {
        require(_name != bytes32(0), "Invalid blacklist name"); 
        require(_startTime != 0 && _startTime < _endTime, "Invalid start or end date");
        require(_repeatPeriodTime != 0, "Invalid repeat days");
    }

    /**
    * @notice Used to edit the blacklist type
    * @param _startTime start date of the blacklist type
    * @param _endTime end date of the blacklist type
    * @param _name name of the blacklist type
    * @param _repeatPeriodTime repeat period of the blacklist type
    */
    function modifyBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _name, uint256 _repeatPeriodTime) public withPerm(ADMIN) {
        require(blacklists[_name].endTime != 0, "Blacklist type doesn't exist"); 
        _validParams(_startTime, _endTime, _name, _repeatPeriodTime);
        blacklists[_name] = BlacklistsDetails(_startTime, _endTime, _repeatPeriodTime);
        emit ModifyBlacklistType(_startTime, _endTime, _name, _repeatPeriodTime);
    }

    /**
    * @notice Used to delete the blacklist type
    * @param _name name of the blacklist type
    */
    function deleteBlacklistType(bytes32 _name) public withPerm(ADMIN) {
        require(blacklists[_name].endTime != 0, "Blacklist type doesn’t exist");
        require(blacklistToInvestor[_name].length == 0, "Investors are associated with the blacklist");
        // delete blacklist type 
        delete(blacklists[_name]);
        emit DeleteBlacklistType(_name);
    }

    /**
    * @notice Used to assign the blacklist type to the investor
    * @param _investor address of the investor
    * @param _blacklistName name of the blacklist
    */
    function addInvestorToBlacklist(address _investor, bytes32 _blacklistName) public withPerm(ADMIN) {
        require(blacklists[_blacklistName].endTime != 0, "Blacklist type doesn't exist");
        require(_investor != address(0), "Invalid investor address");
        require(!investorBlacklistStatus[_investor][_blacklistName],"Investor already associated to the same blacklist");
        uint256 investorIndex = investorToBlacklist[_investor].length;
        // Add blacklist index to the investor 
        investorToIndex[_investor][_blacklistName] = investorIndex;
        uint256 blacklistIndex = blacklistToInvestor[_blacklistName].length;
        // Add investor index to the blacklist
        blacklistToIndex[_blacklistName][_investor] = blacklistIndex;
        investorToBlacklist[_investor].push(_blacklistName);
        blacklistToInvestor[_blacklistName].push(_investor);
        investorBlacklistStatus[_investor][_blacklistName] = true;
        emit AddInvestorToBlacklist(_investor, _blacklistName);
    }

    /**
    * @notice Used to delete the investor from the all associated blacklists
    * @param _investor address of the investor
    */
    function deleteInvestorFromAllBlacklist(address _investor) public withPerm(ADMIN) {
        require(_investor != address(0), "Invalid investor address");
        require(investorToBlacklist[_investor].length != 0, "Investor is not associated to any blacklist type");
        for(uint256 i = 0; i < investorToBlacklist[_investor].length; i++){
            deleteInvestorFromBlacklist(_investor, investorToBlacklist[_investor][i]);
        }
    }

    /**
    * @notice Used to delete the investor from the blacklist
    * @param _investor address of the investor
    * @param _blacklistName name of the blacklist
    */
    function deleteInvestorFromBlacklist(address _investor, bytes32 _blacklistName) public withPerm(ADMIN) {
        require(_investor != address(0), "Invalid investor address");
        require(_blacklistName != bytes32(0),"Invalid blacklist name");
        require(investorBlacklistStatus[_investor][_blacklistName],"Investor not associated to the blacklist");
        // delete the investor from the blacklist type
        uint256 _blacklistIndex = blacklistToIndex[_blacklistName][_investor];
        uint256 _len = blacklistToInvestor[_blacklistName].length;
        if ( _blacklistIndex != _len) {
            blacklistToInvestor[_blacklistName][_blacklistIndex] = blacklistToInvestor[_blacklistName][_len - 1];
            blacklistToIndex[_blacklistName][blacklistToInvestor[_blacklistName][_blacklistIndex]] = _blacklistIndex;
        }
        blacklistToInvestor[_blacklistName].length--;
        // delete the investor index from the blacklist
        delete(blacklistToIndex[_blacklistName][_investor]);
        // delete the blacklist from the investor
        uint256 _investorIndex = investorToIndex[_investor][_blacklistName];
        _len = investorToBlacklist[_investor].length;
        if ( _investorIndex != _len) {
            investorToBlacklist[_investor][_investorIndex] = investorToBlacklist[_investor][_len - 1];
            investorToIndex[_investor][investorToBlacklist[_investor][_investorIndex]] = _investorIndex;
        }
        investorToBlacklist[_investor].length--;
        // delete the blacklist index from the invetsor
        investorBlacklistStatus[_investor][_blacklistName] = false;
        delete(investorToIndex[_investor][_blacklistName]);
        emit DeleteInvestorFromBlacklist(_investor, _blacklistName);
    }

    /**
    * @notice Used to assign the blacklist type to the multiple investor
    * @param _investor address of the investor
    * @param _blacklistName name of the blacklist
    */
    function addInvestorToBlacklistMulti(address[] _investor, bytes32 _blacklistName) public withPerm(ADMIN){
        for(uint256 i = 0; i < _investor.length; i++){
            addInvestorToBlacklist(_investor[i], _blacklistName);
        }
    }

    /**
    * @notice Used to assign the new blacklist type to the investor
    * @param _startTime start date of the blacklist type
    * @param _endTime end date of the blacklist type
    * @param _name name of the blacklist type
    * @param _repeatPeriodTime repeat period of the blacklist type
    * @param _investor address of the investor
    */
    function addInvestorToNewBlacklist(uint256 _startTime, uint256 _endTime, bytes32 _name, uint256 _repeatPeriodTime, address _investor) public withPerm(ADMIN){
        addBlacklistType(_startTime, _endTime, _name, _repeatPeriodTime);
        addInvestorToBlacklist(_investor, _name);
    }

    /**
    * @notice get the list of the investors of a blacklist type
    * @param _blacklistName name of the blacklist type
    */
    function getListOfAddresses(bytes32 _blacklistName) public view returns(address[]) {
        require(blacklists[_blacklistName].endTime != 0, "Blacklist type doesn't exist");
        return blacklistToInvestor[_blacklistName];
    }

    /**
    * @notice Return the permissions flag that are associated with general transfer manager
    */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }
}


