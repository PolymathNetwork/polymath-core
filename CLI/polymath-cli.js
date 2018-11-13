#!/usr/bin/env node

const shell = require('shelljs');
var faucet = require('./commands/faucet');
var investor_portal = require('./commands/investor_portal');
var token_manager = require('./commands/token_manager');
var st20generator = require('./commands/ST20Generator');
var transfer = require('./commands/transfer');
var transfer_ownership = require('./commands/transfer_ownership');
var dividends_manager = require('./commands/dividends_manager');
var transfer_manager = require('./commands/transfer_manager');
var contract_manager = require('./commands/contract_manager');
var strMigrator = require('./commands/strMigrator');
var permission_manager = require('./commands/permission_manager');
var program = require('commander');
var gbl = require('./commands/common/global');
const yaml = require('js-yaml');
const fs = require('fs');

program
  .version('1.0.1')
  .description('Command Line Interface for Polymath-core')
  .option('-r, --remote-node <network>', 'Use Infura to connect to a remote node on selected network');

program
  .command('st20generator')
  .alias('st')
  .option('-t, --ticker <ticker>', 'Unique token ticker')
  .option('-o, --transferOwnership <newOwner>', `Transfers the ticker's ownership to newOwner account. If newOwner is 'false', this step is skipped`)
  .option('-n, --tokenName <tokenName>', 'Token name')
  .option('-d, --details <details>', 'Off-chain details of the token')
  .option('-D, --divisible [div]', 'If token is divisible or not [true]', /^(true|false)/, 'true')
  .description('Wizard-like script that will guide technical users in the creation and deployment of an ST-20 token')
  .action(async function(cmd) {
    await gbl.initialize(program.remoteNode);
    await st20generator.executeApp(cmd.ticker, cmd.transferOwnership, cmd.tokenName, cmd.details, cmd.divisible);
  });

program
  .command('faucet [beneficiary] [amount]')
  .alias('f')
  .description('Poly faucet for local private netwtorks')
  .action(async function(beneficiary, amount) {
    await gbl.initialize(program.remoteNode);
    await faucet.executeApp(beneficiary, amount);
  });

program
  .command('investor_portal [investor] [privateKey] [symbol] [currency] [amount]')
  .alias('i')
  .description('Participate in any STO you have been whitelisted for')
  .action(async function(investor, privateKey, symbol, currency, amount) {
    await gbl.initialize(program.remoteNode);
    await investor_portal.executeApp(investor, privateKey, symbol, currency, amount);
  });

program
  .command('token_manager')
  .alias('stm')
  .description('Manage your Security Tokens, mint tokens, add modules and change config')
  .action(async function() {
    await gbl.initialize(program.remoteNode);
    await token_manager.executeApp();
  });

program
  .command('multi_mint <tokenSymbol> [batchSize]')
  .alias('mi')
  .description('Distribute tokens to previously whitelisted investors')
  .action(async function(tokenSymbol, batchSize) {
    await gbl.initialize(program.remoteNode);
    shell.exec(`${__dirname}/commands/scripts/script.sh Multimint ${tokenSymbol} ${batchSize} ${program.remoteNode}`);;
  });

program
  .command('transfer <tokenSymbol> <transferTo> <transferAmount>')
  .alias('t')
  .description('Transfer ST tokens to another account')
  .action(async function(tokenSymbol, transferTo, transferAmount) {
    await gbl.initialize(program.remoteNode);
    await transfer.executeApp(tokenSymbol, transferTo, transferAmount);
  });

program
  .command('transfer_ownership <contractAddress> <transferTo>')
  .alias('to')
  .description('Transfer Ownership of an own contract to another account')
  .action(async function(contractAddress, transferTo) {
    await gbl.initialize(program.remoteNode);
    await transfer_ownership.executeApp(contractAddress, transferTo);
  });

program
  .command('whitelist <tokenSymbol> [batchSize]')
  .alias('w')
  .description('Mass-update a whitelist of allowed/known investors')
  .action(async function(tokenSymbol, batchSize) {
    await gbl.initialize(program.remoteNode);
    shell.exec(`${__dirname}/commands/scripts/script.sh Whitelist ${tokenSymbol} ${batchSize} ${program.remoteNode}`);
  });

program
  .command('dividends_manager [dividendsType]')
  .alias('dm')
  .description('Runs dividends_manager')
  .action(async function(dividendsType) {
    await gbl.initialize(program.remoteNode);
    await dividends_manager.executeApp(dividendsType);
  });

program
  .command('transfer_manager')
  .alias('tm')
  .description('Runs transfer_manager')
  .action(async function() {
    await gbl.initialize(program.remoteNode);
    await transfer_manager.executeApp();
  });

program
  .command('contract_manager')
  .alias('cm')
  .description('Runs contract_manager')
  .action(async function() {
    await gbl.initialize(program.remoteNode);
    await contract_manager.executeApp();
  });

program
  .command('accredit <tokenSymbol> [batchSize]')
  .alias('a')
  .description('Runs accredit')
  .action(async function(tokenSymbol, batchSize) {
    await gbl.initialize(program.remoteNode);
    shell.exec(`${__dirname}/commands/scripts/script.sh Accredit ${tokenSymbol} ${batchSize} ${program.remoteNode}`);;
  });

program
  .command('nonAccreditedLimit <tokenSymbol> [batchSize]')
  .alias('nal')
  .description('Runs changeNonAccreditedLimit')
  .action(async function(tokenSymbol, batchSize) {
    await gbl.initialize(program.remoteNode);
    shell.exec(`${__dirname}/commands/scripts/script.sh NonAccreditedLimit ${tokenSymbol} ${batchSize} ${program.remoteNode}`);;
  });

program
  .command('strMigrator [toStrAddress] [fromTrAddress] [fromStrAddress]')
  .alias('str')
  .description('Runs STR Migrator')
  .action(async function(toStrAddress, fromTrAddress, fromStrAddress) {
    await gbl.initialize(program.remoteNode);
    await strMigrator.executeApp(toStrAddress, fromTrAddress, fromStrAddress);
  });

program
  .command('permission_manager')
  .alias('pm')
  .description('Runs permission_manager')
  .action(async function() {
    await gbl.initialize(program.remoteNode);
    await permission_manager.executeApp();
  });

program.parse(process.argv);

if (typeof program.commands.length == 0) {
  console.error('No command given!');
  process.exit(1);
}