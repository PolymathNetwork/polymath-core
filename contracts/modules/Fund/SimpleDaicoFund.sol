pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/IST20.sol";
import "../Governance/VoteGovernance.sol";

import "../../interfaces/IModule.sol";
import "../../interfaces/ITokenBurner.sol";

contract SimpleDaicoFund is IModule, ITokenBurner {
    using SafeMath for uint256;

////////////////////
// Configurations //
////////////////////

    constructor (address _securityToken, address _polyAddress) public
    IModule(_securityToken, _polyAddress)
    {
    }

    function configure(
        uint256 _tap,
        uint256 _votingPeriod,
        address _tapRecipient,
        address _owner,
        address _tokenContract
    ) public onlyFactory {
        tap = _tap;
        votingPeriod = _votingPeriod;
        tapRecipient = _tapRecipient;
        owner = _owner;
        tokenContract = IST20(_tokenContract);
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(keccak256("configure(uint256,uint256,address,address,address)"));
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

/////////////
// General //
/////////////

    function() public payable {}

    address public owner;
    address public transferManager;
    IST20 public tokenContract;

    function getETHBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function setTransferManager(address _transferManager) public {
        require(msg.sender == owner);
        require(transferManager == address(0));
        transferManager = _transferManager;
    }

/////////////////////////////////////////////
// This section contains logic for the tap //
/////////////////////////////////////////////

    uint256 public tap; // wei per second
    uint256 public lastWithdrawTime = now;
    address public tapRecipient;

    function getAccumulatedTap() public view returns(uint256) {
        uint256 amountWei = uint256(tap.mul(now.sub(lastWithdrawTime)));
        if(address(this).balance < amountWei) {
            amountWei = address(this).balance;
        }
            return amountWei;
    }

    function claimAccumulatedTap() public notRefund {
        require(msg.sender == owner);
        require(_payout());
    }

    function changeTapRecipient(address _newTapRecipient) public notRefund {
        require(msg.sender == owner);
        tapRecipient = _newTapRecipient;
    }

    function _payout() private notRefund returns (bool){
        uint256 amountWei = getAccumulatedTap();
        lastWithdrawTime = now;
        tapRecipient.transfer(amountWei);
        return true;
    }

///////////////////////////////////////////////////
// This section contains logic for token refunds //
///////////////////////////////////////////////////

    bool public activeRefund = false;

    modifier notRefund() {
        require(!activeRefund);
        _;
    }

  // Requires token holder to first approve this contract for full token balance transfer
    function refundTokens() public {
        uint256 tokenHolderBalance = tokenContract.balanceOf(msg.sender);
        require(tokenHolderBalance > 0);
        require(activeRefund);
        uint256 refundValue = (tokenHolderBalance.mul(address(this).balance)).div(tokenContract.totalSupply());
        require(refundValue > 0);
        tokenContract.burnFrom(msg.sender,tokenHolderBalance); // Need to validate this implementation in ST 20 or TokenBurner
        msg.sender.transfer(refundValue);
    }

////////////////////////////////////////////////
// This section contains logic for governance //
////////////////////////////////////////////////

    Vote public voteContract;

    bool public activeTapVote = false;
    bool public activeRefundVote = false;
    uint256 public votingPeriod;
    uint256 public proposedTapIncrease;

    function activeVote() public view returns (bool) {
        if (activeTapVote || activeRefundVote) {
            return true;
        }
        return false;
    }

    function startTapVote(uint256 _proposedIncrease) public notRefund {
        require(msg.sender == owner);
        require(!activeVote());
        activeTapVote = true;
        proposedTapIncrease = _proposedIncrease;
        voteContract = new Vote(now.add(votingPeriod), address(this), address(tokenContract));
    }

    function startRefundVote() public notRefund {
        require(tokenContract.balanceOf(msg.sender) > 0);
        require(!activeVote());
        activeRefundVote = true;
        voteContract = new Vote(now.add(votingPeriod), address(this), address(tokenContract));
    }

    function finalizeTapVote() public notRefund {
        require(activeTapVote);
        bool result = voteContract.finalResult();
        if (result) {
            require(_payout());
            tap = tap.add(proposedTapIncrease);
        }
        activeTapVote = false;
        proposedTapIncrease = 0;
        delete voteContract;
    }

    function finalizeRefundVote() public notRefund {
        require(activeRefundVote);
        bool result = voteContract.finalResult();
        if (result) {
            activeRefund = true;
        }
        activeRefundVote = false;
        delete voteContract;
    }

    function callOnTransfer(address _sender, address _receiver, uint256 _amount) public returns (bool) {
        require(msg.sender == address(transferManager));
        if (activeVote()) {
            require(voteContract.callOnTransfer(_sender,_receiver,_amount));
        }
        return true;
    }
}
