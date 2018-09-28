pragma solidity ^0.4.24;

import "./IWallet.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../interfaces/ISecurityToken.sol";

/**
 * @title Escrow wallet for distributing tokens on a vesting schedule
 */
contract VestingEscrowWallet is IWallet {
  using SafeMath for uint;

  bytes32 public constant ISSUER = "ISSUER";
  address public treasury;
  address public securityToken;
  uint256 public numExcessTokens;
  uint256 public templateCount;

  struct VestingSchedule {
    // ID of the vesting schedule
    bytes32 vestingId;
    // Total number of vesting tokens at start of vesting period
    uint256 totalAllocation;
    // Length of the vesting period
    uint256 vestingDuration;
    // Start date of vesting schedule
    uint256 startDate;
    // Vesting frequency of the tokens
    uint256 vestingFrequency;
    // Total number of vested tokens
    uint256 numVestedTokens;
    // Total number of unvested tokens
    uint256 numUnvestedTokens;
    // Total number of claimed vested tokens
    uint256 numClaimedVestedTokens;
    // Total number of unclaimed vested tokens
    uint256 numUnclaimedVestedTokens;
    // Number of tokens to release to the target per tranche
    uint256 tokensPerTranche;
  }

  struct VestingTemplate {
    // Total number of vesting tokens at start of vesting period
    uint256 totalAllocation;
    // Length of the vesting period
    uint256 vestingDuration;
    // Vesting frequency of the tokens
    uint256 vestingFrequency;
  }

  mapping(address => uint256) public individualVestingCount;
  mapping(address => mapping(uint256 => VestingSchedule)) public individualVestingDetails;
  mapping(uint256 => VestingTemplate) public vestingTemplates;

  /* Events */
  event VestingStarted(
    address indexed target,
    bytes32 indexed vestingId,
    uint256 indexed totalAllocation,
    uint256 vestingDuration,
    uint256 startDate,
    uint256 vestingFrequency,
    uint256 numVestedTokens,
    uint256 numUnvestedTokens,
    uint256 numClaimedVestedTokens,
    uint256 numUnclaimedVestedTokens,
    uint256 tokensPerTranche
  );

  event VestingCancelled(
    address indexed target,
    uint256 indexed whichVestingShedule,
    bytes32 indexed vestingId,
    uint256 tokensCollected,
    bool    tokensReclaimed,
    uint256 cancellationTime
  );

  event TokensCollected(
    address indexed target,
    uint256 indexed whichVestingShedule,
    bytes32 indexed vestingId,
    uint256 numberTokensCollected
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
   * @notice Function used to initialize the different variables
   * @param _treasury Treasury wallet to send excess funds
   */
  function configure(address _treasury) public onlyFactory {
      require(_treasury != 0, "Treasury should not be 0");
      treasury = _treasury;
  }

  /**
   * @notice This function returns the signature of the configure function
   */
  function getInitFunction() public pure returns (bytes4) {
      return bytes4(keccak256("configure(address)"));
  }

  /**
   * @notice Return the permissions flag that are associated with VotingEscrowWallet
   */
  function getPermissions() public view returns(bytes32[]) {
      bytes32[] memory allPermissions = new bytes32[](1);
      allPermissions[0] = ISSUER;
      return allPermissions;
  }

  /**
  * @notice Create a template to be used for the creation of new vesting schedules
  * @param _totalAllocation Total number of tokens allocated for the target
  * @param _vestingDuration Total duration of the vesting schedule
  * @param _vestingFrequency Frequency of release of tokens
  */
  function createTemplate(
    uint256 _totalAllocation,
    uint256 _vestingDuration,
    uint256 _vestingFrequency
  )
    public
    onlyOwner
  {
    vestingTemplates[templateCount].totalAllocation = _totalAllocation;
    vestingTemplates[templateCount].vestingDuration = _vestingDuration;
    vestingTemplates[templateCount].vestingFrequency = _vestingFrequency;

    templateCount += 1;
  }

  /**
  * @notice Initiate a vesting schedule for any number of employees or affiliates
  * @param _target Address of the employee or the affiliate
  * @param _totalAllocation Total number of tokens allocated for the target
  * @param _vestingDuration Total duration of the vesting schedule
  * @param _startDate Start date of the vesting schedule
  * @param _vestingFrequency Frequency of release of tokens
  */
  function initiateVestingSchedule(
    address[] _target,
    uint256[] _totalAllocation,
    uint256[] _vestingDuration,
    uint256[] _startDate,
    uint256[] _vestingFrequency
  )
    public
    onlyOwner
  {
    require(_target.length == _totalAllocation.length &&
            _target.length == _vestingDuration.length &&
            _target.length == _startDate.length &&
            _target.length == _vestingFrequency.length);

    for (uint i = 0; i <= _target.length; i++) {
        _initiateVestingScheduleIterate(_target[i],
                                        _totalAllocation[i],
                                        _vestingDuration[i],
                                        _startDate[i],
                                        _vestingFrequency[i]);
    }
  }

  /**
  * @notice Initiate a vesting schedule for any number of employees from a template
  * @param _target Address of the employee or the affiliate
  * @param _templateNumber Template number to use
  * @param _startDate Start date of the vesting schedule
  */
  function initiateVestingSchedule(
    address[] _target,
    uint256   _templateNumber,
    uint256   _startDate
  )
    public
    onlyOwner
  {
    VestingTemplate memory _vestingTemplate = vestingTemplates[_templateNumber];

    for (uint i = 0; i <= _target.length; i++) {
      require(_target[i] != address(0));
      _initiateVestingScheduleIterate(_target[i],
                                      _vestingTemplate.totalAllocation,
                                      _vestingTemplate.vestingDuration,
                                      _startDate,
                                      _vestingTemplate.vestingFrequency);
    }
  }

  /**
  * @notice Cancel a vesting schedule for an employee or affiliate
  * @param _target Address of the employee or the affiliate
  * @param _whichVestingSchedule Index of the vesting schedule for the target
  * @param _isReclaiming True if the issuer is reclaiming the tokens out of the contract
  */
  function cancelVestingSchedule(address _target, uint256 _whichVestingSchedule, bool _isReclaiming)
    public
    onlyOwner
  {
    VestingSchedule memory _vestingSchedule = individualVestingDetails[_target][_whichVestingSchedule];

    require(_vestingSchedule.vestingId != 0, "Schedule not initialized");  // TODO: May need to check a flag. Asked on Github. There may be an ID if we don't have to delete this.

    bytes32 _vestingId = _vestingSchedule.vestingId;
    uint256 _currentTranche = _calculateCurrentTranche(_vestingSchedule.startDate, _vestingSchedule.vestingDuration);
    uint256 _tokensToDistribute = _calculateTokensToDistribute(_currentTranche, _vestingSchedule.tokensPerTranche, _vestingSchedule.numClaimedVestedTokens);
    uint256 _numUnvestedTokens = _vestingSchedule.numUnvestedTokens.sub(_tokensToDistribute);
    delete individualVestingDetails[_target][_whichVestingSchedule];

    // Send vested, unclaimed tokens to the target
    require(ISecurityToken(securityToken).transferFrom(
      address(this),
      _target,
      _tokensToDistribute), "Unable to transfer tokens");

    // Send extra tokens to the treasury or hold them in the contract
    if (_isReclaiming) {
      require(ISecurityToken(securityToken).transferFrom(
        address(this),
        treasury,
        _numUnvestedTokens), "Unable to transfer tokens");
    } else {
      numExcessTokens = numExcessTokens.add(_numUnvestedTokens);
    }

    emit VestingCancelled(
      _target,
      _whichVestingSchedule,
      _vestingId,
      _tokensToDistribute,
      _isReclaiming,
      block.timestamp
    );
  }

  /**
  * @notice Collect vested tokens
  * @param _whichVestingSchedule Index of the vesting schedule for the target
  */
  function collectVestedTokens(uint256 _whichVestingSchedule)
    public
  {
    VestingSchedule memory _vestingSchedule = individualVestingDetails[msg.sender][_whichVestingSchedule];

    require(_vestingSchedule.vestingId != 0, "Schedule not initialized");  // TODO: May need to check a flag. Asked on Github. There may be an ID if we don't have to delete this.
    require(_vestingSchedule.numUnvestedTokens != 0, "No tokens remain");  // TODO: May need to check a flag. Asked on Github. There may be an ID if we don't have to delete this.

    uint256 _currentTranche = _calculateCurrentTranche(_vestingSchedule.startDate, _vestingSchedule.vestingDuration);
    uint256 _tokensToDistribute = _calculateTokensToDistribute(_currentTranche, _vestingSchedule.tokensPerTranche, _vestingSchedule.numClaimedVestedTokens);

    _vestingSchedule.numClaimedVestedTokens = _vestingSchedule.numClaimedVestedTokens.add(_tokensToDistribute);
    _vestingSchedule.numUnclaimedVestedTokens = _vestingSchedule.numUnclaimedVestedTokens.sub(_tokensToDistribute);

    require(ISecurityToken(securityToken).transferFrom(
      address(this),
      msg.sender,
      _tokensToDistribute), "Unable to transfer tokens");

    emit TokensCollected(
      msg.sender,
      _whichVestingSchedule,
      _vestingSchedule.vestingId,
      _tokensToDistribute
    );
  }

  /**
  * @notice Push vested tokens
  * @param _target Address of the employee or the affiliate
  * @param _whichVestingSchedule Index of the vesting schedule for the target
  */
  function pushVestedTokens(address _target, uint256 _whichVestingSchedule)
    public
  {
    VestingSchedule memory _vestingSchedule = individualVestingDetails[_target][_whichVestingSchedule];

    require(_vestingSchedule.vestingId != 0, "Schedule not initialized");  // TODO: May need to check a flag. Asked on Github. There may be an ID if we don't have to delete this.
    require(_vestingSchedule.numUnvestedTokens != 0, "No tokens remain");  // TODO: May need to check a flag. Asked on Github. There may be an ID if we don't have to delete this.

    uint256 _currentTranche = _calculateCurrentTranche(_vestingSchedule.startDate, _vestingSchedule.vestingDuration);
    uint256 _tokensToDistribute = _calculateTokensToDistribute(_currentTranche, _vestingSchedule.tokensPerTranche, _vestingSchedule.numClaimedVestedTokens);

    _vestingSchedule.numClaimedVestedTokens = _vestingSchedule.numClaimedVestedTokens.add(_tokensToDistribute);
    _vestingSchedule.numUnclaimedVestedTokens = _vestingSchedule.numUnclaimedVestedTokens.sub(_tokensToDistribute);


    require(ISecurityToken(securityToken).transferFrom(
      address(this),
      _target,
      _tokensToDistribute), "Unable to transfer tokens");

    emit TokensCollected(
      _target,
      _whichVestingSchedule,
      _vestingSchedule.vestingId,
      _tokensToDistribute
    );
  }

  /**
  * @notice Initiate a vesting schedule for an employee or affiliate
  * @param _target Address of the employee or the affiliate
  * @param _totalAllocation Total number of tokens allocated for the target
  * @param _vestingDuration Total duration of the vesting schedule
  * @param _startDate Start date of the vesting schedule
  * @param _vestingFrequency Frequency of release of tokens
  */
  function _initiateVestingScheduleIterate(
    address _target,
    uint256 _totalAllocation,
    uint256 _vestingDuration,
    uint256 _startDate,
    uint256 _vestingFrequency
  )
    internal
  {
    require(_target != address(0), "The target should be a valid addrss");
    require(_totalAllocation != 0, "The total allocation should not be 0");
    require(_vestingDuration != 0, "The vestingDuration should not be 0");
    require(_startDate >= now, "The starting date should be after now");
    require(
      _vestingFrequency != 0 && _vestingFrequency <= _vestingDuration,
      "The vestingFrequency should not be 0 and it should be less than the duration");
    require(_vestingDuration % _vestingFrequency == 0, "The vesting frequency should be a multiple of the vesting duration");
    require(ISecurityToken(securityToken).balanceOf(address(this)) >= _totalAllocation, "Tokens must have been already sent to the smart contract");

    uint256 _numTranches = _vestingDuration.div(_vestingFrequency);
    require(_totalAllocation % _numTranches == 0, "The total allocation should be a multiple of the number of tranches");
    uint256 _tokensPerTranche = _totalAllocation.div(_numTranches);

    bytes32 _vestingId = keccak256(
      abi.encodePacked(
        block.timestamp,
        _target,
        _totalAllocation,
        _vestingDuration,
        _startDate,
        _vestingFrequency
      )
    );

    uint256 _individualVestingCount = individualVestingCount[_target];
    individualVestingCount[_target] += 1;

    uint256 _numUnvestedTokens = _totalAllocation;

    individualVestingDetails[_target][_individualVestingCount] = VestingSchedule({
      vestingId: _vestingId,
      totalAllocation: _totalAllocation,
      vestingDuration: _vestingDuration,
      startDate: _startDate,
      vestingFrequency: _vestingFrequency,
      numVestedTokens: 0,
      numUnvestedTokens: _numUnvestedTokens,
      numClaimedVestedTokens: 0,
      numUnclaimedVestedTokens: 0,
      tokensPerTranche: _tokensPerTranche
    });

    uint256 _tokensToSend = _calculateTokensToSend(_totalAllocation);

    if (_tokensToSend != 0) {
      require(ISecurityToken(securityToken).transferFrom(
        msg.sender,
        address(this),
        _totalAllocation), "Unable to transfer tokens");
    }

    emit VestingStarted(
      _target,
      _vestingId,
      _totalAllocation,
      _vestingDuration,
      _startDate,
      _vestingFrequency,
      0,
      _numUnvestedTokens,
      0,
      0,
      _tokensPerTranche
    );
  }

  /**
  * @notice Calculate the current tranche the user is on
  * @param _startDate Start date of the vesting period
  * @param _vestingDuration Total duration of the vesting schedule
  */
  function _calculateCurrentTranche(
    uint256 _startDate,
    uint256 _vestingDuration
  )
    internal
    view
    returns (uint256)
  {
    return now < _startDate
    ? 0
    : (now.sub(_startDate)).div(_vestingDuration);
  }

  /**
  * @notice Calculate the number of tokens to distribute per transaction
  * @param _currentTranche Current tranche of the vesting schedule
  * @param _tokensPerTranche Number of tokens to distribute in each tranche
  * @param _numClaimedVestedTokens Number of vested tokens claimed thus far
  */
  function _calculateTokensToDistribute(
    uint256 _currentTranche,
    uint256 _tokensPerTranche,
    uint256 _numClaimedVestedTokens
  )
    internal
    pure
    returns (uint256)
  {
    uint256 _tokensToDistribute = _currentTranche.mul(_tokensPerTranche);
    return _tokensToDistribute.sub(_numClaimedVestedTokens);
  }

  /**
  * @notice Calculate the number of tokens the issuer must send to the contract
  * @param _totalAllocation Total allocation being used for this instance
  */
  function _calculateTokensToSend(
    uint256 _totalAllocation
  )
    internal
    view
    returns (uint256)
  {
    if (numExcessTokens  > 0){
      if (numExcessTokens >= _totalAllocation) {
        return 0;
      } else {
        return _totalAllocation.sub(numExcessTokens);
      }
    } else {
      return _totalAllocation;
    }
  }

}
