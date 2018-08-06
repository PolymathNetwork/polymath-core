---

eip: ???
title: Standard for Security Tokens  
author: polymath, adam, pablo, fabian, stephane
discussions-to: st20@polymath.network
status: Draft  
type: Standards Track  
category: ERC  
created: 2018-05-08
require: ERC20 (token), ERC777 (token), ERC1066 (error codes), ERC165 (interface specification), ERC820 (interface registry)

---

## Simple Summary

A standard interface for tokens which represent securities on-chain.

## Abstract

Whilst this standard is not directly backwards compatible with ERC20, it is trivial to provide implementations to make it so (see `ERC20Adaptor.sol`).

### Token Metadata

Standard provides a flexible way to attach a set of named external assets to the token.

This is done through the `details` mapping from the asset name, to it's external URL. For example bytes32('legend') could map to a URL detailing the general transfer restrictions on this security (i.e. the share certificate legend).

### Individual Token Metadata

Tokens that represent securities often require metadata to be attached to individual tokens.

This metadata groups tokens into sets of tokens where each token in a set shares common metadata.

Metadata is represented by a `bytes32 tranche`, which can be further linked to additional data as any implementation requires.

Token fungibility includes metadata so we have:
  - tokens within a given token sets are fungible
  - tokens from different token sets may not be fungible

### Transfer Restrictions

Transfer restrictions are assessed at the (sender, receiver, tranche, amount, approval) granularity.

To provide additional transparency over the reasons why a transfer may fail, `verifyTransfer` is used.

The `bytes _approval` provides an optional mechanism for an authorised person to provide a one-off approval (which can be interpreted and validated inside `verifyTransfer`). This provides an off-chain approval model to complement any on-chain enforced rules. `_approval` can be empty if not required for a particular transaction.

`transferTranche` / `transferTrancheFrom` must respect the outcome of `verifyTransfer`.

TODO: Consider whether `bool _isTransfer` should be a parameter to `verifyTransfer`.

Since such tokens represent ownership in real off-chain assets, there should also be more clarity in terms of how and when such tokens can be created. ERC20 does not provide any specification around the way in which tokens are created, concerning itself only with how such tokens are then subsequently transferred.

## Motivation

A standard interface for tokens that represent securitised assets allows such tokens to be consistently managed by third parties including exchanges, wallets and custodial services.

For tokens representing securitised assets, having clarity around a single standard for managing transfer restrictions and token creation will help drive reasonable and clear regulation in this area.

## Specification

### ERCxxxToken (Token Interface)

TODO: Use ERC777 instead of ERC20 as base contract

TODO: Specify interface registration approach (either using ERC820, or the STR)

TODO: Split into true interface and implementation (remove data structures)

TODO: Split out ERC20 implementation from ST20 interface

