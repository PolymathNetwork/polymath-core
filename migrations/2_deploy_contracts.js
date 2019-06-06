const PolymathRegistry = artifacts.require("./PolymathRegistry.sol");
const GeneralTransferManagerFactory = artifacts.require("./GeneralTransferManagerFactory.sol");
const GeneralTransferManagerLogic = artifacts.require("./GeneralTransferManager.sol");
const GeneralPermissionManagerLogic = artifacts.require("./GeneralPermissionManager.sol");
const GeneralPermissionManagerFactory = artifacts.require("./GeneralPermissionManagerFactory.sol");
const PercentageTransferManagerLogic = artifacts.require("./PercentageTransferManager.sol");
const PercentageTransferManagerFactory = artifacts.require("./PercentageTransferManagerFactory.sol");
const USDTieredSTOLogic = artifacts.require("./USDTieredSTO.sol");
const CountTransferManagerFactory = artifacts.require("./CountTransferManagerFactory.sol");
const CountTransferManagerLogic = artifacts.require("./CountTransferManager.sol");
const EtherDividendCheckpointLogic = artifacts.require("./EtherDividendCheckpoint.sol");
const ERC20DividendCheckpointLogic = artifacts.require("./ERC20DividendCheckpoint.sol");
const EtherDividendCheckpointFactory = artifacts.require("./EtherDividendCheckpointFactory.sol");
const ERC20DividendCheckpointFactory = artifacts.require("./ERC20DividendCheckpointFactory.sol");
const ModuleRegistry = artifacts.require("./ModuleRegistry.sol");
const ManualApprovalTransferManagerFactory = artifacts.require("./ManualApprovalTransferManagerFactory.sol");
const ManualApprovalTransferManagerLogic = artifacts.require("./ManualApprovalTransferManager.sol");
const CappedSTOFactory = artifacts.require("./CappedSTOFactory.sol");
const CappedSTOLogic = artifacts.require("./CappedSTO.sol");
const USDTieredSTOFactory = artifacts.require("./USDTieredSTOFactory.sol");
const SecurityTokenRegistry = artifacts.require("./SecurityTokenRegistry.sol");
const STFactory = artifacts.require("./tokens/STFactory.sol");
const DevPolyToken = artifacts.require("./helpers/PolyTokenFaucet.sol");
const MockOracle = artifacts.require("./MockOracle.sol");
const StableOracle = artifacts.require("./StableOracle.sol");
const TokenLib = artifacts.require("./TokenLib.sol");
const SecurityTokenLogic = artifacts.require("./tokens/SecurityToken.sol");
const MockSecurityTokenLogic = artifacts.require("./tokens/MockSecurityTokenLogic.sol");
const STRGetter = artifacts.require('./STRGetter.sol');
const STGetter = artifacts.require('./STGetter.sol');
const MockSTGetter = artifacts.require('./MockSTGetter.sol');
const DataStoreLogic = artifacts.require('./DataStore.sol');
const DataStoreFactory = artifacts.require('./DataStoreFactory.sol');
const VolumeRestrictionTMFactory = artifacts.require('./VolumeRestrictionTMFactory.sol');
const VolumeRestrictionTMLogic = artifacts.require('./VolumeRestrictionTM.sol');
const VolumeRestrictionLib = artifacts.require('./VolumeRestrictionLib.sol');
const GeneralTransferManagerProxy = artifacts.require("./GeneralTransferManagerProxy.sol");
const GeneralPermissionManagerProxy = artifacts.require("./GeneralPermissionManagerProxy.sol");
const PercentageTransferManagerProxy = artifacts.require("./PercentageTransferManagerProxy.sol");
const CountTransferManagerProxy = artifacts.require("./CountTransferManagerProxy.sol");
const EtherDividendCheckpointProxy = artifacts.require("./EtherDividendCheckpointProxy.sol");
const ERC20DividendCheckpointProxy = artifacts.require("./ERC20DividendCheckpointProxy.sol");
const ManualApprovalTransferManagerProxy = artifacts.require("./ManualApprovalTransferManagerProxy.sol");
const CappedSTOProxy = artifacts.require("./CappedSTOProxy.sol");
const USDTieredSTOProxy = artifacts.require("./USDTieredSTOProxy.sol");
const DataStoreProxy = artifacts.require('./DataStoreProxy.sol');
const VolumeRestrictionTMProxy = artifacts.require('./VolumeRestrictionTMProxy.sol');
const PLCRVotingCheckpointFactory = artifacts.require('./PLCRVotingCheckpointFactory.sol');
const PLCRVotingCheckpointLogic = artifacts.require('./PLCRVotingCheckpoint.sol');
const PLCRVotingCheckpointProxy = artifacts.require("./PLCRVotingCheckpointProxy.sol");
const WeightedVoteCheckpointFactory = artifacts.require('./WeightedVoteCheckpointFactory.sol');
const WeightedVoteCheckpointLogic = artifacts.require('./WeightedVoteCheckpoint.sol');
const WeightedVoteCheckpointProxy = artifacts.require("./WeightedVoteCheckpointProxy.sol");
const BlacklistTransferManagerFactory = artifacts.require('./BlacklistTransferManagerFactory.sol');
const BlacklistTransferManagerLogic = artifacts.require('./BlacklistTransferManager.sol');
const BlacklistTransferManagerProxy = artifacts.require("./BlacklistTransferManagerProxy.sol");
const LockUpTransferManagerFactory = artifacts.require('./LockUpTransferManagerFactory.sol');
const LockUpTransferManagerLogic = artifacts.require('./LockUpTransferManager.sol');
const LockUpTransferManagerProxy = artifacts.require("./LockUpTransferManagerProxy.sol");
const VestingEscrowWalletFactory = artifacts.require('./VestingEscrowWalletFactory.sol');
const VestingEscrowWalletLogic = artifacts.require('./VestingEscrowWallet.sol');
const VestingEscrowWalletProxy = artifacts.require("./VestingEscrowWalletProxy.sol");


