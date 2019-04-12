pragma solidity ^0.5.0;

import "../../../interfaces/IVoting.sol";
import "../../Module.sol";
import ".././ICheckpoint.sol";
import "../../../storage/modules/Checkpoint/Voting/VotingCheckpointStorage.sol";

contract VotingCheckpoint is VotingCheckpointStorage, ICheckpoint, IVoting, Module {

    event ChangedDefaultExemptedVotersList(address indexed _voter, bool _change);

    /**
     * Change the global exempted voters list
     * @param _voter Address of the voter
     * @param _change Whether it is exempted or not
     */
    function changeDefaultExemptedVotersList(address _voter, bool _change) external withPerm(ADMIN) {
        _changeDefaultExemptedVotersList(_voter, _change);
    }

    /**
     * Change the global exempted voters list
     * @param _voters Address of the voter
     * @param _changes Whether it is exempted or not
     */
    function changeDefaultExemptedVotersListMulti(address[] calldata _voters, bool[] calldata _changes) external withPerm(ADMIN) {
        require(_voters.length == _changes.length, "Array length mismatch");
        for (uint256 i = 0; i < _voters.length; i++) {
            _changeDefaultExemptedVotersList(_voters[i], _changes[i]);
        }
    }

    function _changeDefaultExemptedVotersList(address _voter, bool _change) internal {
        require(_voter != address(0), "Invalid address");
        require((defaultExemptIndex[_voter] == 0) == _change);
        if (_change) {
            defaultExemptedVoters.push(_voter);
            defaultExemptIndex[_voter] = defaultExemptedVoters.length;
        } else {
            defaultExemptedVoters[defaultExemptIndex[_voter] - 1] = defaultExemptedVoters[defaultExemptedVoters.length - 1];
            defaultExemptIndex[defaultExemptedVoters[defaultExemptIndex[_voter] - 1]] = defaultExemptIndex[_voter];
            delete defaultExemptIndex[_voter];
            defaultExemptedVoters.length --;
        }
        emit ChangedDefaultExemptedVotersList(_voter, _change);
    }

    /**
     * Return the default exemption list
     */
    function getDefaultExemptionVotersList() external view returns(address[] memory) {
        return defaultExemptedVoters;
    }
}