```
interface IERCxxx is ERC20 {

    // Mapping of information types to their corresponding external URLs
    // TODO: Look at ERC1046
    mapping (bytes32 => bytes) details;

    // Tranches considered during ERC20 / ERC777 transfers - should be part of ERC20Adaptor.sol
    bytes32[] defaultTranches;

    // TODO: Interface is actually addDefaultTranches / removeDefaultTranches / getDefaultTranches functions

    // Represents a fungible set of tokens.
    struct TokenData {
        uint256 amount;
        bytes32 tranche;
    }

    // Mapping from investor to aggregated balance across all investor token sets
    mapping (address => uint256) investorBalances;

    // Mapping from investor to their fungible token sets
    mapping (address => TokenData[]) investorTokenSets;

    // Mapping from (investor, tranche) to index of corresponding tranche in investorTokenSets
    mapping (address => mapping (bytes32 => uint256)) trancheToIndex;

    // Mapping from (investor, tranche, operator) to approved amount
    mapping (address => mapping (bytes32 => mapping (address => uint256))) trancheApprovals;

    // Mapping from (investor, operator) to approved amount (can be used against any tranches)
    mapping (address => mapping (address => uint256)) allowances;

    // Returns sum of amounts over all owned fungible token sets for investor     
    function balanceOf(address _investor) returns (uint256) {
        return investorBalances[_investor];
    }

    // Returns restricted token balance
    function balanceOfTranche(address _investor, bytes32 _tranche) returns (uint256 balance) {
        return investorTokenSets[_investor][trancheToIndex[_investor][_tranche]].amount;
    }

    // Returns total supply of token {sum across all user} investorBalances(user)
    function totalSupply() returns (uint256);

    // TODO: Think about the best type of return code. Ideally, if it is a failure code, it would include the TMs and their individual return codes
    // See: ERC-1066

    // TODO: Think about the best specification for `bytes _approval`

    // Extended transfer functions for tranches
    // Should reduce investorTokenSets[msg.sender][trancheToIndex[msg.sender][_tranche]].amount
    // Should increase balanceOf(_to) by this amount, and update or add a new TokenData to investorTokenSets[_to] by the same amount.
    // Determining the new tranche (and any corresponding metadata) is an implementation detail.
    function transferTranche(address _to, uint256 _amount, bytes32 _tranche, bytes _approval) public view returns (byte reason);
    function transferTrancheFrom(address _from, address _to, uint256 _amount, bytes32 _tranche, bytes _approval) public view returns (byte reason);

    // TODO: Could include batch versions of these functions that take uint256[] _tranches, uint256[] _amounts and iterate across sets of tokens.

    // Determine whether a reason code represents a success or failure
    function isSuccess(byte _reason) returns (bool success);

    // ERC20 compatible transfer functions - sample implementation - should be part of ERC20Adaptor.sol
    function transfer(address _to, uint256 _amount) public view returns (bool success) {
        uint256 runningAmount = _amount;
        byte success;
        for (uint8 i = 0; i < defaultTranches.length; i++) {
            uint256 trancheAmount = Math.min(balanceOfTranche(msg.sender, defaultTranches[i]), runningAmount);
            require(isSuccess(transferTranche(_to, trancheAmount, defaultTranches[i], bytes(0))));
            runningAmount = runningAmount - trancheAmount;
            if (runningAmount == 0) {
                break;
            }
        }
    }

    // transferTranche, transferTrancheFrom must respect the result of verifyTransfer    
    function verifyTransfer(address _from, address _to, bytes32 _tranche, uint256 _amount, bytes _approval) public view returns (byte reason);

    // approval functions
    function approveTranche(address _operator, bytes32 _tranche, uint256 _amount) {
        trancheApprovals[msg.sender][_tranche][_operator] = _amount;
    }

    // approval can be used against any tranche - ERC20 compatible
    function approve(address _operator, uint256 _amount) {
        allowances[msg.sender][_operator] = _amount;
    }

    // Allow tokens to be moved between tranches
    //
    function changeTranche(address _investor, bytes32 _oldTranche, bytes32 _newTranche, uint256 _amount, bytes _approval) returns (byte reason) {
        // check msg.sender && _approval is valid
        investorTokenSets[_investor][trancheToIndex[_investor][_oldTranche]].amount -= _amount;
        investorTokenSets[_investor][trancheToIndex[_investor][_newTranche]].amount += _amount;
    }

    // TODO: should we have a `verifyChangeTranche` function as part of the standard

    // Any increases to totalSupply must happen in mint.
    function mint(address _investor, bytes32 _tranche, uint256 _amount) public returns (byte reason);

    // Any decreases to totalSupply must happen in burn
    function burn(address _investor, bytes32 _tranche, uint256 _amount) public returns (byte reason);

    // Must be emitted on any increase to totalSupply
    event Minted(address indexed investor, bytes32 tranche, uint256 amount);

    // Must be emitted on any decrease to totalSupply
    event Burnt(address indexed investor, bytes32 tranche, uint256 amount);

    // Once forceTransfersDisabled is set to true, it can never be set back to false
    bool forceTransfersDisabled;

    // Allows authorised user to force transfer any unrestricted shares.
    // Only restriction is that _from has sufficient balance
    function forceTransferTrancheFrom(address _from, address _to, bytes32 _tranche, uint256 _amount) returns (byte reason);

}
```

