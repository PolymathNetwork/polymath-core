---
id: version-3.0.0-PolymathRegistry
title: PolymathRegistry
original_id: PolymathRegistry
---

# Core functionality for registry upgradability \(PolymathRegistry.sol\)

View Source: [contracts/PolymathRegistry.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/PolymathRegistry.sol)

**↗ Extends:** [**ReclaimTokens**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ReclaimTokens.md)**,** [**IPolymathRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPolymathRegistry.md)

**PolymathRegistry**

## Contract Members

**Constants & Variables**

```javascript
mapping(bytes32 => address) public storedAddresses;
```

## Functions

* [getAddress\(string \_nameKey\)](polymathregistry.md#getaddress)
* [changeAddress\(string \_nameKey, address \_newAddress\)](polymathregistry.md#changeaddress)

### getAddress

⤾ overrides [IPolymathRegistry.getAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPolymathRegistry.md#getaddress)

Gets the contract address

```javascript
function getAddress(string _nameKey) external view
returns(address)
```

**Returns**

address

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_nameKey | string | is the key for the contract address mapping |

### changeAddress

⤾ overrides [IPolymathRegistry.changeAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPolymathRegistry.md#changeaddress)

Changes the contract address

```javascript
function changeAddress(string _nameKey, address _newAddress) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_nameKey | string | is the key for the contract address mapping |
| \_newAddress | address | is the new contract address |

