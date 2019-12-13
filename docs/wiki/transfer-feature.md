# Transfer-Feature

**Summary**:

This CLI Feature is for transfering security tokens to another account.

**How it works**

1. This feature command takes three inputs: 
2. i. Your Token Symbol 
3. ii. The ETH address you want to transfer tokens to
4. iii. The amount of tokens you want to transfer
5. Tokens are then transferred once the command is run.

**How to Use this CLI Feature \(Instructions\):**

To start, run the following command while inputting your own specific information in the &lt; &gt; brackets:

```text
$ node CLI/polymath-cli transfer <tokenSymbol> <transferTo> <transferAmount>
```

**Example**

```text
 $  node CLI/polymath-cli transfer LFV 0x23f95b881149018e3240a6c98d4ec3a111adc5df 10
```

```text
Token deployed at address 0xE447e88c37017550a9f85511cDaAEbC9529e845b.
---- Transaction executed: transfer - Gas limit provided: 67735 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xbe78a11f1c7f4609f859036067202c94e71137082fa37983771bd4381f31e325

  Congratulations! The transaction was successfully completed.
  Gas used: 56446 - Gas spent: 0.0028223 Ether

  Review it on Etherscan.
  TxHash: 0x**be78a11f1c7f4609f859036067202c94e71137082fa37983771bd4381f31e325**

  **Account 0x23f95b881149018E3240A6c98d4Ec3A111aDc5DF**
  **transferre**d 10 tokens to account 0x23f95b881149018E3240A6c98d4Ec3A111aDc5DF
```

**Above, 10 tokens were transferred to a selected address from another address \(for simplicity, the two addresses in the example are the same\)**

**Troubleshooting / FAQs**

* If there is an error while processing the transfer transaction, the most probable cause for this error is one of the involved accounts not being in the whitelist or under a lockup period.