TODO: All of the below needs to be updated

### Methods

verifyTransfer

`function verifyTransfer(address _from, address _to, uint256 _amount) public view returns (bool success);`

Returns either true or false, indicating whether the transfer of `_amount` tokens from `_from` to `_to` would succeed.

`verifyTransfer` should not throw for any valid arguments, but always return either `true` or `false`.

Any call to `transfer` or `transferFrom` should respect the result of `verifyTransfer`. So if `verifyTransfer` returns false for a given set of arguments, then a call made to `transfer` or `transferFrom`, in the same transaction, with no intermediary state changes in the token or associated contracts should fail (either by returning false, or throwing). Correspondingly if `verifyTransfer` returns true, then with the same conditions, `transfer` and `transferFrom` should succeed.

Note - if a call to `verifyTransfer` is executed, and the corresponding call to `transfer` or `transferFrom` is then executed in a subsequent transaction (or token state is modified between the call to `verifyTransfer` and `transfer` or `transferFrom`) then there are no guarantees on the behaviour of `transfer` or `transferFrom`.

mint

`function mint(address _investor, uint256 _amount) public returns (bool success);`

Returns either true or false, indicating whether or not the creation of `_amount` tokens and allocation of these tokens to `_investor` succeeded or failed. Callers must check the return value, and not assume that this function will throw on failure.

Any increase to the tokens `totalSupply` must happen through a call to `mint`. This includes any initialisation of the `totalSupply` value.

A successful execution of this function should emit a corresponding `Minted` event representing the number of tokens created, and the address to which these tokens have been allocated.

burn

`function burn(address _investor, uint256 _amount) public returns (bool success);`

Returns either true or false, indicating whether or not the destruction of `_amount` tokens held by `_investor` succeeded or failed. Callers must check the return value, and not assume that this function will throw on failure.

Any decrease to the tokens `totalSupply` must happen through a call to `burn`.

Note - tokens can still effectively be burnt outside of this function by transferring them to an unreachable address (e.g. 0x0) but this would not reduce the official `totalSupply`.

A successful execution of this function should emit a corresponding `Burnt` event representing the number of tokens destroyed, and the address from which these tokens were taken.

## Rationale

This standard solves some of the problems of ERC20 tokens with respect to representing securitised assets on the Ethereum blockchain. By providing a standard that all security tokens can easily conform to, development of associated services and platforms (e.g. exchanges, wallets, custodial, identity) can easily and uniformly deal with such tokens.

By insisting that such tokens are registered via ERC820, third parties can easily check on-chain whether a token implements these additional functions on top of ERC20 and use them appropriately.

The tokenisation of securities on the blockchain is a major use-case and natural progression from the more general ERC20 and associated token standards.

As an example, an exchange wishing to determine whether or not to allow Adam to purchase 100 SEC tokens from Bob could check on-chain the results of:  
```
verifyTransfer(bob_address, adam_address, 100)
verifyTransfer(exchange_address, adam_address, 100)
```
before adjusting its internal ledger (which may not involve any actual call to `transfer` or `transferFrom`) to reflect the trade.

As a further example, any regulator / auditor can review the conditions under which `mint` can be called, and ensure that the creating of tokens is valid under security regulations.

## Backwards Compatibility

ERCxxx is a super-set of ERC20 and as such is entirely backwards compatible with the ERC20 standard. Any token implementing ERCxxx must also implement the full ERC20 standard.

## Test Cases
[Link to Polymath GitHub repo w/ documentation / test cases]

## Implementation
[Link to Polymath GitHub repo w/ reference implementation]

## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
