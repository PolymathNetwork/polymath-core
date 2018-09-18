#!/usr/bin/env node

const shell = require('shelljs');
var faucet = require('./commands/faucet');
var investor_portal = require('./commands/investor_portal');
var module_manager = require('./commands/module_manager');
var st20generator = require('./commands/ST20Generator');
var transfer = require('./commands/transfer');
var dividends_manager = require('./commands/dividends_manager');
var strMigrator = require('./commands/strMigrator');
var program = require('commander');
const yaml = require('js-yaml');
const fs = require('fs');

program
  .version('0.0.1')
  .description('CLI for Polymath-core')
  .option('-r, --remote-node <network>', 'Use Infura to connect to a remote node on selected network');

program
  .command('st20generator')
  .alias('st')
  .option('-c, --config <file>', "Uses configuration file to configure ST and STO")
  .description('Wizard-like script that will guide technical users in the creation and deployment of an ST-20 token')
  .action(async function(cmd) {
    let tokenConfig;
    let mintingConfig;
    let stoCofig;
    if (cmd.config) {
      let config = yaml.safeLoad(fs.readFileSync(`${__dirname}/data/${cmd.config}`, 'utf8'));
      tokenConfig = config.securityToken;
      mintingConfig = config.initialMint;
      stoCofig = config.sto;
    }
    await st20generator.executeApp(tokenConfig, mintingConfig, stoCofig, program.remoteNode);
  });

program
  .command('faucet [beneficiary] [amount]')
  .alias('f')
  .description('Poly faucet for local private netwtorks')
  .action(async function(beneficiary, amount) {
    await faucet.executeApp(beneficiary, amount, program.remoteNode);
  });

program
  .command('investor_portal [investor] [symbol] [currency] [amount]')
  .alias('i')
  .description('Participate in any STO you have been whitelisted for')
  .action(async function(investor, symbol, currency, amount) {
    await investor_portal.executeApp(investor, symbol, currency, amount, program.remoteNode);
  });

program
  .command('module_manager')
  .alias('mm')
  .description('View modules attached to a token and their status')
  .action(async function() {
    await module_manager.executeApp(program.remoteNode);
  });

program
  .command('multi_mint <tokenSymbol> [batchSize]')
  .alias('mi')
  .description('Distribute tokens to previously whitelisted investors')
  .action(async function(tokenSymbol, batchSize) {
    shell.exec(`${__dirname}/commands/scripts/script.sh Multimint ${tokenSymbol} ${batchSize} ${program.remoteNode}`);;
  });

program
  .command('transfer <tokenSymbol> <transferTo> <transferAmount>')
  .alias('t')
  .description('Transfer ST tokens to another account')
  .action(async function(tokenSymbol, transferTo, transferAmount) {
    await transfer.executeApp(tokenSymbol, transferTo, transferAmount, program.remoteNode);
  });

program
  .command('whitelist <tokenSymbol> [batchSize]')
  .alias('w')
  .description('Mass-update a whitelist of allowed/known investors')
  .action(async function(tokenSymbol, batchSize) {
    shell.exec(`${__dirname}/commands/scripts/script.sh Whitelist ${tokenSymbol} ${batchSize} ${remoteNetwork} ${program.remoteNode}`);
  });

program
  .command('dividends_manager [dividendsType]')
  .alias('dm')
  .description('Runs dividends_manager')
  .action(async function(dividendsType) {
    await dividends_manager.executeApp(dividendsType, program.remoteNode);
  });

program
  .command('accredit <tokenSymbol> [batchSize]')
  .alias('a')
  .description('Runs accredit')
  .action(async function(tokenSymbol, batchSize) {
    shell.exec(`${__dirname}/commands/scripts/script.sh Accredit ${tokenSymbol} ${batchSize} ${program.remoteNode}`);;
  });

program
  .command('nonAccreditedLimit <tokenSymbol> [batchSize]')
  .alias('nal')
  .description('Runs changeNonAccreditedLimit')
  .action(async function(tokenSymbol, batchSize) {
    shell.exec(`${__dirname}/commands/scripts/script.sh NonAccreditedLimit ${tokenSymbol} ${batchSize} ${program.remoteNode}`);;
  });

program
  .command('strMigrator [fromStrAddress] [toStrAddress]')
  .alias('str')
  .description('Runs STR Migrator')
  .action(async function(fromStrAddress, toStrAddress) {
    await strMigrator.executeApp(fromStrAddress, toStrAddress, program.remoteNode);
  });

program.parse(process.argv);

if (typeof program.commands.length == 0) {
  console.error('No command given!');
  process.exit(1);
}