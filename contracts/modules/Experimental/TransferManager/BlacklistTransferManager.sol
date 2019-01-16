pragma solidity ^0.5.0;

import "../../TransferManager/TransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module to automate blacklist and restrict transfers
 */
contract BlacklistTransferManager is TransferManager {
    using SafeMath for uint256;

    bytes32 public constant ADMIN = "ADMIN";

    struct BlacklistsDetails {
        uint256 startTime;
        uint256 endTime;
        uint256 repeatPeriodTime;
    }

    //hold the different blacklist details corresponds to its name
    mapping(bytes32 => BlacklistsDetails) public blacklists;

    //hold the different name of blacklist corresponds to a investor
    mapping(address => bytes32[]) investorToBlacklist;

    //get list of the addresses for a particular blacklist
    mapping(bytes32 => address[]) blacklistToInvestor;

    //mapping use to store the indexes for different blacklist types for a investor
    mapping(address => mapping(bytes32 => uint256)) investorToIndex;

    //mapping use to store the indexes for different investor for a blacklist type
    mapping(bytes32 => mapping(address => uint256)) blacklistToIndex;

    bytes32[] allBlacklists;

    // Emit when new blacklist type is added
    event AddBlacklistType(
        uint256 _startTime,
        uint256 _endTime,
        bytes32 _blacklistName,
        uint256 _repeatPeriodTime
    );

    // Emit when there is a change in the blacklist type
    event ModifyBlacklistType(
        uint256 _startTime,
        uint256 _endTime,
        bytes32 _blacklistName,
        uint256 _repeatPeriodTime
    );

    // Emit when the added blacklist type is deleted
    event DeleteBlacklistType(
        bytes32 _blacklistName
    );

    // Emit when new investor is added to the blacklist type
    event AddInvestorToBlacklist(
        address indexed _investor,
        bytes32 _blacklistName
    );

    // Emit when investor is deleted from the blacklist type
    event DeleteInvestorFromBlacklist(
        address indexed _investor,
        bytes32 _blacklistName
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
    * @dev Restrict the blacklist address to transfer tokens
    * if the current time is between the timeframe define for the
    * blacklist type associated with the _from address
    */
    function verifyTransfer(address _from, address /* _to */, uint256 /* _amount */, bytes  memory/* _data */, bool /* _isTransfer */) public returns(Result) {
        if (!paused) {
            if (investorToBlacklist[_from].length != 0) {
                for (uint256 i = 0; i < investorToBlacklist[_from].length; i++) {
                    uint256 endTimeTemp = blacklists[investorToBlacklist[_from][i]].endTime;
                    uint256 startTimeTemp = blacklists[investorToBlacklist[_from][i]].startTime;
                    uint256 repeatPeriodTimeTemp = blacklists[investorToBlacklist[_from][i]].repeatPeriodTime * 1 days;
                    /*solium-disable-next-line security/no-block-members*/
                    if (now > startTimeTemp) {
                    // Find the repeating parameter that will be used to calculate the new startTime and endTime
                    // based on the new current time value
                    /*solium-disable-next-line security/no-block-members*/
                        uint256 repeater = (now.sub(startTimeTemp)).div(repeatPeriodTimeTemp);
                        /*solium-disable-next-line security/no-block-members*/
                        if (startTimeTemp.add(repeatPeriodTimeTemp.mul(repeater)) <= now && endTimeTemp.add(repeatPeriodTimeTemp.mul(repeater)) >= now) {
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
    * @param _startTime Start date of the blacklist type
    * @param _endTime End date of the blacklist type
    * @param _blacklistName Name of the blacklist type
    * @param _repeatPeriodTime Repeat period of the blacklist type
    */
    function addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) public withPerm(ADMIN) {
        _addBlacklistType(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
    }

    /**
    * @notice Used to add the multiple blacklist type
    * @param _startTimes Start date of the blacklist type
    * @param _endTimes End date of the blacklist type
    * @param _blacklistNames Name of the blacklist type
    * @param _repeatPeriodTimes Repeat period of the blacklist type
    */
    function addBlacklistTypeMulti(
        uint256[] calldata _startTimes,
        uint256[] calldata _endTimes,
        bytes32[] calldata _blacklistNames,
        uint256[] calldata _repeatPeriodTimes
    )
        external
        withPerm(ADMIN)
    {
        require (_startTimes.length == _endTimes.length && _endTimes.length == _blacklistNames.length && _blacklistNames.length == _repeatPeriodTimes.length, "Input array's length mismatch");
        for (uint256 i = 0; i < _startTimes.length; i++){
            _addBlacklistType(_startTimes[i], _endTimes[i], _blacklistNames[i], _repeatPeriodTimes[i]);
        }
    }

    /**
     * @notice Internal function
     */
    function _validParams(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal view {
        require(_blacklistName != bytes32(0), "Invalid blacklist name");
        require(_startTime >= now && _startTime < _endTime, "Invalid start or end date");
        require(_repeatPeriodTime.mul(1 days) >= _endTime.sub(_startTime) || _repeatPeriodTime == 0);
    }

    /**
    * @notice Used to modify the details of a given blacklist type
    * @param _startTime Start date of the blacklist type
    * @param _endTime End date of the blacklist type
    * @param _blacklistName Name of the blacklist type
    * @param _repeatPeriodTime Repeat period of the blacklist type
    */
    function modifyBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) public withPerm(ADMIN) {
        require(blacklists[_blacklistName].endTime != 0, "Blacklist type doesn't exist");
        _validParams(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
        blacklists[_blacklistName] = BlacklistsDetails(_startTime, _endTime, _repeatPeriodTime);
        emit ModifyBlacklistType(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
    }

    /**
    * @notice Used to modify the details of a given multpile blacklist types
    * @param _startTimes Start date of the blacklist type
    * @param _endTimes End date of the blacklist type
    * @param _blacklistNames Name of the blacklist type
    * @param _repeatPeriodTimes Repeat period of the blacklist type
    */
    function modifyBlacklistTypeMulti(
        uint256[] calldata _startTimes,
        uint256[] calldata _endTimes,
        bytes32[] calldata _blacklistNames,
        uint256[] calldata _repeatPeriodTimes
    )
        external
        withPerm(ADMIN)
    {
        require (_startTimes.length == _endTimes.length && _endTimes.length == _blacklistNames.length && _blacklistNames.length == _repeatPeriodTimes.length, "Input array's length mismatch");
        for (uint256 i = 0; i < _startTimes.length; i++){
            modifyBlacklistType(_startTimes[i], _endTimes[i], _blacklistNames[i], _repeatPeriodTimes[i]);
        }
    }

    /**
    * @notice Used to delete the blacklist type
    * @param _blacklistName Name of the blacklist type
    */
    function deleteBlacklistType(bytes32 _blacklistName) public withPerm(ADMIN) {
        require(blacklists[_blacklistName].endTime != 0, "Blacklist type doesn’t exist");
        require(blacklistToInvestor[_blacklistName].length == 0, "Investors are associated with the blacklist");
        // delete blacklist type
        delete(blacklists[_blacklistName]);
        uint256 i = 0;
        for (i = 0; i < allBlacklists.length; i++) {
            if (allBlacklists[i] == _blacklistName) {
                break;
            }
        }
        if (i != allBlacklists.length -1) {
            allBlacklists[i] = allBlacklists[allBlacklists.length -1];
        }
        allBlacklists.length--;
        emit DeleteBlacklistType(_blacklistName);
    }

    /**
    * @notice Used to delete the multiple blacklist type
    * @param _blacklistNames Name of the blacklist type
    */
    function deleteBlacklistTypeMulti(bytes32[] calldata _blacklistNames) external withPerm(ADMIN) {
        for(uint256 i = 0; i < _blacklistNames.length; i++){
            deleteBlacklistType(_blacklistNames[i]);
        }
    }

    /**
    * @notice Used to assign the blacklist type to the investor
    * @param _investor Address of the investor
    * @param _blacklistName Name of the blacklist
    */
    function addInvestorToBlacklist(address _investor, bytes32 _blacklistName) public withPerm(ADMIN) {
        require(blacklists[_blacklistName].endTime != 0, "Blacklist type doesn't exist");
        require(_investor != address(0), "Invalid investor address");
        uint256 index = investorToIndex[_investor][_blacklistName];
        if (index < investorToBlacklist[_investor].length)
            require(investorToBlacklist[_investor][index] != _blacklistName, "Blacklist already added to investor");
        uint256 investorIndex = investorToBlacklist[_investor].length;
        // Add blacklist index to the investor
        investorToIndex[_investor][_blacklistName] = investorIndex;
        uint256 blacklistIndex = blacklistToInvestor[_blacklistName].length;
        // Add investor index to the blacklist
        blacklistToIndex[_blacklistName][_investor] = blacklistIndex;
        investorToBlacklist[_investor].push(_blacklistName);
        blacklistToInvestor[_blacklistName].push(_investor);
        emit AddInvestorToBlacklist(_investor, _blacklistName);
    }

    /**
    * @notice Used to assign the blacklist type to the multiple investor
    * @param _investors Address of the investor
    * @param _blacklistName Name of the blacklist
    */
    function addInvestorToBlacklistMulti(address[] calldata _investors, bytes32 _blacklistName) external withPerm(ADMIN){
        for(uint256 i = 0; i < _investors.length; i++){
            addInvestorToBlacklist(_investors[i], _blacklistName);
        }
    }

    /**
    * @notice Used to assign the multiple blacklist type to the multiple investor
    * @param _investors Address of the investor
    * @param _blacklistNames Name of the blacklist
    */
    function addMultiInvestorToBlacklistMulti(address[] calldata _investors, bytes32[] calldata _blacklistNames) external withPerm(ADMIN){
        require (_investors.length == _blacklistNames.length, "Input array's length mismatch");
        for(uint256 i = 0; i < _investors.length; i++){
            addInvestorToBlacklist(_investors[i], _blacklistNames[i]);
        }
    }

    /**
    * @notice Used to assign the new blacklist type to the investor
    * @param _startTime Start date of the blacklist type
    * @param _endTime End date of the blacklist type
    * @param _blacklistName Name of the blacklist type
    * @param _repeatPeriodTime Repeat period of the blacklist type
    * @param _investor Address of the investor
    */
    function addInvestorToNewBlacklist(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime, address _investor) external withPerm(ADMIN){
        _addBlacklistType(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
        addInvestorToBlacklist(_investor, _blacklistName);
    }

    /**
    * @notice Used to delete the investor from all the associated blacklist types
    * @param _investor Address of the investor
    */
    function deleteInvestorFromAllBlacklist(address _investor) public withPerm(ADMIN) {
        require(_investor != address(0), "Invalid investor address");
        require(investorToBlacklist[_investor].length != 0, "Investor is not associated to any blacklist type");
        uint256 index = investorToBlacklist[_investor].length - 1;
        for (uint256 i = index; i >= 0 && i <= index; i--){
            deleteInvestorFromBlacklist(_investor, investorToBlacklist[_investor][i]);
        }
    }

     /**
    * @notice Used to delete the multiple investor from all the associated blacklist types
    * @param _investor Address of the investor
    */
    function deleteInvestorFromAllBlacklistMulti(address[] calldata _investor) external withPerm(ADMIN) {
        for(uint256 i = 0; i < _investor.length; i++){
            deleteInvestorFromAllBlacklist(_investor[i]);
        }
    }

    /**
    * @notice Used to delete the investor from the blacklist
    * @param _investor Address of the investor
    * @param _blacklistName Name of the blacklist
    */
    function deleteInvestorFromBlacklist(address _investor, bytes32 _blacklistName) public withPerm(ADMIN) {
        require(_investor != address(0), "Invalid investor address");
        require(_blacklistName != bytes32(0),"Invalid blacklist name");
        require(investorToBlacklist[_investor][investorToIndex[_investor][_blacklistName]] == _blacklistName, "Investor not associated to the blacklist");
        // delete the investor from the blacklist type
        uint256 _blacklistIndex = blacklistToIndex[_blacklistName][_investor];
        uint256 _len = blacklistToInvestor[_blacklistName].length;
        if ( _blacklistIndex < _len -1) {
            blacklistToInvestor[_blacklistName][_blacklistIndex] = blacklistToInvestor[_blacklistName][_len - 1];
            blacklistToIndex[_blacklistName][blacklistToInvestor[_blacklistName][_blacklistIndex]] = _blacklistIndex;
        }
        blacklistToInvestor[_blacklistName].length--;
        // delete the investor index from the blacklist
        delete(blacklistToIndex[_blacklistName][_investor]);
        // delete the blacklist from the investor
        uint256 _investorIndex = investorToIndex[_investor][_blacklistName];
        _len = investorToBlacklist[_investor].length;
        if ( _investorIndex < _len -1) {
            investorToBlacklist[_investor][_investorIndex] = investorToBlacklist[_investor][_len - 1];
            investorToIndex[_investor][investorToBlacklist[_investor][_investorIndex]] = _investorIndex;
        }
        investorToBlacklist[_investor].length--;
        // delete the blacklist index from the invetsor
        delete(investorToIndex[_investor][_blacklistName]);
        emit DeleteInvestorFromBlacklist(_investor, _blacklistName);
    }

     /**
    * @notice Used to delete the multiple investor from the blacklist
    * @param _investors address of the investor
    * @param _blacklistNames name of the blacklist
    */
    function deleteMultiInvestorsFromBlacklistMulti(address[] calldata _investors, bytes32[] calldata _blacklistNames) external withPerm(ADMIN) {
        require (_investors.length == _blacklistNames.length, "Input array's length mismatch");
        for(uint256 i = 0; i < _investors.length; i++){
            deleteInvestorFromBlacklist(_investors[i], _blacklistNames[i]);
        }
    }

    function _addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal {
        require(blacklists[_blacklistName].endTime == 0, "Blacklist type already exist");
        _validParams(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
        blacklists[_blacklistName] = BlacklistsDetails(_startTime, _endTime, _repeatPeriodTime);
        allBlacklists.push(_blacklistName);
        emit AddBlacklistType(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
    }

    /**
    * @notice get the list of the investors of a blacklist type
    * @param _blacklistName Name of the blacklist type
    * @return address List of investors associated with the blacklist
    */
    function getListOfAddresses(bytes32 _blacklistName) external view returns(address[] memory) {
        require(blacklists[_blacklistName].endTime != 0, "Blacklist type doesn't exist");
        return blacklistToInvestor[_blacklistName];
    }

    /**
    * @notice get the list of the investors of a blacklist type
    * @param _user Address of the user
    * @return bytes32 List of blacklist names associated with the given address
    */
    function getBlacklistNamesToUser(address _user) external view returns(bytes32[] memory) {
        return investorToBlacklist[_user];
    }

    /**
     * @notice get the list of blacklist names
     * @return bytes32 Array of blacklist names
     */
    function getAllBlacklists() external view returns(bytes32[] memory) {
        return allBlacklists;
    }

    /**
    * @notice Return the permissions flag that are associated with blacklist transfer manager
    */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }
}
