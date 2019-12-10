# How to set up and use the POLY Faucet

**Summary:** This is the Poly faucet for local private networks.

**How the Faucet Works**:

This feature is for getting the Issuer Account funded so that you can go through the processes of setting up your STO, editing it, launching it and much more.

**How to Use this CLI Feature \(Instructions\):**

In order to get your issuer account funded you need to run the following commands to get POLY.

To start, run either of the following commands \(note- the inputs in brackets are optional\):

```text
$ node CLI/polymath-cli faucet [beneficiary] [amount]  OR  $ node CLI/polymath-cli f [beneficiary] [amount]
```

Example Output:

```text
***************************
Welcome to the POLY Faucet.
***************************

Issuer Account: 0x02d502D968d3dBa68A9Db31B656fb0201dD0151f

Hello user, your current balance is  '1000000 POLY'
```

**Note**: Above you can see that the account had already been funded with a large POLY balance

```text
[1] 250 POLY for ticker registration
[2] 500 POLY for token launch + ticker reg
[3] 20K POLY for CappedSTO Module
[4] 20.5K POLY for Ticker + Token + CappedSTO
[5] 100.5K POLY for Ticker + Token + USDTieredSTO
[6] As many POLY as you want
[7] 10K USD Tokens
[0] CANCEL
```

As seen above, you simply select the option you want for funding by choosing one of the number options.

Example Scenario:

```text
What do you want to do? [1...7 / 0]: 5
Selected: 100.5K POLY for Ticker + Token + USDTieredSTO
Enter beneficiary of 100.5K POLY ('0x02d502D968d3dBa68A9Db31B656fb0201dD0151f'): 0x02d502D968d3dBa68A9Db31B656fb0201dD0151f
```

**Above, we selected a 100.5 k POLY**

Example Output:

```text
---- Transaction executed: getTokens - Gas limit provided: 44239 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x1280112b75c723142d73c07c7dc3713f33f85e50b4d4d92fca0b694469e2d90f

  Congratulations! The transaction was successfully completed.
  Gas used: 36866 - Gas spent: 0.0018433 Ether
  Review it on Etherscan.
  TxHash: 0x1280112b75c723142d73c07c7dc3713f33f85e50b4d4d92fca0b694469e2d90f

Congratulations! balance of 0x02d502D968d3dBa68A9Db31B656fb0201dD0151f address is 1100500 POLY
```

Above, the account was just funded more POLY and I can now go about registering a ticket, setting my STO up, etc...

**Troubleshooting / FAQs**

N/A

