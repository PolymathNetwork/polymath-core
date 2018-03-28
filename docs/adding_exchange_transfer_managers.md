# Exchange Transfer Managers

We consider the two most common types of exchanges:  
  - a DEX where users deposit tokens to the DEX contract, a trade occurs between two users, and then users withdraw tokens from the DEX contract
  - a CEX where users deposit and withdraw tokens to and from the exchange

## CEX

The Issuer and the CEX reach an agreement that the CEX is allowed to authorise users to transfer and receive tokens from the CEX, following an appropriate authorisation process for the user.

The Issuer and the CEX should agree the set of rules which an investor must meet in order to become authorised.

If these rules depend on the current `GeneralTransferManager` state (e.g. whether a user is already on the `GeneralTransferManager` or not, and / or their time based restrictions) then the `ExchangeTransferManager` may need to be passed the `GeneralTransferManager` in its `initFunction` so that it can appropriately enforce these rules when adding users to the `ExchangeTransferManager` whitelist by referencing the state of the `GeneralTransferManager`.

The Issuer adds the CEX's `ExchangeTransferManager` to its token as a `TransferManager` module.

The logic for verifying transfers in the `ExchangeTransferManager` will likely depend on the specific exchange, but as an example we consider the following agreement / rules:  
  - the CEX is allowed to authorise transfers between itself and users (representing deposits / withdrawals)  

As users are authorised by the CEX, the CEX adds the users address to the whitelist on the `ExchangeTransferManager` instance.

If the user wants to deposit funds to the exchange, then a `ST.transfer(userAddress, exchangeAddress, amount)` is triggered. Since the user has been added to the `ExchangeTransferManager`, this transfer will be deemed valid by the `SecurityToken`.

If the user wants to withdraw funds from the exchange, then a `ST.transfer(exchangeAddress, userAddress, amount)` is triggered. Since the user has been added to the `ExchangeTransferManager`, this transfer will be deemed valid by the `SecurityToken`.

The CEX should ensure that before allowing a user to purchase a particular token on its exchange, that the user is authorised to do so, and has been added to the corresponding `SecurityToken`'s `ExchangeTransferManager`. This avoids the problem where a user may buy a token on an exchange, but then not be able to subsequently withdraw it. i.e. it should call `verifyTransfer(exchangeAddress, userAddress, amount)` and only allow the trade if this returns `true`.

## DEX

It may be that the Issuer does not want to delegate any responsibility to the DEX to authorise users.

In this case, the following is a straightforward approach:  
  - DEX contract is added to the `GeneralTransferManager` by the Issuer (probably with no time restrictions).
  - Before allowing a user to buy tokens on the DEX, the DEX calls `verifyTransfer(DEXAddress, userAddress, amount)` and only allows the trade if this returns `true`.

With this approach, users can only transfer tokens to the exchange if they are on the `GeneralTransferManager` with a `fromTime` in the past, and users can only purchase tokens on the exchange if they are on the `GeneralTransferManager` with a `toTime` in the past.
