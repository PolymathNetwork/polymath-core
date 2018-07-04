#!/usr/bin/env node

const shell = require('shelljs');
var faucet = require('./commands/faucet');
var investor_portal = require('./commands/investor_portal');
var module_manager = require('./commands/module_manager');
var st20generator = require('./commands/ST20Generator');
var transfer = require('./commands/transfer');
var erc20explorer = require('./commands/checkpoint/erc20Explorer');
var ethExplorer = require('./commands/checkpoint/ethExplorer');
var program = require('commander');

program
  .version('0.0.1')
  .description('CLI for Polymath-core');

program
  .command('st20generator')
  .alias('st')
  .description('Wizard-like script that will guide technical users in the creation and deployment of an ST-20 token')
  .action(async function() {
    await st20generator.executeApp();
  });

program
  .command('faucet')
  .alias('f')
  .description('Poly faucet for local private netwtorks')
  .action(async function() {
    await faucet.executeApp();
  });

program
  .command('investor_portal')
  .alias('i')
  .description('Participate in any STO you have been whitelisted for')
  .action(async function() {
    await investor_portal.executeApp();
  });

program
  .command('module_manager')
  .alias('mm')
  .description('View modules attached to a token and their status')
  .action(async function() {
    await module_manager.executeApp();
  });

program
  .command('multi_mint <tokenSymbol> [batchSize]')
  .alias('mi')
  .description('Distribute tokens to previously whitelisted investors')
  .action(async function(tokenSymbol, batchSize) {
    shell.exec(`${__dirname}/commands/scripts/minting.sh Multimint ${tokenSymbol} ${batchSize}`);;
  });

program
  .command('transfer <tokenSymbol> <transferTo> <transferAmount>')
  .alias('t')
  .description('Transfer ST tokens to another account')
  .action(async function(tokenSymbol, transferTo, transferAmount) {
    await transfer.executeApp(tokenSymbol, transferTo, transferAmount);
  });

program
  .command('whitelist <tokenSymbol> [batchSize]')
  .alias('w')
  .description('Mass-update a whitelist of allowed/known investors')
  .action(async function(tokenSymbol, batchSize) {
    shell.exec(`${__dirname}/commands/scripts/minting.sh Whitelist ${tokenSymbol} ${batchSize}`);;
  });

program
  .command('erc20explorer')
  .alias('erc20')
  .description('Runs erc20Explorer')
  .action(async function() {
    await erc20explorer.executeApp();
  });

program
  .command('ethExplorer')
  .alias('eth')
  .description('Runs ethExplorer')
  .action(async function() {
    await ethExplorer.executeApp();
  });

program.parse(process.argv);
