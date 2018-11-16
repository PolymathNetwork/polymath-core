pragma solidity ^0.4.24;

import "../../TransferManager/ITransferManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../libraries/BokkyPooBahsDateTimeLibrary.sol";

contract VolumeRestrictionTM is ITransferManager {
    
    using SafeMath for uint256;

    enum RestrictionType { Global, Individual }
    enum TokenType { Fixed, Variable}

    struct VolumeRestriction {
        uint256 allowedTokens;
        uint256 startTime;
        uint256 rollingPeriodInDays;
        uint256 endTime;
    }

    VolumeRestriction fixedGlobalRestriction;
    VolumeRestriction variableGlobalRestriction;

    mapping(address => VolumeRestriction[]) internal fixedIndividualRestriction;
    mapping(address => VolumeRestriciton[]) internal variableIndividualRestriction;
    mapping(address => mapping(uint256 => ))

    mapping(address => bool) public exemptList;

    event ExemptWalletListChanged(address _wallet, bool _change);

    function changeExemptWalletList(address _wallet, bool _change) public withPerm(ADMIN) {

    }

    function addFixedIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime 
    )
        public
        withPerm(ADMIN)
    {

    }

    function addVariableIndividualRestriction(
        address _holder,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime 
    ) 
        public
        withPerm(ADMIN)
    {

    }

    function addFixedGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime 
    )
        public
        withPerm(ADMIN)
    {

    }

    function addVariableGlobalRestriciton(
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime 
    ) 
        public
        withPerm(ADMIN)
    {

    }

    function modifyFixedIndividualRestriction(
        address _holder,
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime 
    )
        public
        withPerm(ADMIN)
    {

    }

    function modifyVariableIndividualRestriction(
        address _holder,
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime 
    ) 
        public
        withPerm(ADMIN)
    {

    }

    function modifyFixedGlobalRestriction(
        uint256 _allowedTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime 
    )
        public
        withPerm(ADMIN)
    {

    }

    function modifyVariableGlobalRestriciton(
        uint256 _allowedPercentageOfTokens,
        uint256 _startTime,
        uint256 _rollingPeriodInDays,
        uint256 _endTime 
    ) 
        public
        withPerm(ADMIN)
    {

    }

}