const Web3 = require("web3");
let BN = Web3.utils.BN;
const nullAddress = "0x0000000000000000000000000000000000000000";
const cappedSTOSetupCost = new BN(20000).mul(new BN(10).pow(new BN(18))); // 20K POLY fee
const usdTieredSTOSetupCost = new BN(100000).mul(new BN(10).pow(new BN(18))); // 100K POLY fee
let PolyToken;
let POLYOracle;
let StablePOLYOracle;

module.exports = function (deployer, network, accounts) {
    // Ethereum account address hold by the Polymath (Act as the main account which have ownable permissions)
    let PolymathAccount;
    let actualOwner = "0x00e13f97e1980126cbe90F21B9C1b853878031Dd"; //Replace
    let polymathRegistry;
    let web3;
    if (network === "development") {
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        PolymathAccount = accounts[0];
        deployer.deploy(DevPolyToken)
            .then(() => {
                PolyToken = DevPolyToken.address;
            });
        // Development network polytoken address
        deployer.deploy(DevPolyToken, {
            from: PolymathAccount
        }).then(() => {
            DevPolyToken.deployed().then(mockedUSDToken => {
                UsdToken = mockedUSDToken.address;
            });
        });
        deployer
            .deploy(
                MockOracle,
                nullAddress,
                web3.utils.fromAscii("POLY"),
                web3.utils.fromAscii("USD"),
                new BN(5).mul(new BN(10).pow(new BN(17))), {
                    from: PolymathAccount
                }
            ).then(() => {
                return MockOracle.deployed();
            }).then(mockedOracle => {
                POLYOracle = mockedOracle.address;
            }).then(() => {
                return deployer
                    .deploy(
                        StableOracle,
                        POLYOracle,
                        new BN(10).mul(new BN(10).pow(new BN(16))), {
                            from: PolymathAccount
                        }
                    );
            }).then(() => {
                return StableOracle.deployed();
            }).then(stableOracle => {
                StablePOLYOracle = stableOracle.address;
            });
        deployer
            .deploy(
                MockOracle,
                nullAddress,
                web3.utils.fromAscii("ETH"),
                web3.utils.fromAscii("USD"),
                new BN(500).mul(new BN(10).pow(new BN(18))), {
                    from: PolymathAccount
                }
            )
            .then(() => {
                MockOracle.deployed().then(mockedOracle => {
                    ETHOracle = mockedOracle.address;
                });
            });
        deployer.deploy(PolymathRegistry)
            .then((pr) => {
                polymathRegistry = pr;
            });
    } else if (network === "kovan") {
        web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io/g5xfoQ0jFSE9S5LwM1Ei"));
        PolymathAccount = accounts[0];
        PolyToken = "0xb347b9f5b56b431b2cf4e1d90a5995f7519ca792"; // PolyToken Kovan Faucet Address
        POLYOracle = "0x461d98EF2A0c7Ac1416EF065840fF5d4C946206C"; // Poly Oracle Kovan Address
        ETHOracle = "0xCE5551FC9d43E9D2CC255139169FC889352405C8"; // ETH Oracle Kovan Address
        StablePOLYOracle = ""; // TODO
        polymathRegistry = ""; // TODO
    } else if (network === "mainnet") {
        web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/g5xfoQ0jFSE9S5LwM1Ei"));
        PolymathAccount = accounts[0];
        PolyToken = "0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC"; // Mainnet PolyToken Address
        POLYOracle = "0x52cb4616E191Ff664B0bff247469ce7b74579D1B"; // Poly Oracle Mainnet Address
        ETHOracle = "0x60055e9a93aae267da5a052e95846fa9469c0e7a"; // ETH Oracle Mainnet Address
        StablePOLYOracle = ""; // TODO
        polymathRegistry = ""; // TODO
    }

    const tokenInitBytes = {
        name: "initialize",
        type: "function",
        inputs: [{
            type: "address",
            name: "_getterDelegate"
        }]
    };

    // POLYMATH NETWORK Configuration :: DO THIS ONLY ONCE
    // A) Deploy the PolymathRegistry contract
    return deployer
        .deploy(TokenLib, {
            from: PolymathAccount
        })
        .then(() => {
            return deployer.deploy(VolumeRestrictionLib, {
                from: PolymathAccount
            });
        })
        .then(() => {
            // Link libraries
            deployer.link(VolumeRestrictionLib, VolumeRestrictionTMLogic);
            deployer.link(TokenLib, SecurityTokenLogic);
            deployer.link(TokenLib, MockSecurityTokenLogic);
            deployer.link(TokenLib, STFactory);
            deployer.link(TokenLib, STGetter);
            deployer.link(TokenLib, MockSTGetter);
        })
        .then(() => {
            deployer.deploy(STGetter, {
                from: PolymathAccount
            }); // Logic contract, ownership does not matter
            deployer.deploy(SecurityTokenRegistry, {
                from: PolymathAccount
            }); // Logic contract, ownership does not matter
            deployer.deploy(ModuleRegistry, {
                from: PolymathAccount
            }); // Logic contract, ownership does not matter
            deployer.deploy(STRGetter, {
                from: PolymathAccount
            }); // Logic contract, ownership does not matter
            deployer.deploy(GeneralPermissionManagerLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(GeneralPermissionManagerFactory, new BN(0), new BN(0), GeneralPermissionManagerLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(CountTransferManagerLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(CountTransferManagerFactory, new BN(0), new BN(0), CountTransferManagerLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    });
                })
            deployer.deploy(ManualApprovalTransferManagerLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(ManualApprovalTransferManagerFactory, new BN(0), new BN(0), ManualApprovalTransferManagerLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(PercentageTransferManagerLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(PercentageTransferManagerFactory, new BN(0), new BN(0), PercentageTransferManagerLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(ERC20DividendCheckpointLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(ERC20DividendCheckpointFactory, new BN(0), new BN(0), ERC20DividendCheckpointLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(EtherDividendCheckpointLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(EtherDividendCheckpointFactory, new BN(0), new BN(0), EtherDividendCheckpointLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(USDTieredSTOLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(USDTieredSTOFactory, usdTieredSTOSetupCost, new BN(0), USDTieredSTOLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(VolumeRestrictionTMLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(VolumeRestrictionTMFactory, new BN(0), new BN(0), VolumeRestrictionTMLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(PLCRVotingCheckpointLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(PLCRVotingCheckpointFactory, new BN(0), new BN(0), PLCRVotingCheckpointLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(WeightedVoteCheckpointLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(WeightedVoteCheckpointFactory, new BN(0), new BN(0), WeightedVoteCheckpointLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(BlacklistTransferManagerLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(BlacklistTransferManagerFactory, new BN(0), new BN(0), BlacklistTransferManagerLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(LockUpTransferManagerLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(LockUpTransferManagerFactory, new BN(0), new BN(0), LockUpTransferManagerLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(VestingEscrowWalletLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(VestingEscrowWalletFactory, new BN(0), new BN(0), VestingEscrowWalletLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            deployer.deploy(CappedSTOLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(CappedSTOFactory, cappedSTOSetupCost, new BN(0), CappedSTOLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    });
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
            return deployer.deploy(GeneralTransferManagerLogic, nullAddress, nullAddress, {
                    from: PolymathAccount
                })
                .then(() => {
                    return deployer.deploy(GeneralTransferManagerFactory, new BN(0), new BN(0), GeneralTransferManagerLogic.address, polymathRegistry.address, {
                        from: PolymathAccount
                    })
                })
                .then((factory) => {
                    return factory.transferOwnership(actualOwner, {
                        from: PolymathAccount
                    })
                })
                .then(() => {
                    return deployer.deploy(DataStoreLogic, {
                        from: PolymathAccount
                    })
                })
                .then(() => {
                    return deployer.deploy(DataStoreFactory, DataStoreLogic.address, {
                        from: PolymathAccount
                    });
                })
                .then(() => {
                    return deployer.deploy(SecurityTokenLogic, "", "", 0, {
                        from: PolymathAccount
                    });
                });
        })
        .then(() => {
            let tokenInitBytesCall = web3.eth.abi.encodeFunctionCall(tokenInitBytes, [STGetter.address]);
            return deployer.deploy(STFactory, polymathRegistry.address, GeneralTransferManagerFactory.address, DataStoreFactory.address, "3.0.0", SecurityTokenLogic.address, tokenInitBytesCall, {
                from: PolymathAccount
            });
        })
        .then((factory) => {
            return factory.transferOwnership(actualOwner, {
                from: PolymathAccount
            })
        })
        .then(() => {
            deployer.deploy(GeneralTransferManagerProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(GeneralPermissionManagerProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(PercentageTransferManagerProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(CountTransferManagerProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(EtherDividendCheckpointProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(ERC20DividendCheckpointProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(ManualApprovalTransferManagerProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(CappedSTOProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(USDTieredSTOProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(DataStoreProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(VolumeRestrictionTMProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(PLCRVotingCheckpointProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(WeightedVoteCheckpointProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(BlacklistTransferManagerProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            deployer.deploy(LockUpTransferManagerProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
            return deployer.deploy(VestingEscrowWalletProxy, "3.0.0", PolyToken, PolyToken, PolyToken, {
                from: PolymathAccount
            }); // Only for etherscan verification, ownership does not matter
        })
        .then(() => {
            console.log("\n");
            console.log(`

    ----------------------- Polymath Network Smart Contracts: -----------------------
    SecurityTokenRegistry:                ${SecurityTokenRegistry.address}
    ModuleRegistry:                       ${ModuleRegistry.address}
    STRGetter:                            ${STRGetter.address}
    STFactory:                            ${STFactory.address}

    GeneralPermissionManagerLogic:        ${GeneralPermissionManagerLogic.address}
    GeneralPermissionManagerFactory:      ${GeneralPermissionManagerFactory.address}

    EtherDividendCheckpointLogic:         ${EtherDividendCheckpointLogic.address}
    ERC20DividendCheckpointLogic:         ${ERC20DividendCheckpointLogic.address}
    EtherDividendCheckpointFactory:       ${EtherDividendCheckpointFactory.address}
    ERC20DividendCheckpointFactory:       ${ERC20DividendCheckpointFactory.address}
    PLCRVotingCheckpointLogic:            ${PLCRVotingCheckpointLogic.address}
    PLCRVotingCheckpointFactory:          ${PLCRVotingCheckpointFactory.address}
    WeightedVoteCheckpointLogic:          ${WeightedVoteCheckpointLogic.address}
    WeightedVoteCheckpointFactory:        ${WeightedVoteCheckpointFactory.address}

    CappedSTOLogic:                       ${CappedSTOLogic.address}
    CappedSTOFactory:                     ${CappedSTOFactory.address}
    USDTieredSTOLogic:                    ${USDTieredSTOLogic.address}
    USDTieredSTOFactory:                  ${USDTieredSTOFactory.address}

    GeneralTransferManagerLogic:          ${GeneralTransferManagerLogic.address}
    GeneralTransferManagerFactory:        ${GeneralTransferManagerFactory.address}
    CountTransferManagerLogic:            ${CountTransferManagerLogic.address}
    CountTransferManagerFactory:          ${CountTransferManagerFactory.address}
    PercentageTransferManagerLogic:       ${PercentageTransferManagerLogic.address}
    PercentageTransferManagerFactory:     ${PercentageTransferManagerFactory.address}
    ManualApprovalTransferManagerLogic:   ${ManualApprovalTransferManagerLogic.address}
    ManualApprovalTransferManagerFactory: ${ManualApprovalTransferManagerFactory.address}
    VolumeRestrictionTMFactory:           ${VolumeRestrictionTMFactory.address}
    VolumeRestrictionTMLogic:             ${VolumeRestrictionTMLogic.address}
    BlacklistTransferManagerLogic:        ${BlacklistTransferManagerLogic.address}
    BlacklistTransferManagerFactory:      ${BlacklistTransferManagerFactory.address}
    LockUpTransferManagerLogic:           ${LockUpTransferManagerLogic.address}
    LockUpTransferManagerFactory:         ${LockUpTransferManagerFactory.address}

    VestingEscrowWalletLogic:             ${VestingEscrowWalletLogic.address}
    VestingEscrowWalletFactory:           ${VestingEscrowWalletFactory.address}
    ---------------------------------------------------------------------------------
    `);
            console.log("\n");
            // -------- END OF POLYMATH NETWORK Configuration -------//
        });
};
