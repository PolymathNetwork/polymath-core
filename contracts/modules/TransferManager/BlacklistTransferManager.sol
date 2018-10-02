pragma solidity ^0.4.24;

import "./ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module for manually approving or blocking transactions between accounts
 */
contract BlacklistTransferManager is ITransferManager {
    using SafeMath for uint256;

    bytes32 public constant ADMIN = "ADMIN";
    
    struct BlacklistsDetails {
        uint256 startDate;
        uint256 endDate;
        uint256 repeatPeriodInDays;
    }

    //hold the different blacklist corresponds to name of blacklist type
    mapping(bytes32 => BlacklistsDetails) blacklists;

    //hold the blacklisted address corresponds to the blacklist type
    mapping(address => bytes32) investorToBlacklist;

    //get list of the addresses for a particular blacklist
    mapping(bytes32 => address[]) blacklistToAddress;

    // Emit when new blacklist type is added
    event AddBlacklistType(
        uint256 _startDate, 
        uint256 _endDate, 
        bytes32 _name, 
        uint256 _repeatPeriodInDays
    );
    
    // Emit when there is change in the blacklist type
    event ModifyBlacklistType(
        uint256 _startDate,
        uint256 _endDate, 
        bytes32 _name, 
        uint256 _repeatPeriodInDays
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
    event DeleteInvestorFromBlacklistType(
        address _investor
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


    /// @notice Used to verify the transfer transaction 
    function verifyTransfer(address _from, address /* _to */, uint256 /* _amount */, bool /* _isTransfer */) public returns(Result) {
        if(!paused){
            if (investorToBlacklist[_from] != bytes32(0)) {
                uint256 blacklistDate = ((blacklists[investorToBlacklist[_from]].endDate)
                .sub(blacklists[investorToBlacklist[_from]].startDate))
                .add(blacklists[investorToBlacklist[_from]].repeatPeriodInDays * 1 days);
                uint256 repeater = now.div((blacklists[investorToBlacklist[_from]].endDate)
                .add(blacklists[investorToBlacklist[_from]].repeatPeriodInDays * 1 days));
                if ((blacklists[investorToBlacklist[_from]].startDate).add(blacklistDate.mul(repeater)) <= now && (blacklists[investorToBlacklist[_from]].endDate).add(blacklistDate.mul(repeater)) >= now) {
                    return Result.INVALID;
                }
                return Result.VALID;
            } 
            return Result.NA;
        }
        return Result.NA;
    }

    /**
    * @notice Used to add the blacklist type
    * @param _startDate start date of the blacklist type
    * @param _endDate end date of the blacklist type
    * @param _name name of the blacklist type
    * @param _repeatPeriodInDays repeat period of the blacklist type
    */
    function addBlacklistType(uint256 _startDate, uint256 _endDate, bytes32 _name, uint256 _repeatPeriodInDays) public withPerm(ADMIN){
        require(blacklists[_name].endDate == 0, "Blacklist type already exist"); 
        _validParams(_startDate, _endDate, _name, _repeatPeriodInDays);
        blacklists[_name] = BlacklistsDetails(_startDate, _endDate, _repeatPeriodInDays);
        emit AddBlacklistType(_startDate, _endDate, _name, _repeatPeriodInDays);
    }
    
    /**
     * @notice Internal function 
     */
    function _validParams(uint256 _startDate, uint256 _endDate, bytes32 _name, uint256 _repeatPeriodInDays) internal view {
        require(_name != bytes32(0), "Invalid blacklist name"); 
        require(_startDate > now && _startDate < _endDate, "Invalid start or end date");
        require(_repeatPeriodInDays != 0, "Invalid repeat days");
    }

    /**
    * @notice Used to edit the blacklist type
    * @param _startDate start date of the blacklist type
    * @param _endDate end date of the blacklist type
    * @param _name name of the blacklist type
    * @param _repeatPeriodInDays repeat period of the blacklist type
    */
    function modifyBlacklistType(uint256 _startDate, uint256 _endDate, bytes32 _name, uint256 _repeatPeriodInDays) public withPerm(ADMIN){
        require(blacklists[_name].endDate != 0, "Blacklist type doesn't exist"); 
        _validParams(_startDate, _endDate, _name, _repeatPeriodInDays);
        blacklists[_name] = BlacklistsDetails(_startDate, _endDate, _repeatPeriodInDays);
        emit ModifyBlacklistType(_startDate, _endDate, _name, _repeatPeriodInDays);
    }

    /**
    * @notice Used to delete the blacklist type
    * @param _name name of the blacklist type
    */
    function deleteBlacklistType(bytes32 _name) public withPerm(ADMIN){
        require(blacklists[_name].endDate != 0, "Blacklist type doesn’t exist");
        require(blacklistToAddress[_name].length == 0, "Investors are associated with the blacklist");
        delete(blacklists[_name]);
        emit DeleteBlacklistType(_name);
    }

    /**
    * @notice Used to assign the blacklist type to the investor
    * @param _investor address of the investor
    * @param _blacklistName name of the blacklist
    */
    function addInvestorToBlacklist(address _investor, bytes32 _blacklistName) public withPerm(ADMIN){
        require(blacklists[_blacklistName].endDate != 0, "Blacklist type doesn't exist");
        require(_investor != address(0), "Invalid investor address");
        require(investorToBlacklist[_investor] == bytes32(0), "Investor already associated to blacklist type");
        investorToBlacklist[_investor] = _blacklistName;
        blacklistToAddress[_blacklistName].push(_investor);
        emit AddInvestorToBlacklist(_investor, _blacklistName);
    }

     /**
    * @notice Used to delete the investor from the blacklist type
    * @param _investor address of the investor
    */
    function deleteInvestorFromBlacklist(address _investor) public withPerm(ADMIN){
        require(_investor != address(0), "Invalid investor address");
        require(investorToBlacklist[_investor] != bytes32(0), "Investor not associated to blacklist type");
        for(uint256 i = 0; i < blacklistToAddress[investorToBlacklist[_investor]].length; i++){
            if(blacklistToAddress[investorToBlacklist[_investor]][i] == _investor){
                delete(blacklistToAddress[investorToBlacklist[_investor]][i]);
            }
        }
        delete(investorToBlacklist[_investor]);
        emit DeleteInvestorFromBlacklistType(_investor);
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
    * @param _startDate start date of the blacklist type
    * @param _endDate end date of the blacklist type
    * @param _name name of the blacklist type
    * @param _repeatPeriodInDays repeat period of the blacklist type
    * @param _investor address of the investor
    */
    function addInvestorToNewBlacklist(uint256 _startDate, uint256 _endDate, bytes32 _name, uint256 _repeatPeriodInDays,address _investor) public withPerm(ADMIN){
        addBlacklistType(_startDate, _endDate, _name, _repeatPeriodInDays);
        addInvestorToBlacklist(_investor, _name);
    }

    /**
    * @notice get the list of the investors of a blacklist type
    * @param _blacklistName name of the blacklist type
    */
    function getListofAddresses(bytes32 _blacklistName) public view returns(address[]) {
        require(blacklists[_blacklistName].endDate != 0, "Blacklist type doesn't exist");
        return blacklistToAddress[_blacklistName];
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


