# UPGRADE-PROCEDURES

## 1.4.0 -&gt; 2.0.0

### SecurityTokenRegistry

1. Migrate existing Tickers and Security Tokens
2. a\) Run strMigrator command on polymath-cli
3. b\) Enter the SecurityTokenRegistry v2.0.0 address
4. c\) Enter the TickerRegistry v1.4.0 address
5. d\) Tickers are read and listed.
6. e\) Enter 'y' to migrate all listed tickers
7. f\) Enter the SecurityTokenRegistry v1.4.0 address
8. g\) Security Tokens are read and listed 
9. h\) Enter 'y' to migrate all listed Security Tokens

## 1.3.0 -&gt; 1.4.0

### USDTieredSTO & Oracles

1. Deploy Oracles
2. a\) Deploy POLY Oracle
3. a.i\) Add Poly Oracle key to mapping on PolymathRegistry PolymathRegistry.changeAddress\("PolyUsdOracle",\[POLYoracleAddress\]\)
4. b\) Deploy ETH Oracle
5. b.i\) Add Eth Oracle key to mapping on PolymathRegistry PolymathRegistry.changeAddress\("EthUsdOracle",\[ETHoracleAddress\]\)
6. c\) Change ownership of both Oracles to Polymath Multisig
7. Deploy USDTieredSTOFactory contract and verify it on the ModuleRegistry:
8. a\) Example params: 0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec, 100000000000000000000000,0,0
9. b\) ModuleRegistry -&gt; RegisterModule Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3
10. c\) ModuleRegistry -&gt; VerifyModule Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3, true
11. d\) Change ownership of USDTieredSTOFactory to Polymath Multisig
12. Deploy CappedSTOFactory contract and verify it on the ModuleRegistry:
13. a\) Example params: 0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec, 20000000000000000000000,0,0
14. b\) ModuleRegistry -&gt; RegisterModule Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3
15. c\) ModuleRegistry -&gt; VerifyModule Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3, true
16. d\) Change ownership of CappedSTOFactory to Polymath Multisig
17. e\) Un-verify old CappedSTOFactory
18. Deploy ManualApprovalTransferManager contract and verify it on the ModuleRegistry:
19. a\) Example params: 0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec, 0,0,0
20. b\) ModuleRegistry -&gt; RegisterModule Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3
21. c\) ModuleRegistry -&gt; VerifyModule Example params: 0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3, true
22. d\) Change ownership of ManualApprovalTransferManager to Polymath Multisig

