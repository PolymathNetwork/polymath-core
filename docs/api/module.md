---
id: version-3.0.0-Module
title: Module
original_id: Module
---

# Interface that any module contract should implement \(Module.sol\)

View Source: [contracts/modules/Module.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Module.sol)

**↗ Extends:** [**IModule**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md)**,** [**ModuleStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleStorage.md)**,** [**Pausable**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Pausable.md) **↘ Derived Contracts:** [**DividendCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DividendCheckpoint.md)**,** [**GeneralPermissionManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralPermissionManager.md)**,** [**STO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md)**,** [**TrackedRedemption**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TrackedRedemption.md)**,** [**TransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TransferManager.md)**,** [**VotingCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VotingCheckpoint.md)**,** [**Wallet**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Wallet.md)

**Module**

Contract is abstract

## Modifiers

* [withPerm](module.md#withperm)
* [onlyFactory](module.md#onlyfactory)

### withPerm

```javascript
modifier withPerm(bytes32 _perm) internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_perm | bytes32 |  |

### onlyFactory

```javascript
modifier onlyFactory() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


## Functions

* [\(address \_securityToken, address \_polyAddress\)](module.md)
* [\_checkPerm\(bytes32 \_perm, address \_caller\)](module.md#_checkperm)
* [\_onlySecurityTokenOwner\(\)](module.md#_onlysecuritytokenowner)
* [pause\(\)](module.md#pause)
* [unpause\(\)](module.md#unpause)
* [getDataStore\(\)](module.md#getdatastore)
* [reclaimERC20\(address \_tokenContract\)](module.md#reclaimerc20)
* [reclaimETH\(\)](module.md#reclaimeth)

Constructor

```javascript
function (address _securityToken, address _polyAddress) public nonpayable ModuleStorage
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyAddress | address |  |

### \_checkPerm

```javascript
function _checkPerm(bytes32 _perm, address _caller) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_perm | bytes32 |  |
| \_caller | address |  |

### \_onlySecurityTokenOwner

```javascript
function _onlySecurityTokenOwner() internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### pause

⤾ overrides [ISTO.pause](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ISTO.md#pause)

⤿ Overridden Implementation\(s\): [STO.pause](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md#pause)

Pause \(overridden function\)

```javascript
function pause() public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### unpause

Unpause \(overridden function\)

```javascript
function unpause() public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getDataStore

used to return the data store address of securityToken

```javascript
function getDataStore() public view
returns(contract IDataStore)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### reclaimERC20

Reclaims ERC20Basic compatible tokens

```javascript
function reclaimERC20(address _tokenContract) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tokenContract | address | The address of the token contract |

### reclaimETH

Reclaims ETH

```javascript
function reclaimETH() external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


