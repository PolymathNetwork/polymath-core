---
id: version-3.0.0-IPolymathRegistry
title: IPolymathRegistry
original_id: IPolymathRegistry
---

# IPolymathRegistry.sol

View Source: [contracts/interfaces/IPolymathRegistry.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/IPolymathRegistry.sol)

**↘ Derived Contracts:** [**PolymathRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PolymathRegistry.md)

**IPolymathRegistry**

**Events**

```javascript
event ChangeAddress(string  _nameKey, address indexed _oldAddress, address indexed _newAddress);
```

## Functions

* [getAddress\(string \_nameKey\)](ipolymathregistry.md#getaddress)
* [changeAddress\(string \_nameKey, address \_newAddress\)](ipolymathregistry.md#changeaddress)

### getAddress

⤿ Overridden Implementation\(s\): [PolymathRegistry.getAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PolymathRegistry.md#getaddress)

Returns the contract address

```javascript
function getAddress(string _nameKey) external view
returns(registryAddress address)
```

**Returns**

address

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_nameKey | string | is the key for the contract address mapping |

### changeAddress

⤿ Overridden Implementation\(s\): [PolymathRegistry.changeAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PolymathRegistry.md#changeaddress)

Changes the contract address

```javascript
function changeAddress(string _nameKey, address _newAddress) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_nameKey | string | is the key for the contract address mapping |
| \_newAddress | address | is the new contract address |

