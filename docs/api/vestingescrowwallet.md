---
id: version-3.0.0-VestingEscrowWallet
title: VestingEscrowWallet
original_id: VestingEscrowWallet
---

# Wallet for core vesting escrow functionality \(VestingEscrowWallet.sol\)

View Source: [contracts/modules/Wallet/VestingEscrowWallet.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Wallet/VestingEscrowWallet.sol)

**↗ Extends:** [**VestingEscrowWalletStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VestingEscrowWalletStorage.md)**,** [**Wallet**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Wallet.md)

**VestingEscrowWallet**

**Enums**

### State

```javascript
enum State {
 CREATED,
 STARTED,
 COMPLETED
}
```

**Events**

```javascript
event AddSchedule(address indexed _beneficiary, bytes32  _templateName, uint256  _startTime);
event ModifySchedule(address indexed _beneficiary, bytes32  _templateName, uint256  _startTime);
event RevokeAllSchedules(address indexed _beneficiary);
event RevokeSchedule(address indexed _beneficiary, bytes32  _templateName);
event DepositTokens(uint256  _numberOfTokens, address  _sender);
event SendToTreasury(uint256  _numberOfTokens, address  _sender);
event SendTokens(address indexed _beneficiary, uint256  _numberOfTokens);
event AddTemplate(bytes32  _name, uint256  _numberOfTokens, uint256  _duration, uint256  _frequency);
event RemoveTemplate(bytes32  _name);
event TreasuryWalletChanged(address  _newWallet, address  _oldWallet);
```

## Functions

