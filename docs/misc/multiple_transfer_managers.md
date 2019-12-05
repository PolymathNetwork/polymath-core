# Multiple Transfer Managers

We consider the two most common types of exchanges:

* a CEX where the Issuer is willing to cede some control to the CEX for authorising users
* a DEX where the Issuer wants to maintain full control over who can trade tokens

We also consider the case where an Issuer may want to have multiple KYC providers

## CEX

The Issuer and the CEX reach an agreement that the CEX is allowed to authorise users to transfer and receive tokens from the CEX, following an appropriate authorisation process for the user.

The Issuer and the CEX should agree the set of rules which an investor must meet in order to become authorised. The Issuer adds the CEX's Ethereum address to its `GeneralTransferManager` module as any other investors.

The logic for verifying transfers from the exchange address to other addresses is same as any other transfer verification. It means `_to` is always need to be a part of the whitelist of `GeneralTransferManager`.

Authorised user can trade the secuities token at the exchange but if the investor wants to withdrawl the tokens from the exchange then investor should be the part of the issuer whitelist otherwise the transaction get failed. for ex -  
Alice is the whitelisted investor and wants to trade its tokens at the CEX then those token can be traded with the other non-whitelisted user \(Bob\) but authorised user over the CEX but Bob can't withdrawal the tokens from the CEX. For successful withdrawal Bob needs to whitelisted by the issuer at the `GeneralTransferManager` level.

### Notes

It may be that the exchange doesn't have a single exchange address \(i.e. each user has their own wallet\) which would make the implementation harder. This logic would then need to be determined on a case by case basis, but the exchange should be able to write their own TransferManager with appropriate rules and add it to the Polymath ecosystem.

## DEX

It may be that the Issuer does not want to delegate any responsibility to the DEX to authorise users.

In this case, the following is a straightforward approach:

* DEX contract is added to the `GeneralTransferManager` by the Issuer \(probably with no time restrictions\).
* Before allowing a user to deposit to the DEX, the DEX calls `verifyTransfer(DEXAddress, userAddress, amount)` and only allows the trade if this returns `valid`. This ensures that the user would be able to withdraw any deposited tokens if they decide to.
* Before allowing a user to buy tokens on the DEX, the DEX calls `verifyTransfer(DEXAddress, userAddress, amount)` and only allows the trade if this returns `valid`. This ensures that the user would be able to withdraw any deposited tokens if they decide to.
* The check to `verifyTransfer(userAddress, DEXAddress, amount)` is implicit in the deposit transfer, but an exchange could also call this explicitly if they wanted to, and for example only show SecurityTokens to the user for which this returns `valid`.

With this approach, users can only transfer tokens to the exchange if they are on the `GeneralTransferManager` with a `fromTime` in the past, and users can only purchase tokens on the exchange if they are on the `GeneralTransferManager` with a `toTime` in the past.

## Multiple KYC Providers

An issuer may want to have multiple KYC providers. In this case it is straightforward to add multiple TransferManagers to their SecurityToken, one per KYC provider, and each KYC provider can operate independently \(with the full set of authorised users being users who are authorised by any single KYC provider\).

The Issuer could subsequently remove one of the KYC providers TransferManagers from their SecurityToken if they were unhappy with the service \(although they would not get any POLY paid for the service refunded\).

