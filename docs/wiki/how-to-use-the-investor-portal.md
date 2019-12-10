# How-to-Use-the-Investor-Portal

**Summary:** This CLI feature allows investors to manage their participation in any STO they have been whitelisted for.

**How it works \(High Level Overview\):**

Conditions that need to be met to use the investor portal successfully

1. If an investor is not whitelisted, all the STO information is listed but they can't invest. This will summon a red message stating "your KYC is expired". Note - Investors don't need to own security tokens previously.
2. The issuer does not interact with the investor portal as issuer.

If he does, it will be as an investor, with the same restrictions.

Investor Portal Steps:

1. Enter your public address to login as an investor
2. Enter your private key \(this step is skipped if you login as the issuer\) 
3. Enter the symbol of the security token previously registered \(Step 2\) a\) above\)
4. Current STO information is shown, including if logged investor is whitelisted and accredited
5. If STO is open and investor is whitelisted, you are able to invest and current prices of funding raise types are shown
6. If both POLY and ETH are allowed, select one \(If you want to have this investor invest with POLY, you will need to mint test POLY tokens for that account as well - follow step 1 of this guide\)
7. Enter amount of selected currency you want to invest
8. Updated information is shown including how many tokens were bought

## How to Use this CLI Feature \(Instructions\):

### In order to get your issuer account funded you need to run the following commands:

Run investor\_portal command

```text
$ node CLI/polymath-cli investor_portal [investor] [symbol] [currency] [amount]  
OR
$ node CLI/polymath-cli i [investor] [symbol] [currency] [amount]
```

**NOTE: \[example\] fields are additional inputs that are optional when running a CLI feature command**

## Example Scenario 1 \(Token Issuer\):

```text
********************************************
Welcome to the Command-Line Investor Portal.
********************************************
```

### Example Scenario 2 \(Token Investor\):

```text

```

## Troubleshooting / FAQs

n/a

