# Multiple Transfer Managers

We consider the two most common types of exchanges:  
  - a CEX where the Issuer is willing to cede some control to the CEX for authorising users
  - a DEX where the Issuer wants to maintain full control over who can trade tokens

We also consider the case where an Issuer may want to have multiple KYC providers

## CEX

The Issuer and the CEX reach an agreement that the CEX is allowed to authorise users to transfer and receive tokens from the CEX, following an appropriate authorisation process for the user.

The Issuer and the CEX should agree the set of rules which an investor must meet in order to become authorised.

If these rules depend on the current `GeneralTransferManager` state (e.g. whether a user is already on the `GeneralTransferManager` or not, and / or their time based restrictions) then the `ExchangeTransferManager` may need to be passed the `GeneralTransferManager` in its `initFunction` so that it can appropriately enforce these rules when adding users to the `ExchangeTransferManager` whitelist by referencing the state of the `GeneralTransferManager`.

The Issuer adds the CEX's `ExchangeTransferManager` to its token as a `TransferManager` module.

The logic for verifying transfers in the `ExchangeTransferManager` will likely depend on the specific exchange, but as an example we consider the following agreement / rules:  
  - the CEX is allowed to authorise transfers between itself and users (representing deposits / withdrawals)
  - in other words, the CEX TransferManager will only verify transfers between the CEX wallet address and its authorised users.

As users are authorised by the CEX, the CEX adds the users address to the whitelist on the `ExchangeTransferManager` instance.

If the user wants to deposit funds to the exchange, then a `ST.transfer(userAddress, exchangeAddress, amount)` is triggered. Since the user has been added to the `ExchangeTransferManager`, this transfer will be deemed valid by the `SecurityToken`.

If the user wants to withdraw funds from the exchange, then a `ST.transfer(exchangeAddress, userAddress, amount)` is triggered. Since the user has been added to the `ExchangeTransferManager`, this transfer will be deemed valid by the `SecurityToken`.

The CEX should ensure that before allowing a user to purchase a particular token on its exchange, that the user is authorised to do so, and has been added to the corresponding `SecurityToken`'s `ExchangeTransferManager`. This avoids the problem where a user may buy a token on an exchange, but then not be able to subsequently withdraw it. i.e. it should call `verifyTransfer(exchangeAddress, userAddress, amount)` and only allow the trade if this returns `true`.

### Notes

It is possible for the CEX to maintain it's own contract which lists all of its authorised users across all security tokens. Its `ExchangeTransferManager` can then reference this global list, possibly enforcing additional criteria on users metadata (e.g. their jurisdiction and so on). This would allow it to easily offer `ExchangeTransferManager`'s for its exchange to multiple Issuers at a very low additional cost to itself (since the `ExchangeTransferManager` is generic and just references the exchanges own contract where it maintains a global list of authorised users). Obviously the Issuer would need to agree to this approach.

It may be that the exchange doesn't have a single exchange address (i.e. each user has their own wallet) which would make the implementation harder. This logic would then need to be determined on a case by case basis, but the exchange should be able to write their own TransferManager with appropriate rules and add it to the Polymath ecosystem.

## DEX

It may be that the Issuer does not want to delegate any responsibility to the DEX to authorise users.

In this case, the following is a straightforward approach:  
  - DEX contract is added to the `GeneralTransferManager` by the Issuer (probably with no time restrictions).
  - Before allowing a user to deposit to the DEX, the DEX calls `verifyTransfer(DEXAddress, userAddress, amount)` and only allows the trade if this returns `true`. This ensures that the user would be able to withdraw any deposited tokens if they decide to.
  - Before allowing a user to buy tokens on the DEX, the DEX calls `verifyTransfer(DEXAddress, userAddress, amount)` and only allows the trade if this returns `true`. This ensures that the user would be able to withdraw any deposited tokens if they decide to.
  - The check to `verifyTransfer(userAddress, DEXAddress, amount)` is implicit in the deposit transfer, but an exchange could also call this explicitly if they wanted to, and for example only show SecurityTokens to the user for which this returns `true`.

With this approach, users can only transfer tokens to the exchange if they are on the `GeneralTransferManager` with a `fromTime` in the past, and users can only purchase tokens on the exchange if they are on the `GeneralTransferManager` with a `toTime` in the past.

## Multiple KYC Providers

An issuer may want to have multiple KYC providers. In this case it is straightforward to add multiple TransferManagers to their SecurityToken, one per KYC provider, and each KYC provider can operate independently (with the full set of authorised users being users who are authorised by any single KYC provider).

The Issuer could subsequently remove one of the KYC providers TransferManagers from their SecurityToken if they were unhappy with the service (although they would not get any POLY paid for the service refunded).
