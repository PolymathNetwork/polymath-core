## 1.4.0 -> 2.0.0

### SecurityTokenRegistry

1. Migrate existing Tickers and Security Tokens
- a) Run strMigrator command on polymath-cli
- b) Enter the SecurityTokenRegistry v2.0.0 address
- c) Enter the TickerRegistry v1.4.0 address
- d) Tickers are read and listed.
- e) Enter 'y' to migrate all listed tickers
- f) Enter the SecurityTokenRegistry v1.4.0 address
- g) Security Tokens are read and listed 
- h) Enter 'y' to migrate all listed Security Tokens

## 1.3.0 -> 1.4.0

### USDTieredSTO & Oracles

1. Deploy Oracles
- a) Deploy POLY Oracle
- a.i) Add Poly Oracle key to mapping on PolymathRegistry
  PolymathRegistry.changeAddress("PolyUsdOracle",[POLYoracleAddress])

- b) Deploy ETH Oracle
- b.i) Add Eth Oracle key to mapping on PolymathRegistry
  PolymathRegistry.changeAddress("EthUsdOracle",[ETHoracleAddress])

- c) Change ownership of both Oracles to Polymath Multisig

2. Deploy USDTieredSTOFactory contract and verify it on the ModuleRegistry:
- a) Example params:
  		0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec, 100000000000000000000000,0,0

- b) ModuleRegistry -> RegisterModule
  	Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3

- c) ModuleRegistry -> VerifyModule
  	Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3, true

- d) Change ownership of USDTieredSTOFactory to Polymath Multisig

3. Deploy CappedSTOFactory contract and verify it on the ModuleRegistry:
- a) Example params:
  		0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec, 20000000000000000000000,0,0

- b) ModuleRegistry -> RegisterModule
  	Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3

- c) ModuleRegistry -> VerifyModule
  	Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3, true

- d) Change ownership of CappedSTOFactory to Polymath Multisig

- e) Un-verify old CappedSTOFactory

4. Deploy ManualApprovalTransferManager contract and verify it on the ModuleRegistry:
- a) Example params:
  		0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec, 0,0,0

- b) ModuleRegistry -> RegisterModule
  	Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3

- c) ModuleRegistry -> VerifyModule
  	Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3, true

- d) Change ownership of ManualApprovalTransferManager to Polymath Multisig
