pragma solidity 0.5.8;

import "../../../interfaces/IVoting.sol";
import "../../Module.sol";
import ".././ICheckpoint.sol";
import "../../../storage/modules/Checkpoint/Voting/VotingCheckpointStorage.sol";

contract VotingCheckpoint is VotingCheckpointStorage, ICheckpoint, IVoting, Module {

    event ChangedDefaultExemptedVotersList(address indexed _voter, bool _exempt);

    /**
     * Change the global exempted voters list
     * @param _voter Address of the voter
     * @param _exempt Whether it is exempted or not
     */
    function changeDefaultExemptedVotersList(address _voter, bool _exempt) external withPerm(ADMIN) {
        _changeDefaultExemptedVotersList(_voter, _exempt);
    }

    /**
     * Change the global exempted voters list
     * @param _voters Address of the voter
     * @param _exempts Whether it is exempted or not
     */
    function changeDefaultExemptedVotersListMulti(address[] calldata _voters, bool[] calldata _exempts) external withPerm(ADMIN) {
        require(_voters.length == _exempts.length, "Array length mismatch");
        for (uint256 i = 0; i < _voters.length; i++) {
            _changeDefaultExemptedVotersList(_voters[i], _exempts[i]);
        }
    }

    function _changeDefaultExemptedVotersList(address _voter, bool _exempt) internal {
        require(_voter != address(0), "Invalid address");
        require((defaultExemptIndex[_voter] == 0) == _exempt);
        if (_exempt) {
            defaultExemptedVoters.push(_voter);
            defaultExemptIndex[_voter] = defaultExemptedVoters.length;
        } else {
            if (defaultExemptedVoters.length != defaultExemptIndex[_voter]) {
                defaultExemptedVoters[defaultExemptIndex[_voter] - 1] = defaultExemptedVoters[defaultExemptedVoters.length - 1];
                defaultExemptIndex[defaultExemptedVoters[defaultExemptIndex[_voter] - 1]] = defaultExemptIndex[_voter];
            }
            delete defaultExemptIndex[_voter];
            defaultExemptedVoters.length --;
        }
        emit ChangedDefaultExemptedVotersList(_voter, _exempt);
    }

    /**
     * Return the default exemption list
     */
    function getDefaultExemptionVotersList() external view returns(address[] memory) {
        return defaultExemptedVoters;
    }
}
