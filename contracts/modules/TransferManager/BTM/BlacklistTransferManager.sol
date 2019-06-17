pragma solidity 0.5.8;

import "../TransferManager.sol";
import "./BlacklistTransferManagerStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Transfer Manager module to automate blacklist and restrict transfers
 */
contract BlacklistTransferManager is BlacklistTransferManagerStorage, TransferManager {
    using SafeMath for uint256;

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
    function executeTransfer(address _from, address /*_to*/, uint256 /*_amount*/, bytes  calldata /*_data*/) external returns(Result) {
        (Result success, ) = _verifyTransfer(_from);
        return success;
    }


    /**
    * @notice Used to verify the transfer transaction (View)
    * @param _from Address of the sender
    * @dev Restrict the blacklist address to transfer tokens
    * if the current time is between the timeframe define for the
    * blacklist type associated with the _from address
    */
    function verifyTransfer(
        address _from,
        address /* _to */,
        uint256 /* _amount */,
        bytes  memory/* _data */
    )
        public
        view
        returns(Result, bytes32)
    {
        return _verifyTransfer(_from);
    }

    function _verifyTransfer(address _from) internal view returns(Result, bytes32) {
        if (!paused) {
            if (investorToBlacklist[_from].length != 0) {
                for (uint256 i = 0; i < investorToBlacklist[_from].length; i++) {
                    bytes32 blacklistName = investorToBlacklist[_from][i];
                    uint256 endTimeTemp = blacklists[blacklistName].endTime;
                    uint256 startTimeTemp = blacklists[blacklistName].startTime;
                    uint256 repeatPeriodTimeTemp = blacklists[blacklistName].repeatPeriodTime * 1 days;
                    /*solium-disable-next-line security/no-block-members*/
                    if (now > startTimeTemp) {
                        if (repeatPeriodTimeTemp > 0) {
                            // Find the repeating parameter that will be used to calculate the new startTime and endTime
                            // based on the new current time value
                            /*solium-disable-next-line security/no-block-members*/
                            uint256 repeater = (now.sub(startTimeTemp)).div(repeatPeriodTimeTemp);
                            /*solium-disable-next-line security/no-block-members*/
                            if (endTimeTemp.add(repeatPeriodTimeTemp.mul(repeater)) >= now) {
                                return (Result.INVALID, bytes32(uint256(address(this)) << 96));
                            }
                        } else if(endTimeTemp >= now) {
                            return (Result.INVALID, bytes32(uint256(address(this)) << 96));
                        }
                    }
                }
            }
        }
        return (Result.NA, bytes32(0));
    }


    /**
    * @notice Used to add the blacklist type
    * @param _startTime Start date of the blacklist type
    * @param _endTime End date of the blacklist type
    * @param _blacklistName Name of the blacklist type
    * @param _repeatPeriodTime Repeat period of the blacklist type in days
    */
    function addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) public withPerm(ADMIN) {
        _addBlacklistType(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
    }

    function _addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal {
        require(blacklists[_blacklistName].endTime == 0, "Blacklist type already exist");
        _addBlacklistTypeDetails(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
        allBlacklists.push(_blacklistName);
        emit AddBlacklistType(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
    }

    function _addBlacklistTypeDetails(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal {
        _validParams(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
        blacklists[_blacklistName] = BlacklistsDetails(_startTime, _endTime, _repeatPeriodTime);
    }

    /**
    * @notice Used to add the multiple blacklist type
    * @param _startTimes Start date of the blacklist type
    * @param _endTimes End date of the blacklist type
    * @param _blacklistNames Name of the blacklist type
    * @param _repeatPeriodTimes Repeat period of the blacklist type
    */
    function addBlacklistTypeMulti(
        uint256[] memory _startTimes,
        uint256[] memory _endTimes,
        bytes32[] memory _blacklistNames,
        uint256[] memory _repeatPeriodTimes
    )
        public
        withPerm(ADMIN)
    {
        require (_startTimes.length == _endTimes.length && _endTimes.length == _blacklistNames.length && _blacklistNames.length == _repeatPeriodTimes.length, "Input array's length mismatch");
        for (uint256 i = 0; i < _startTimes.length; i++) {
            _addBlacklistType(_startTimes[i], _endTimes[i], _blacklistNames[i], _repeatPeriodTimes[i]);
        }
    }

    /**
    * @notice Used to modify the details of a given blacklist type
    * @param _startTime Start date of the blacklist type
    * @param _endTime End date of the blacklist type
    * @param _blacklistName Name of the blacklist type
    * @param _repeatPeriodTime Repeat period of the blacklist type
    */
    function modifyBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) public withPerm(ADMIN) {
        _modifyBlacklistType(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
    }

    function _modifyBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal {
        require(blacklists[_blacklistName].endTime != 0, "Blacklist type doesn't exist");
        _addBlacklistTypeDetails(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
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
        uint256[] memory _startTimes,
        uint256[] memory _endTimes,
        bytes32[] memory _blacklistNames,
        uint256[] memory _repeatPeriodTimes
    )
        public
        withPerm(ADMIN)
    {
        require (_startTimes.length == _endTimes.length && _endTimes.length == _blacklistNames.length && _blacklistNames.length == _repeatPeriodTimes.length, "Input array's length mismatch");
        for (uint256 i = 0; i < _startTimes.length; i++) {
            _modifyBlacklistType(_startTimes[i], _endTimes[i], _blacklistNames[i], _repeatPeriodTimes[i]);
        }
    }

    /**
    * @notice Used to delete the blacklist type
    * @param _blacklistName Name of the blacklist type
    */
    function deleteBlacklistType(bytes32 _blacklistName) public withPerm(ADMIN) {
        _deleteBlacklistType(_blacklistName);
    }

    function _deleteBlacklistType(bytes32 _blacklistName) internal {
        require(blacklists[_blacklistName].endTime != 0, "Blacklist type doesn’t exist");
        require(blacklistToInvestor[_blacklistName].length == 0, "Investors are associated with the blacklist");
        // delete blacklist type
        delete(blacklists[_blacklistName]);
        uint256 i = 0;
        uint256 blackListLength = allBlacklists.length;
        for (i = 0; i < blackListLength; i++) {
            if (allBlacklists[i] == _blacklistName) {
                break;
            }
        }
        if (i != blackListLength - 1) {
            allBlacklists[i] = allBlacklists[blackListLength -1];
        }
        allBlacklists.length--;
        emit DeleteBlacklistType(_blacklistName);
    }

    /**
    * @notice Used to delete the multiple blacklist type
    * @param _blacklistNames Name of the blacklist type
    */
    function deleteBlacklistTypeMulti(bytes32[] memory _blacklistNames) public withPerm(ADMIN) {
        for(uint256 i = 0; i < _blacklistNames.length; i++) {
            _deleteBlacklistType(_blacklistNames[i]);
        }
    }

    /**
    * @notice Used to assign the blacklist type to the investor
    * @param _investor Address of the investor
    * @param _blacklistName Name of the blacklist
    */
    function addInvestorToBlacklist(address _investor, bytes32 _blacklistName) public withPerm(ADMIN) {
        _addInvestorToBlacklist(_investor, _blacklistName);
    }

    function _addInvestorToBlacklist(address _investor, bytes32 _blacklistName) internal {
        require(blacklists[_blacklistName].endTime != 0, "Blacklist type doesn't exist");
        require(_investor != address(0), "Invalid investor address");
        require(investorToIndex[_investor][_blacklistName] == 0, "Blacklist already added to investor");
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
    function addInvestorToBlacklistMulti(address[] memory _investors, bytes32 _blacklistName) public withPerm(ADMIN) {
        for(uint256 i = 0; i < _investors.length; i++) {
            _addInvestorToBlacklist(_investors[i], _blacklistName);
        }
    }

    /**
    * @notice Used to assign the multiple blacklist type to the multiple investor
    * @param _investors Address of the investor
    * @param _blacklistNames Name of the blacklist
    */
    function addMultiInvestorToBlacklistMulti(address[] memory _investors, bytes32[] memory _blacklistNames) public withPerm(ADMIN) {
        require (_investors.length == _blacklistNames.length, "Input array's length mismatch");
        for(uint256 i = 0; i < _investors.length; i++) {
            _addInvestorToBlacklist(_investors[i], _blacklistNames[i]);
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
    function addInvestorToNewBlacklist(
        uint256 _startTime,
        uint256 _endTime,
        bytes32 _blacklistName,
        uint256 _repeatPeriodTime,
        address _investor
    ) public withPerm(ADMIN) {
        _addBlacklistType(_startTime, _endTime, _blacklistName, _repeatPeriodTime);
        _addInvestorToBlacklist(_investor, _blacklistName);
    }

    /**
    * @notice Used to delete the investor from the blacklist
    * @param _investor Address of the investor
    * @param _blacklistName Name of the blacklist
    */
    function deleteInvestorFromBlacklist(address _investor, bytes32 _blacklistName) public withPerm(ADMIN) {
        _deleteInvestorFromBlacklist(_investor, _blacklistName);
    }

    /**
    * @notice Used to delete the investor from the blacklist
    * @param _investor Address of the investor
    * @param _blacklistName Name of the blacklist
    */
    function _deleteInvestorFromBlacklist(address _investor, bytes32 _blacklistName) internal {
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
    * @notice Used to delete the investor from all the associated blacklist types
    * @param _investor Address of the investor
    */
    function deleteInvestorFromAllBlacklist(address _investor) public withPerm(ADMIN) {
        _deleteInvestorFromAllBlacklist(_investor);
    }

    /**
    * @notice Used to delete the investor from all the associated blacklist types
    * @param _investor Address of the investor
    */
    function _deleteInvestorFromAllBlacklist(address _investor) internal {
        require(_investor != address(0), "Invalid investor address");
        require(investorToBlacklist[_investor].length >= 1, "Investor is not present in the blacklist");
        uint256 index = investorToBlacklist[_investor].length - 1;
        for (uint256 i = index; i >= 0 && i <= index; i--) {
            _deleteInvestorFromBlacklist(_investor, investorToBlacklist[_investor][i]);
        }
    }

     /**
    * @notice Used to delete the multiple investor from all the associated blacklist types
    * @param _investor Address of the investor
    */
    function deleteInvestorFromAllBlacklistMulti(address[] memory _investor) public withPerm(ADMIN) {
        for(uint256 i = 0; i < _investor.length; i++) {
            _deleteInvestorFromAllBlacklist(_investor[i]);
        }
    }

     /**
    * @notice Used to delete the multiple investor from the blacklist
    * @param _investors address of the investor
    * @param _blacklistNames name of the blacklist
    */
    function deleteMultiInvestorsFromBlacklistMulti(address[] memory _investors, bytes32[] memory _blacklistNames) public withPerm(ADMIN) {
        require (_investors.length == _blacklistNames.length, "Input array's length mismatch");
        for(uint256 i = 0; i < _investors.length; i++) {
            _deleteInvestorFromBlacklist(_investors[i], _blacklistNames[i]);
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
     * @notice return the amount of tokens for a given user as per the partition
     * @param _partition Identifier
     * @param _tokenHolder Whom token amount need to query
     * @param _additionalBalance It is the `_value` that transfer during transfer/transferFrom function call
     */
    function getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) external view returns(uint256) {
        uint256 currentBalance = (msg.sender == address(securityToken)) ? (securityToken.balanceOf(_tokenHolder)).add(_additionalBalance) : securityToken.balanceOf(_tokenHolder);
        if (paused && _partition == UNLOCKED)
            return currentBalance;

        (Result success, ) = verifyTransfer(_tokenHolder, address(0), 0, "0x0");
        if ((_partition == LOCKED && success == Result.INVALID) || (_partition == UNLOCKED && success != Result.INVALID))
            return currentBalance;
        else
            return 0;
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