* [\(address \_securityToken, address \_polyAddress\)](vestingescrowwallet.md)
* [getInitFunction\(\)](vestingescrowwallet.md#getinitfunction)
* [configure\(address \_treasuryWallet\)](vestingescrowwallet.md#configure)
* [changeTreasuryWallet\(address \_newTreasuryWallet\)](vestingescrowwallet.md#changetreasurywallet)
* [\_setWallet\(address \_newTreasuryWallet\)](vestingescrowwallet.md#_setwallet)
* [depositTokens\(uint256 \_numberOfTokens\)](vestingescrowwallet.md#deposittokens)
* [\_depositTokens\(uint256 \_numberOfTokens\)](vestingescrowwallet.md#_deposittokens)
* [sendToTreasury\(uint256 \_amount\)](vestingescrowwallet.md#sendtotreasury)
* [getTreasuryWallet\(\)](vestingescrowwallet.md#gettreasurywallet)
* [pushAvailableTokens\(address \_beneficiary\)](vestingescrowwallet.md#pushavailabletokens)
* [pullAvailableTokens\(\)](vestingescrowwallet.md#pullavailabletokens)
* [addTemplate\(bytes32 \_name, uint256 \_numberOfTokens, uint256 \_duration, uint256 \_frequency\)](vestingescrowwallet.md#addtemplate)
* [\_addTemplate\(bytes32 \_name, uint256 \_numberOfTokens, uint256 \_duration, uint256 \_frequency\)](vestingescrowwallet.md#_addtemplate)
* [removeTemplate\(bytes32 \_name\)](vestingescrowwallet.md#removetemplate)
* [getTemplateCount\(\)](vestingescrowwallet.md#gettemplatecount)
* [getAllTemplateNames\(\)](vestingescrowwallet.md#getalltemplatenames)
* [addSchedule\(address \_beneficiary, bytes32 \_templateName, uint256 \_numberOfTokens, uint256 \_duration, uint256 \_frequency, uint256 \_startTime\)](vestingescrowwallet.md#addschedule)
* [\_addSchedule\(address \_beneficiary, bytes32 \_templateName, uint256 \_numberOfTokens, uint256 \_duration, uint256 \_frequency, uint256 \_startTime\)](vestingescrowwallet.md#_addschedule)
* [addScheduleFromTemplate\(address \_beneficiary, bytes32 \_templateName, uint256 \_startTime\)](vestingescrowwallet.md#addschedulefromtemplate)
* [\_addScheduleFromTemplate\(address \_beneficiary, bytes32 \_templateName, uint256 \_startTime\)](vestingescrowwallet.md#_addschedulefromtemplate)
* [modifySchedule\(address \_beneficiary, bytes32 \_templateName, uint256 \_startTime\)](vestingescrowwallet.md#modifyschedule)
* [\_modifySchedule\(address \_beneficiary, bytes32 \_templateName, uint256 \_startTime\)](vestingescrowwallet.md#_modifyschedule)
* [revokeSchedule\(address \_beneficiary, bytes32 \_templateName\)](vestingescrowwallet.md#revokeschedule)
* [\_deleteUserToTemplates\(address \_beneficiary, bytes32 \_templateName\)](vestingescrowwallet.md#_deleteusertotemplates)
* [\_deleteTemplateToUsers\(address \_beneficiary, bytes32 \_templateName\)](vestingescrowwallet.md#_deletetemplatetousers)
* [revokeAllSchedules\(address \_beneficiary\)](vestingescrowwallet.md#revokeallschedules)
* [\_revokeAllSchedules\(address \_beneficiary\)](vestingescrowwallet.md#_revokeallschedules)
* [getSchedule\(address \_beneficiary, bytes32 \_templateName\)](vestingescrowwallet.md#getschedule)
* [\_getScheduleState\(address \_beneficiary, bytes32 \_templateName\)](vestingescrowwallet.md#_getschedulestate)
* [getTemplateNames\(address \_beneficiary\)](vestingescrowwallet.md#gettemplatenames)
* [getScheduleCount\(address \_beneficiary\)](vestingescrowwallet.md#getschedulecount)
* [\_getAvailableTokens\(address \_beneficiary, uint256 \_index\)](vestingescrowwallet.md#_getavailabletokens)
* [\_getReleasedTokens\(address \_beneficiary, uint256 \_index\)](vestingescrowwallet.md#_getreleasedtokens)
* [pushAvailableTokensMulti\(uint256 \_fromIndex, uint256 \_toIndex\)](vestingescrowwallet.md#pushavailabletokensmulti)
* [addScheduleMulti\(address\[\] \_beneficiaries, bytes32\[\] \_templateNames, uint256\[\] \_numberOfTokens, uint256\[\] \_durations, uint256\[\] \_frequencies, uint256\[\] \_startTimes\)](vestingescrowwallet.md#addschedulemulti)
* [addScheduleFromTemplateMulti\(address\[\] \_beneficiaries, bytes32\[\] \_templateNames, uint256\[\] \_startTimes\)](vestingescrowwallet.md#addschedulefromtemplatemulti)
* [revokeSchedulesMulti\(address\[\] \_beneficiaries\)](vestingescrowwallet.md#revokeschedulesmulti)
* [modifyScheduleMulti\(address\[\] \_beneficiaries, bytes32\[\] \_templateNames, uint256\[\] \_startTimes\)](vestingescrowwallet.md#modifyschedulemulti)
* [\_checkSchedule\(address \_beneficiary, bytes32 \_templateName\)](vestingescrowwallet.md#_checkschedule)
* [\_isTemplateExists\(bytes32 \_name\)](vestingescrowwallet.md#_istemplateexists)
* [\_validateTemplate\(uint256 \_numberOfTokens, uint256 \_duration, uint256 \_frequency\)](vestingescrowwallet.md#_validatetemplate)
* [\_sendTokens\(address \_beneficiary\)](vestingescrowwallet.md#_sendtokens)
* [\_sendTokensPerSchedule\(address \_beneficiary, uint256 \_index\)](vestingescrowwallet.md#_sendtokensperschedule)
* [getPermissions\(\)](vestingescrowwallet.md#getpermissions)

Constructor

```javascript
function (address _securityToken, address _polyAddress) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyAddress | address | Address of the polytoken |

### getInitFunction

⤾ overrides [IModule.getInitFunction](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getinitfunction)

This function returns the signature of the configure function

```javascript
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### configure

Used to initialize the treasury wallet address

```javascript
function configure(address _treasuryWallet) public nonpayable onlyFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_treasuryWallet | address | Address of the treasury wallet |

### changeTreasuryWallet

Used to change the treasury wallet address

```javascript
function changeTreasuryWallet(address _newTreasuryWallet) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newTreasuryWallet | address | Address of the treasury wallet |

### \_setWallet

```javascript
function _setWallet(address _newTreasuryWallet) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newTreasuryWallet | address |  |

### depositTokens

Used to deposit tokens from treasury wallet to the vesting escrow wallet

```javascript
function depositTokens(uint256 _numberOfTokens) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_numberOfTokens | uint256 | Number of tokens that should be deposited |

### \_depositTokens

```javascript
function _depositTokens(uint256 _numberOfTokens) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_numberOfTokens | uint256 |  |

### sendToTreasury

Sends unassigned tokens to the treasury wallet

```javascript
function sendToTreasury(uint256 _amount) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_amount | uint256 | Amount of tokens that should be send to the treasury wallet |

### getTreasuryWallet

Returns the treasury wallet address

```javascript
function getTreasuryWallet() public view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### pushAvailableTokens

Pushes available tokens to the beneficiary's address

```javascript
function pushAvailableTokens(address _beneficiary) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address of the beneficiary who will receive tokens |

### pullAvailableTokens

Used to withdraw available tokens by beneficiary

```javascript
function pullAvailableTokens() external nonpayable whenNotPaused
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### addTemplate

Adds template that can be used for creating schedule

```javascript
function addTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 | Name of the template will be created |
| \_numberOfTokens | uint256 | Number of tokens that should be assigned to schedule |
| \_duration | uint256 | Duration of the vesting schedule |
| \_frequency | uint256 | Frequency of the vesting schedule |

### \_addTemplate

```javascript
function _addTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 |  |
| \_numberOfTokens | uint256 |  |
| \_duration | uint256 |  |
| \_frequency | uint256 |  |

### removeTemplate

Removes template with a given name

```javascript
function removeTemplate(bytes32 _name) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 | Name of the template that will be removed |

### getTemplateCount

Returns count of the templates those can be used for creating schedule

```javascript
function getTemplateCount() external view
returns(uint256)
```

**Returns**

Count of the templates

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getAllTemplateNames

Gets the list of the template names those can be used for creating schedule

```javascript
function getAllTemplateNames() external view
returns(bytes32[])
```

**Returns**

bytes32 Array of all template names were created

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### addSchedule

Adds vesting schedules for each of the beneficiary's address

```javascript
function addSchedule(address _beneficiary, bytes32 _templateName, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency, uint256 _startTime) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address of the beneficiary for whom it is scheduled |
| \_templateName | bytes32 | Name of the template that will be created |
| \_numberOfTokens | uint256 | Total number of tokens for created schedule |
| \_duration | uint256 | Duration of the created vesting schedule |
| \_frequency | uint256 | Frequency of the created vesting schedule |
| \_startTime | uint256 | Start time of the created vesting schedule |

### \_addSchedule

```javascript
function _addSchedule(address _beneficiary, bytes32 _templateName, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency, uint256 _startTime) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_templateName | bytes32 |  |
| \_numberOfTokens | uint256 |  |
| \_duration | uint256 |  |
| \_frequency | uint256 |  |
| \_startTime | uint256 |  |

### addScheduleFromTemplate

Adds vesting schedules from template for the beneficiary

```javascript
function addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address of the beneficiary for whom it is scheduled |
| \_templateName | bytes32 | Name of the exists template |
| \_startTime | uint256 | Start time of the created vesting schedule |

### \_addScheduleFromTemplate

```javascript
function _addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_templateName | bytes32 |  |
| \_startTime | uint256 |  |

### modifySchedule

Modifies vesting schedules for each of the beneficiary

```javascript
function modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address of the beneficiary for whom it is modified |
| \_templateName | bytes32 | Name of the template was used for schedule creation |
| \_startTime | uint256 | Start time of the created vesting schedule |

### \_modifySchedule

```javascript
function _modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_templateName | bytes32 |  |
| \_startTime | uint256 |  |

### revokeSchedule

Revokes vesting schedule with given template name for given beneficiary

```javascript
function revokeSchedule(address _beneficiary, bytes32 _templateName) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address of the beneficiary for whom it is revoked |
| \_templateName | bytes32 | Name of the template was used for schedule creation |

### \_deleteUserToTemplates

```javascript
function _deleteUserToTemplates(address _beneficiary, bytes32 _templateName) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_templateName | bytes32 |  |

### \_deleteTemplateToUsers

```javascript
function _deleteTemplateToUsers(address _beneficiary, bytes32 _templateName) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_templateName | bytes32 |  |

### revokeAllSchedules

Revokes all vesting schedules for given beneficiary's address

```javascript
function revokeAllSchedules(address _beneficiary) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address of the beneficiary for whom all schedules will be revoked |

### \_revokeAllSchedules

```javascript
function _revokeAllSchedules(address _beneficiary) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |

### getSchedule

Returns beneficiary's schedule created using template name

```javascript
function getSchedule(address _beneficiary, bytes32 _templateName) external view
returns(uint256, uint256, uint256, uint256, uint256, enum VestingEscrowWallet.State)
```

**Returns**

beneficiary's schedule data \(numberOfTokens, duration, frequency, startTime, claimedTokens, State\)

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address of the beneficiary who will receive tokens |
| \_templateName | bytes32 | Name of the template was used for schedule creation |

### \_getScheduleState

```javascript
function _getScheduleState(address _beneficiary, bytes32 _templateName) internal view
returns(enum VestingEscrowWallet.State)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_templateName | bytes32 |  |

### getTemplateNames

Returns list of the template names for given beneficiary's address

```javascript
function getTemplateNames(address _beneficiary) external view
returns(bytes32[])
```

**Returns**

List of the template names that were used for schedule creation

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address of the beneficiary |

### getScheduleCount

Returns count of the schedules were created for given beneficiary

```javascript
function getScheduleCount(address _beneficiary) external view
returns(uint256)
```

**Returns**

Count of beneficiary's schedules

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address of the beneficiary |

### \_getAvailableTokens

```javascript
function _getAvailableTokens(address _beneficiary, uint256 _index) internal view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_index | uint256 |  |

### \_getReleasedTokens

```javascript
function _getReleasedTokens(address _beneficiary, uint256 _index) internal view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_index | uint256 |  |

### pushAvailableTokensMulti

Used to bulk send available tokens for each of the beneficiaries

```javascript
function pushAvailableTokensMulti(uint256 _fromIndex, uint256 _toIndex) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_fromIndex | uint256 | Start index of array of beneficiary's addresses |
| \_toIndex | uint256 | End index of array of beneficiary's addresses |

### addScheduleMulti

Used to bulk add vesting schedules for each of beneficiary

```javascript
function addScheduleMulti(address[] _beneficiaries, bytes32[] _templateNames, uint256[] _numberOfTokens, uint256[] _durations, uint256[] _frequencies, uint256[] _startTimes) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiaries | address\[\] | Array of the beneficiary's addresses |
| \_templateNames | bytes32\[\] | Array of the template names |
| \_numberOfTokens | uint256\[\] | Array of number of tokens should be assigned to schedules |
| \_durations | uint256\[\] | Array of the vesting duration |
| \_frequencies | uint256\[\] | Array of the vesting frequency |
| \_startTimes | uint256\[\] | Array of the vesting start time |

### addScheduleFromTemplateMulti

Used to bulk add vesting schedules from template for each of the beneficiary

```javascript
function addScheduleFromTemplateMulti(address[] _beneficiaries, bytes32[] _templateNames, uint256[] _startTimes) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiaries | address\[\] | Array of beneficiary's addresses |
| \_templateNames | bytes32\[\] | Array of the template names were used for schedule creation |
| \_startTimes | uint256\[\] | Array of the vesting start time |

### revokeSchedulesMulti

Used to bulk revoke vesting schedules for each of the beneficiaries

```javascript
function revokeSchedulesMulti(address[] _beneficiaries) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiaries | address\[\] | Array of the beneficiary's addresses |

### modifyScheduleMulti

Used to bulk modify vesting schedules for each of the beneficiaries

```javascript
function modifyScheduleMulti(address[] _beneficiaries, bytes32[] _templateNames, uint256[] _startTimes) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiaries | address\[\] | Array of the beneficiary's addresses |
| \_templateNames | bytes32\[\] | Array of the template names |
| \_startTimes | uint256\[\] | Array of the vesting start time |

### \_checkSchedule

```javascript
function _checkSchedule(address _beneficiary, bytes32 _templateName) internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_templateName | bytes32 |  |

### \_isTemplateExists

```javascript
function _isTemplateExists(bytes32 _name) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 |  |

### \_validateTemplate

```javascript
function _validateTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_numberOfTokens | uint256 |  |
| \_duration | uint256 |  |
| \_frequency | uint256 |  |

### \_sendTokens

```javascript
function _sendTokens(address _beneficiary) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |

### \_sendTokensPerSchedule

```javascript
function _sendTokensPerSchedule(address _beneficiary, uint256 _index) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_index | uint256 |  |

### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Return the permissions flag that are associated with VestingEscrowWallet

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


