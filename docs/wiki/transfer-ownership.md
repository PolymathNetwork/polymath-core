# Transfer-Ownership

## Summary

* This CLI feature allows Transfers of Ownership of an own contract to another account

## How it works

This feature command takes in two inputs: 1. The contract address of your security token 2. The ETH address you want to transfer ownership to

Ownership is then transferred once the command has been entered.

## How to Use this CLI Feature \(Instructions\):

Run the following command with your specific inputs:

`$ node CLI/polymath-cli transfer_ownership <contractAddress> <transferTo>`

**Example output**

```text
$ node CLI/polymath-cli transfer_ownership 0x4f48d6a0c822aeee6d33bd7ec4bcbf6904759647 0xb80ebb264e15d1e4c03040e1497881fc4fff2652
---- Transaction executed: transferOwnership - Gas limit provided: 36686 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x305523a011e62e86d2abff80b3648b745a845af2011dacc9033f29acec4ee413

  Congratulations! The transaction was successfully completed.
  Gas used: 30572 - Gas spent: 0.0015286 Ether
  Review it on Etherscan.
  TxHash: 0x305523a011e62e86d2abff80b3648b745a845af2011dacc9033f29acec4ee413

Ownership transferred successfully. New owner is 0xb80ebb264e15d1E4c03040e1497881FC4fff2652
```

## Troubleshooting / FAQs

* n/a 

