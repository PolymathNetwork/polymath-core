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
    uint256 numClaimedVestedTokens,
    uint256 tokensPerTranche
  );

  event AddTemplate(
    uint256 indexed templateNumber,
    uint256 totalAllocation,
    uint256 vestingDuration,
    uint256 vestingFrequency
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
      require(_treasury != address(0), "Treasury should not be 0");
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
    require(_totalAllocation != 0, "Total allocation was initialized to 0");
    require(_vestingDuration != 0, "Vesting duration was initialized to 0");
    require(_vestingFrequency != 0, "Vesting frequency was initialized to 0");

    vestingTemplates[templateCount] = VestingTemplate(_totalAllocation, _vestingDuration, _vestingFrequency);

    emit AddTemplate(
      templateCount,
      _totalAllocation,
      _vestingDuration,
      _vestingFrequency);
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
    withPerm(ISSUER)
  {
    require(_target.length == _totalAllocation.length &&
            _target.length == _vestingDuration.length &&
            _target.length == _startDate.length &&
            _target.length == _vestingFrequency.length);

    for (uint i = 0; i < _target.length; i++) {
      initiateVestingScheduleIterate(_target[i],
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
  function initiateVestingScheduleFromTemplate(
    address[] _target,
    uint256   _templateNumber,
    uint256   _startDate
  )
    public
    onlyOwner
    withPerm(ISSUER)
  {
    VestingTemplate memory _vestingTemplate = vestingTemplates[_templateNumber];

    for (uint i = 0; i < _target.length; i++) {
      require(_target[i] != address(0));
      initiateVestingScheduleIterate(_target[i],
                                     _vestingTemplate.totalAllocation,
                                     _vestingTemplate.vestingDuration,
                                     _startDate,
                                     _vestingTemplate.vestingFrequency);
    }
  }

  /**
  * @notice Cancel a vesting schedule for an employee or affiliate
  * @param _target Address of the employee or the affiliate
  * @param _vestingScheduleIndex Index of the vesting schedule for the target
  * @param _revokeVestingSchedule True if the issuer is reclaiming the tokens out of the contract
  */
  function cancelVestingSchedule(address _target, uint256 _vestingScheduleIndex, bool _revokeVestingSchedule)
    public
    onlyOwner
  {
    VestingSchedule memory _vestingSchedule = individualVestingDetails[_target][_vestingScheduleIndex];

    require(_vestingSchedule.vestingId != 0, "Schedule not initialized");

    bytes32 _vestingId = _vestingSchedule.vestingId;
    uint256 _currentTranche = _calculateCurrentTranche(_vestingSchedule.startDate, _vestingSchedule.vestingDuration);
    uint256 _tokensToDistribute = _calculateTokensToDistribute(_currentTranche, _vestingSchedule.tokensPerTranche, _vestingSchedule.numClaimedVestedTokens);
    uint256 _numUnvestedTokens = _vestingSchedule.numUnvestedTokens.sub(_tokensToDistribute);
    delete individualVestingDetails[_target][_vestingScheduleIndex];

    // Send vested, unclaimed tokens to the target
    if (_tokensToDistribute != 0) {
      require(ISecurityToken(securityToken).transfer(
        _target,
        _tokensToDistribute), "Unable to transfer tokens");
    }

    // Send extra tokens to the treasury or hold them in the contract
    if (_numUnvestedTokens != 0) {
      if (_revokeVestingSchedule) {
        require(ISecurityToken(securityToken).transfer(
          // treasury,
          msg.sender,
          _numUnvestedTokens), "Unable to transfer tokens");
      } else {
        numExcessTokens = numExcessTokens.add(_numUnvestedTokens);
      }
    }

    emit VestingCancelled(
      _target,
      _vestingScheduleIndex,
      _vestingId,
      _tokensToDistribute,
      _revokeVestingSchedule,
      block.timestamp
    );
  }

  /**
  * @notice Collect vested tokens
  * @param _vestingScheduleIndex Index of the vesting schedule for the target
  */
  function collectVestedTokens(uint256 _vestingScheduleIndex)
    public
  {
    _distributeVestedTokens(msg.sender, _vestingScheduleIndex);
  }

  /**
  * @notice Push vested tokens
  * @param _target Address of the employee or the affiliate
  * @param _vestingScheduleIndex Index of the vesting schedule for the target
  */
  function pushVestedTokens(address _target, uint256 _vestingScheduleIndex)
    public
    onlyOwner
  {
    _distributeVestedTokens(_target, _vestingScheduleIndex);
  }

  /**
  * @notice Distribute vested tokens
  * @param _target Address of the employee or the affiliate
  * @param _vestingScheduleIndex Index of the vesting schedule for the target
  */
  function _distributeVestedTokens(address _target, uint256 _vestingScheduleIndex)
    internal
  {
    VestingSchedule memory _vestingSchedule = individualVestingDetails[_target][_vestingScheduleIndex];

    require(_vestingSchedule.vestingId != 0, "Schedule not initialized");

    uint256 _currentTranche = _calculateCurrentTranche(_vestingSchedule.startDate, _vestingSchedule.vestingDuration);
    uint256 _tokensToDistribute = _calculateTokensToDistribute(_currentTranche, _vestingSchedule.tokensPerTranche, _vestingSchedule.numClaimedVestedTokens);

    require(_tokensToDistribute != 0, "No tokens remain");

    _vestingSchedule.numClaimedVestedTokens = _vestingSchedule.numClaimedVestedTokens.add(_tokensToDistribute);

    require(ISecurityToken(securityToken).transfer(
      _target,
      _tokensToDistribute), "Unable to transfer tokens");

    emit TokensCollected(
      _target,
      _vestingScheduleIndex,
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
  function initiateVestingScheduleIterate(
    address _target,
    uint256 _totalAllocation,
    uint256 _vestingDuration,
    uint256 _startDate,
    uint256 _vestingFrequency
  )
    public
    withPerm(ISSUER)
  {
    require(_target != address(0), "The target should be a valid addrss");
    require(_totalAllocation != 0, "The total allocation should not be 0");
    require(_vestingDuration != 0, "The vestingDuration should not be 0");
    require(_startDate >= now, "The starting date should be after now");
    require(
      _vestingFrequency != 0 && _vestingFrequency <= _vestingDuration,
      "The vestingFrequency should not be 0 and it should be less than the duration");
    require(_vestingDuration % _vestingFrequency == 0, "The vesting frequency should be a multiple of the vesting duration");

    uint256 _numTranches = _vestingDuration.div(_vestingFrequency);
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

    // Remove tokens from the excess token count if existing tokens are used
    if (_tokensToSend != _totalAllocation) {
      numExcessTokens = numExcessTokens.sub(_totalAllocation.sub(_tokensToSend));
    }

    if (_tokensToSend != 0) {
      require(ISecurityToken(securityToken).transferFrom(
        msg.sender,
        address(this),
        _tokensToSend), "Unable to transfer tokens");
    }

    emit VestingStarted(
      _target,
      _vestingId,
      _totalAllocation,
      _vestingDuration,
      _startDate,
      _vestingFrequency,
      _numUnvestedTokens,
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
