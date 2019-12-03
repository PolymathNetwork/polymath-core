pragma solidity 0.5.8;

import "../../Module.sol";
import "./IssuanceStorage.sol";

/**
 * @title Issuance module for delegate issuance
 */
contract Issuance is IssuanceStorage, Module {

    event TokensIssued(address indexed _tokenHolder, uint256 _value, address indexed _issuedBy);
    event MultiTokensIssued(address[] _tokenHolders, uint256[] _values, address indexed _issuedBy);

    /**
     * @notice Constructor
     * @param _securityToken Address of the security token
     */
    constructor (address _securityToken, address _polyToken)
    public 
    Module(_securityToken, _polyToken)
    {

    }

    /**
     * @notice Function used to allocate tokens to the investor
     * @param _tokenHolder Address of whom token gets issued
     * @param _value The amount of tokens need to be issued
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     */
    function issueTokens(
        address _tokenHolder,
        uint256 _value,
        bytes memory _data
    )
        public
        withPerm(ADMIN)
    {
        /*solium-disable-next-line security/no-block-members*/
        securityToken.issue(_tokenHolder, _value, _data);
        emit TokensIssued(_tokenHolder, _value, msg.sender);
    }


    /**
     * @notice Function used to allocate tokens to the investor
     * @param _tokenHolders Address of whom token gets issued
     * @param _values The amount of tokens need to be issued
     */
    function issueTokensMulti(
        address[] calldata _tokenHolders,
        uint256[] calldata _values
    )
        external
        withPerm(ADMIN)
    {
        /*solium-disable-next-line security/no-block-members*/
        securityToken.issueMulti(_tokenHolders, _values);
        emit MultiTokensIssued(_tokenHolders, _values, msg.sender);
    }

    /**
     * @notice Returns the permissions flag that are associated with STO
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ADMIN;
        return allPermissions;
    }

    /**
     * @notice This function returns the signature of configure function
     * @return bytes4 Configure function signature
     */
    function getInitFunction() public pure returns(bytes4) {
        return bytes4(0);
    }

}
