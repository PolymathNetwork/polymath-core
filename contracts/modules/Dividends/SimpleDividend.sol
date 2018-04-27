pragma solidity ^0.4.23;

import "./IDividend.sol";
import "../Staking/IStaking.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract SimpleDividend is IDividend {
    
    using SafeMath for uint256;

    bytes32 public constant ISSUE_DIVIDEND = "ISSUE_DIVIDEND";
    address public simpleStaking;
    uint256 constant DividendTime = 10 days;

    struct Dividend {
        uint256 declarationDate;
        uint256 recordDate;
        uint256 paymentDate;
        uint256 payoutRatio;
        string currencyType;
        bool isActive;
    }

    Dividend public currentDividend;

    Dividend[] public dividends;

    event LogIssueDividend(string _currencyType, uint256 _declarationDate, uint256 _recordDate, uint256 _payoutRatio);
    event LogActivateDividend(uint256 _timestamp);
    event LogDividendPaid(uint256 _amountPaid, string _currencyType, address _holder, uint256 _timestamp);

    /// @notice Constructor
    constructor (address _securityToken, address _polyAddress) public
    IModule(_securityToken, _polyAddress)
    {
    }

    function configure(address _simpleStaking) public {
        require(_simpleStaking != address(0));
        simpleStaking = _simpleStaking;
    }

    function getInitFunction() public returns (bytes4) {
        return bytes4(keccak256("configure(address)"));
    }

    function issueDividendInETH(uint256 _declarationDate, uint256 _recordDate) payable public withPerm(ISSUE_DIVIDEND) {
        _preDividendValidation(_declarationDate, _recordDate);
        uint256 payoutRatio = msg.value.div(ERC20(securityToken).totalSupply());

        currentDividend = Dividend(_declarationDate, _recordDate, 0, payoutRatio, "ETH", false);
        IStaking(simpleStaking).intiateStaking(_declarationDate, _recordDate);

        emit LogIssueDividend("ETH", _declarationDate, _recordDate, payoutRatio);
    }

    function issueDividendInPoly(uint256 _totalDividendAmount, uint256 _declarationDate, uint256 _recordDate) public withPerm(ISSUE_DIVIDEND) {
        _preDividendValidation(_declarationDate, _recordDate);
        require(polyToken.transferFrom(msg.sender, this, _totalDividendAmount));

        uint256 payoutRatio = _totalDividendAmount.div(ERC20(securityToken).totalSupply());

        currentDividend = Dividend(_declarationDate, _recordDate, 0, payoutRatio, "POLY", false);
        IStaking(simpleStaking).intiateStaking(_declarationDate, _recordDate);

        emit LogIssueDividend("POLY", _declarationDate, _recordDate, payoutRatio);
    }

    function _preDividendValidation(uint256 _declarationDate, uint256 _recordDate) internal {
        require(now > (currentDividend.paymentDate + DividendTime));
        // TODO: Need to decide whether this function call independently or called in the same function call
        _recycledDividend();
        require(_declarationDate > now && _recordDate >= (_declarationDate + 2 days));
    }

    function claimedDividend() public {
        require((currentDividend.paymentDate + DividendTime) >= currentDividend.recordDate);
        require(currentDividend.isActive == true);
        uint256 balance;
        bool isWithdrawal;
        (balance, isWithdrawal,) = IStaking(simpleStaking).getHolderByModule(address(this), msg.sender);
        require(isWithdrawal == false && balance !=0);

        if (keccak256(currentDividend.currencyType) == keccak256("ETH")) {
            require(IStaking(simpleStaking).updateStatus(msg.sender));
            require(ERC20(securityToken).transferFrom(simpleStaking, msg.sender, balance));
            address(this).transfer(checkYourDividendPay());
        } 
        else if (keccak256(currentDividend.currencyType) == keccak256("POLY")) {
            require(IStaking(simpleStaking).updateStatus(msg.sender));
            require(ERC20(securityToken).transferFrom(simpleStaking, msg.sender, balance));
            require(polyToken.transfer(msg.sender, checkYourDividendPay()));
        }
        emit LogDividendPaid(checkYourDividendPay(), currentDividend.currencyType, msg.sender, now);
    }

    function activateDividend() public onlyOwner {
        require(now > currentDividend.recordDate);
        require(!currentDividend.isActive);
        require(IStaking(simpleStaking).provideAllowance());
        currentDividend.isActive = true;
        currentDividend.paymentDate = now;
        emit LogActivateDividend(now);
    }

    function checkYourDividendPay() public view returns(uint256) {
        return (ERC20(securityToken).balanceOf(msg.sender)).mul(currentDividend.payoutRatio);
    }

    /**
    * @dev Use to get the Permission flag related the `this` contract
    * @return Array of permission flags
    */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = ISSUE_DIVIDEND;
        return allPermissions;
    }

    // TODO: Need to add the recycle concept
    function _recycledDividend() internal {

    }
}