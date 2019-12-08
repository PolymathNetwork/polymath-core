# Mainnet

---

### Date: 07/29/2018
### Author: Pablo Ruiz (@pabloruiz55) <pablo@polymath.network>

---

1. Deployed contracts to mainnet using **tag v1.3.0** from master
Transaction cost: 1.715 ETH at 50gwei gas price (Had to enter a huge gas price due to Truffle bailing out after 50 blocks without activity).

```
----- Polymath Core Contracts -----
*** Polymath Registry Address:  			0x06595656b93ce14834f0d22b7bbda4382d5ab510 ***
*** Ticker Registry Address:  			0xc31714e6759a1ee26db1d06af1ed276340cd4233 ***
*** Module Registry Address:  			0x31d85fffd7e38bd42d2ae0409ac149e3ef0fd92c ***
*** Security Token Registry Address:  		0xef58491224958d978facf55d2120c55a24516b98 ***
*** Capped STO Factory Address:  			0x2aa1b133f464ac08f66c2f702581d014e4603d31 ***
*** General Permission Manager Factory: 	0xeba0348e243f2de2f1687060f9c795ac279c66af ***
*** Count Transfer Manager Factory:  		0xa662a05647a8e713be1bed193c094805d20471ff ***
*** Percentage Transfer Manager Factory:  	0x3870ee581a0528d24a6216311fcfa78f95a00593 ***
*** ETH Dividends Checkpoint Factory:  	0x0da7ed8789348ac40937cf6ae8ff521eee43816c ***
*** ERC20 Dividends Checkpoint Factory:  	0x6950096964b7adae34d5a3d1792fe73afbe9ddbc ***
*** STVersionProxy001: 					0xb19e341f45412d0e2661aea25cadc75b7d03039d ***
-----------------------------------
```

*Verified all contracts above on Etherscan*

2. Transfer of Ownership
Mainnet Multisig: 0xa22d152d855d80f4d88e5e483c30b87161019d3a

  - a) Transferred ownership of PolymathRegistry to Multisig: https://etherscan.io/tx/0xd71bb45c84a47dc7efeac9dcd097b95bd5a397b2448b9e1d4ace4b37ad5833fc

  - b) Transferred ownership of TickerRegistry to Multisig: https://etherscan.io/tx/0xdb75ea9cf6d4ffce3c9c0c9546bcaa53a063cdc7a7a6a7ed597347790f885b88

  - c) Transferred ownership of SecurityTokenRegistry to Multisig: https://etherscan.io/tx/0x67315d6df0669cfefafb4e3860e8ebb79168490adb4b4965ecb5850fb889291c

  - d) Transferred ownership of ModuleRegistry to Multisig: https://etherscan.io/tx/0xf0da6fac846e7aed091aede36c471d2128995b8dc5df9156c8752d0a392e6013

  - e) Transferred ownership of CappedSTOFactory to Multisig: https://etherscan.io/tx/0xd934ac2b6a5e73715e5d7cad6b198f7c4cbecc4b9258ff7fc26f589254892df3

  - f) Transferred ownership of GeneralPermissionManagerFactory to Multisig: https://etherscan.io/tx/0x98abcd6b8d039ee0fe1de72afc7be8caa6211db1bfd497f15449ebe4e7c243da

  - g) Transferred ownership of CountTransferManagerFactory to Multisig: https://etherscan.io/tx/0x053d647e449a1aa46b60e90392c519ee6e15a714ee1c7071eeb666819298dc2d

  - h) Transferred ownership of PercentageTransferManagerFactory to Multisig: https://etherscan.io/tx/0x271cb0ce1756250b45b209ba82ebedfc73d3e29e0148950445a54df2c75383f9

  - i) Transferred ownership of EtherDividendCheckpointFactory to Multisig: https://etherscan.io/tx/0x57373cba2f24f30c8db8cb6e2f7519b4a51c2ed285ddb041da3d6f944efd6f40

  - j) Transferred ownership of ERC20DividendCheckpointFactory to Multisig: https://etherscan.io/tx/0xe07316cbeb1fd0fa51f6415f9884e7db8467fd7a3fae8e38f7bdac88575c24bc

3. Change of TickerRegistry.expiryLimit from 15 days to 60 days
https://etherscan.io/tx/0xb978e00a55464ac2389f48e258a5ef59491acc34566a7e4cecf4386e8276b4c1#eventlog
