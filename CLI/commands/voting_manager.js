const readlineSync = require('readline-sync');
const chalk = require('chalk');
const moment = require('moment');
const BigNumber = require('bignumber.js');
const { table } = require('table');
const fs = require('fs').promises;
const common = require('./common/common_functions');
const gbl = require('./common/global');
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');
const csvParse = require('./helpers/csv');
const input = require('./IO/input');
const output = require('./IO/output');

// App flow
let securityTokenRegistry;
let moduleRegistry;
let securityToken;
let polyToken;
let tokenSymbol;
let currentVotingModule;

const EXEMPTED_VOTERS_DATA_CSV = `${__dirname}/../data/Checkpoint/Voting/exempted_voters_data.csv`;

async function executeApp() {
  console.log('\n', chalk.blue('Voting manager - Main Menu', '\n'));

  const vModules = await common.getAllModulesByType(securityToken, gbl.constants.MODULES_TYPES.DIVIDENDS);
  const nonArchivedModules = vModules.filter(m => !m.archived);
  if (nonArchivedModules.length > 0) {
    console.log(`Voting modules attached:`);
    nonArchivedModules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  } else {
    console.log(`There are no voting modules attached`);
  }

  const options = ['Create checkpoint'];
  if (vModules.length > 0) {
    options.push('Config existing modules');
  }
  options.push('Add new voting module');

  const index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'EXIT' });
  const optionSelected = index !== -1 ? options[index] : 'EXIT';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Create checkpoint':
      await createCheckpointFromST();
      break;
    case 'Config existing modules':
      await configExistingModules(nonArchivedModules);
      await advancedPLCRVotingManager();
      break;
    case 'Add new voting module':
      await addVotingModule();
      break;
    case 'EXIT':
      return;
  }

  await executeApp();
};

async function createCheckpointFromST() {
  const createCheckpointAction = securityToken.methods.createCheckpoint();
  const receipt = await common.sendTransaction(createCheckpointAction);
  const event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'CheckpointCreated');
  console.log(chalk.green(`Checkpoint ${event._checkpointId} has been created successfully!`));
}

async function addVotingModule() {
  const moduleList = (await common.getAvailableModules(moduleRegistry, gbl.constants.MODULES_TYPES.DIVIDENDS, securityToken.options.address)).filter(m => m.name.includes('Voting'));
  const options = moduleList.map(m => `${m.name} - ${m.version} (${m.factoryAddress})`);

  const index = readlineSync.keyInSelect(options, 'Which voting module do you want to add? ', { cancel: 'RETURN' });
  if (index !== -1 && readlineSync.keyInYNStrict(`Are you sure you want to add ${options[index]}? `)) {
    const moduleABI = abis.advancedPLCRVotingCheckpointABI();
    await common.addModule(securityToken, polyToken, moduleList[index].factoryAddress, moduleABI);
  }
}

async function configExistingModules(votingModules) {
  const options = votingModules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  const index = readlineSync.keyInSelect(options, 'Which module do you want to config? ', { cancel: false });
  console.log('Selected:', options[index], '\n');
  const moduleNameSelected = votingModules[index].name;
  switch (moduleNameSelected) {
    case 'AdvancedPLCRVotingCheckpoint':
      currentVotingModule = new web3.eth.Contract(abis.advancedPLCRVotingCheckpointABI(), votingModules[index].address);
      currentVotingModule.setProvider(web3.currentProvider);
      break;
  }
}

async function advancedPLCRVotingManager() {
  console.log(chalk.blue('\n', `APLCR voting module at ${currentVotingModule.options.address}`), '\n');

  const currentCheckpointId = parseInt(await securityToken.methods.currentCheckpointId().call());
  const allBalotsToShow = await getAllBallots();
  const prepareBallots = allBalotsToShow.filter(b => b.stage === 'Prepare');
  const commitBallots = allBalotsToShow.filter(b => b.stage === 'Commit');
  const revealBallots = allBalotsToShow.filter(b => b.stage === 'Reveal');
  const pendingBallots = await currentVotingModule.methods.pendingBallots(Issuer.address).call();
  const pendingCommitBallots = commitBallots.filter(b => pendingBallots.commitBallots.includes(b.id))
  const pendingRevealBallots = revealBallots.filter(b => pendingBallots.revealBallots.includes(b.id))
  const defaultExemptedVoters = await currentVotingModule.methods.getDefaultExemptionVotersList().call();


  console.log(`- Current ST checkpoint:         ${currentCheckpointId > 0 ? currentCheckpointId : 'None'}`);
  console.log(`- Exempted voters by default:    ${defaultExemptedVoters.length}`);
  console.log(`- Total ballot count:            ${allBalotsToShow.length}`);
  console.log(`- Current ballots:               ${prepareBallots.length + commitBallots.length + revealBallots.length}`);
  console.log(`    Preparation stage:           ${prepareBallots.length}`);
  console.log(`    Commit stage:                ${commitBallots.length}`);
  console.log(`    Reveal stage:                ${revealBallots.length}`);
  console.log();
  console.log(`- My pending ballots:`);
  console.log(`    Commit:                      ${pendingBallots.commitBallots.length}`);
  console.log(`    Reveal:                      ${pendingBallots.revealBallots.length}`);

  const options = ['Create checkpoint'];
  if (currentCheckpointId > 0) {
    options.push('Explore checkpoint');
  }
  if (defaultExemptedVoters.length > 0) {
    options.push('Show current exempted voters by default');
  }
  if (commitBallots.length === 0 || revealBallots.length === 0) {
    options.push('Add or remove exempted voters by default');
  }
  if (allBalotsToShow.length > 0) {
    options.push('Manage existing ballots');
  }
  if (allBalotsToShow.length < 500) {
    options.push('Create a new ballot');
  }
  if (pendingCommitBallots.length > 0) {
    options.push('Commit vote');
  }
  if (pendingRevealBallots.length > 0) {
    options.push('Reveal vote');
  }
  options.push('Reclaim ETH or ERC20 tokens from contract');

  const index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  const selected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', selected, '\n');
  switch (selected) {
    case 'Create checkpoint':
      await createCheckpointFromModule();
      break;
    case 'Explore checkpoint':
      const checkpoint = await selectCheckpoint(false)
      await exploreCheckpoint(checkpoint);
      break;
    case 'Show current exempted voters by default':
      showAddresses('Current exempted voters by default:', defaultExemptedVoters);
      break;
    case 'Add or remove exempted voters by default':
      await addOrRemoveExemptedVoters();
      break;
    case 'Manage existing ballots':
      const selectedBallot = await selectBallot(allBalotsToShow);
      if (selectedBallot) {
        await manageExistingBallot(selectedBallot.id);
      }
      break;
    case 'Create a new ballot':
      await createBallot();
      break;
    case 'Commit vote':
      const selectedBallotForVote = await selectBallot(pendingCommitBallots);
      if (selectedBallotForVote) {
        await commitVote(selectedBallotForVote.id);
      }
      break;
    case 'Reveal vote':
      const selectedBallotForReveal = await selectBallot(pendingRevealBallots);
      if (selectedBallotForReveal) {
        await revealVote(selectedBallotForReveal.id);
      }
      break;
    case 'Reclaim ETH or ERC20 tokens from contract':
      await reclaimFromContract();
      break;
    case 'RETURN':
      return;
  }

  await advancedPLCRVotingManager();
}

async function createCheckpointFromModule() {
  const createCheckpointAction = securityToken.methods.createCheckpoint();
  await common.sendTransaction(createCheckpointAction);
  console.log(chalk.green(`Checkpoint have been created successfully!`));
}

async function exploreCheckpoint(checkpoint) {
  const checkpointData = await currentVotingModule.methods.getCheckpointData(checkpoint).call();
  const dataTable = [['Investor', `Balance at checkpoint (${tokenSymbol})`]];
  for (let i = 0; i < checkpointData.investors.length; i++) {
    dataTable.push([
      checkpointData.investors[i],
      web3.utils.fromWei(checkpointData.balances[i])
    ]);
  }
  console.log();
  console.log(table(dataTable));
}

async function addOrRemoveExemptedVoters() {
  const voters = input.readMultipleAddresses(`Enter addresses to add or remove from exempted voters (ex - add1, add2, add3, ...) or leave empty to read from 'exempted_voters.csv': `);
  const exempts = voters.map(a => readlineSync.keyInYNStrict(`Do you want to exempt ${a}?`));
  if (voters[0] === '') {
    const parsedData = csvParse(EXEMPTED_VOTERS_DATA_CSV);
    const validData = parsedData.filter(row =>
      web3.utils.isAddress(row[0]) &&
      typeof row[1] === "boolean"
    );
    const invalidRows = parsedData.filter(row => !validData.includes(row));
    if (invalidRows.length > 0) {
      console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
    }
    const batches = common.splitIntoBatches(validData, 100);
    const [voterArray, exemptArray] = common.transposeBatches(batches);
    for (let batch = 0; batch < batches.length; batch++) {
      console.log(`Batch ${batch + 1} - Attempting to change multiple exemptions for: \n\n`, voterArray[batch], '\n');
      const action = await currentVotingModule.methods.changeDefaultExemptedVotersListMulti(voterArray[batch], exemptArray[batch]);
      const receipt = await common.sendTransaction(action);
      console.log(chalk.green('Multiple exemptions have benn changed successfully!'));
      console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
    }
  } else if (voters.length === 1) {
    const action = currentVotingModule.methods.changeDefaultExemptedVotersList(voters[0], exempts[0]);
    const receipt = await common.sendTransaction(action);
    const event = common.getEventFromLogs(currentVotingModule._jsonInterface, receipt.logs, 'ChangedDefaultExemptedVotersList');
    if (exempts[0]) {
      console.log(chalk.green(`${voters[0]} has been added to exempted voters list successfully!`));
    } else {
      console.log(chalk.green(`${voters[0]} has been removed from exempted voters list successfully!`))
    }
  } else {
    const action = await currentVotingModule.methods.changeDefaultExemptedVotersListMulti(voters, exempts);
    const receipt = await common.sendTransaction(action);
    const event = common.getMultipleEventsFromLogs(currentVotingModule._jsonInterface, receipt.logs, 'ChangedDefaultExemptedVotersList');
    console.log(chalk.green('Multiple exemptions have benn changed successfully!'));
  }
}

async function createBallot() {
  // 0) Choose a name
  const name = input.readStringNonEmpty(`Enter a name for the ballot to help you identify it: `);
  // 1) Choose the start time
  const startTime = input.readDateInTheFutureOrZero(`Enter the start date (Unix Epoch time) for the ballot (now = 0): `, 0);
  // 2) Choose commit duration
  const commitDuration = input.readNumberGreaterThan(0, `Enter the duration in seconds for the voting stage: `);
  // 3) Choose reveal duration
  const revealDuration = input.readNumberGreaterThan(0, `Enter the duration in seconds for the reveal stage: `);
  // 4) Choose number of proposal (if it is 1 => statutory, if it is >1 => cumulative
  const proposalsCount = input.readNumberGreaterThan(0, `Enter the number of proposals for this ballot: `);
  // 5) For each proposal:
  const proposals = [];
  for (let i = 0; i < proposalsCount; i++) {
    //  a) Enter the title
    const proposalTitle = input.readStringNonEmpty(`Enter a title for the proposal no. ${i + 1}: `);
    //  b) Enter the details
    const proposalDetails = input.readString(`Enter a link to off-chain details related to the proposal no. ${i + 1}: `);
    //  c) Choose the number of choices
    const choicesCount = input.readNumberGreaterThanOrEqual(0, `Enter the amount of choices for the proposal no. ${i + 1}: `);
    //  d) If it is >0, for each choice enter the string
    const choices = [];
    for (let j = 0; j < choicesCount; j++) {
      const choice = input.readStringNonEmpty(`Enter the choice no. ${j + 1} for the proposal no. ${i + 1}: `);
      choices.push(choice);
    }
    proposals.push(Proposal(proposalTitle, proposalDetails, choices));
  }
  // 6) Choose a checkpoint (if a checkpoint is chosen => custom call, otherwise the standard call
  const checkpointId = await selectCheckpoint(true); // If there are no checkpoints, it must create a new one
  // 7) Choose exclusions (if any exclusion => withExclusion call) (edited)
  const useDefaultExemptions = readlineSync.keyInYNStrict(`Do you want to use the default exemption voters list for this ballot?`);
  const exemptions = useDefaultExemptions ? undefined : input.readMultipleAddresses(`Enter addresses to exempt from this ballot (ex - add1, add2, add3, ...): `);

  const ballot = Ballot(startTime, commitDuration, revealDuration, proposals, checkpointId, exemptions);

  if (ballot.proposalDetails.length === 1) {
    // Statutory ballot
    let action;
    if (ballot.checkpointId === 0) {
      // Standard
      if (exemptions) {
        // With exemptions
        action = currentVotingModule.methods.createStatutoryBallotWithExemption(
          web3.utils.asciiToHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          web3.utils.asciiToHex(ballot.proposalDetails[0]),
          ballot.choices.join(','),
          ballot.choicesCounts[0],
          ballot.exemptions
        )
      } else {
        // Standard
        action = currentVotingModule.methods.createStatutoryBallot(
          web3.utils.asciiToHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          web3.utils.asciiToHex(ballot.proposalDetails[0]),
          ballot.choices.join(','),
          ballot.choicesCounts[0]
        )
      }
    } else {
      // Custom
      if (exemptions) {
        // With exemptions
        action = currentVotingModule.methods.createCustomStatutoryBallotWithExemption(
          web3.utils.asciiToHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          web3.utils.asciiToHex(ballot.proposalDetails[0]),
          ballot.choices.join(','),
          ballot.choicesCounts[0],
          ballot.checkpointId,
          ballot.exemptions
        )
      } else {
        // Standard
        action = currentVotingModule.methods.createCustomStatutoryBallot(
          web3.utils.asciiToHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          web3.utils.asciiToHex(ballot.proposalDetails[0]),
          ballot.choices.join(','),
          ballot.choicesCounts[0],
          ballot.checkpointId
        )
      }
    }
    const receipt = await common.sendTransaction(action);
    const event = common.getEventFromLogs(currentVotingModule._jsonInterface, receipt.logs, 'StatutoryBallotCreated');
    console.log(chalk.green(`Statutory ballot has been created successfully!`));
  } else {
    // Cumulative ballot
    let action;
    if (ballot.checkpointId === 0) {
      // Standard
      if (exemptions) {
        // With exemptions
        action = currentVotingModule.methods.createCumulativeBallotWithExemption(
          web3.utils.asciiToHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          ballot.proposalDetails.map(pd => web3.utils.asciiToHex(pd)),
          ballot.choices.join(','),
          ballot.choicesCounts,
          ballot.exemptions
        )
      } else {
        // Standard
        action = currentVotingModule.methods.createCumulativeBallot(
          web3.utils.asciiToHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          ballot.proposalDetails.map(pd => web3.utils.asciiToHex(pd)),
          ballot.choices.join(','),
          ballot.choicesCounts
        )
      }
    } else {
      // Custom
      if (exemptions) {
        // With exemptions
        action = currentVotingModule.methods.createCustomCumulativeBallotWithExemption(
          web3.utils.asciiToHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          ballot.proposalDetails.map(pd => web3.utils.asciiToHex(pd)),
          ballot.choices.join(','),
          ballot.choicesCounts,
          ballot.checkpointId,
          ballot.exemptions
        )
      } else {
        // Standard
        action = currentVotingModule.methods.createCustomCumulativeBallot(
          web3.utils.asciiToHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          ballot.proposalDetails.map(pd => web3.utils.asciiToHex(pd)),
          ballot.choices.join(','),
          ballot.choicesCounts,
          ballot.checkpointId
        )
      }
    }
    const receipt = await common.sendTransaction(action);
    const event = common.getEventFromLogs(currentVotingModule._jsonInterface, receipt.logs, 'CumulativeBallotCreated');
    console.log(chalk.green(`Cumulative ballot has been created successfully!`));
  }
}

async function manageExistingBallot(ballotId) {
  console.log('\n', chalk.blue('Voting manager - Ballot details', '\n'));
  // Show current data
  const details = await currentVotingModule.methods.getBallotDetails(ballotId).call();
  const type = parseInt(details.totalProposals) > 1 ? 'Cumulative' : 'Statutory';
  const allowedVoters = await currentVotingModule.methods.getAllowedVotersByBallot(ballotId).call();
  const exemptedVoters = await currentVotingModule.methods.getExemptedVotersByBallot(ballotId).call();
  const pendingVoters = await currentVotingModule.methods.getPendingInvestorToVote(ballotId).call();
  const proposals = type === 'Statutory' ? await getStatutoryBallotProposal(ballotId) : await getCumulativeBallotProposals(ballotId);
  const results = await currentVotingModule.methods.getBallotResults(ballotId).call();

  console.log(`- Name:                            ${web3.utils.hexToUtf8(details.name)}`);
  if (details.isCancelled) {
    console.log(`- Cancelled:                       ${chalk.red('YES')}`);
  } else {
    console.log(`- Current stage:                   ${Stage(details.currentStage)}`);
  }
  console.log(`- Type:                            ${type}`);
  console.log(`- Checkpoint:                      ${details.checkpointId}`);
  console.log(`- Total supply at checkpoint:      ${web3.utils.fromWei(details.totalSupplyAtCheckpoint)} ${tokenSymbol}`);
  console.log(`- Start time:                      ${moment.unix(details.startTime).format('MMMM Do YYYY, HH:mm:ss')}`);
  console.log(`- Commit duration:                 ${details.commitDuration} seconds - ${moment.unix(details.startTime).add(details.commitDuration, 's').format('MMMM Do YYYY, HH:mm:ss')}`);
  console.log(`- Reveal duration:                 ${details.revealDuration} seconds - ${moment.unix(details.startTime).add(details.commitDuration, 's').add(details.revealDuration, 's').format('MMMM Do YYYY, HH:mm:ss')}`);
  console.log(`- Allowed voters:                  ${allowedVoters.length}`);
  console.log(`- Exempted voters:                 ${exemptedVoters.length}`);
  console.log(`- Total commited votes:            ${details.commitedVoteCount}`);
  console.log(`- Total revealed votes:            ${details.totalVoters}`);
  console.log(`- Proposals:`);
  let k = 0;
  for (let i = 0; i < details.totalProposals; i++) {
    console.log(`  - ${proposals[i].title}:         ${proposals[i].details}`);
    if (proposals[i].choicesCount === 0) {
      if (details.currentStage !== '3') {
        console.log(`    A) YES`);
        console.log(`    B) NO`);
        console.log(`    C) ABSTAIN`);
      } else {
        console.log(`    A) YES:     \t\t ${web3.utils.fromWei(results.choicesWeighting[k++])}`);
        console.log(`    B) NO:      \t\t ${web3.utils.fromWei(results.choicesWeighting[k++])}`);
        console.log(`    C) ABSTAIN: \t\t ${web3.utils.fromWei(results.choicesWeighting[k++])}`);
      }
    } else {
      const choices = proposals[i].choices;
      for (let j = 0; j < proposals[i].choicesCount; j++) {
        if (details.currentStage !== '3') {
          console.log(`    ${String.fromCharCode(65 + j)}) ${choices[j]}`);
        } else {
          console.log(`    ${String.fromCharCode(65 + j)}) ${choices[j]}: \t\t\t ${web3.utils.fromWei(results.choicesWeighting[k++])}`);
        }
      }
    }
  }

  const options = ['Show allowed voters', 'Show exempted voters'];
  if (details.currentStage === '3') {
    options.push('Show results', 'Show voters');
  } else {
    if (pendingVoters.length > 0) {
      options.push('Show pending voters');
    }
    if (details.currentStage === '0') {
      options.push('Change exempted voters')
    }
    options.push('Cancel ballot');
  }

  const index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  const optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Show allowed voters':
      showAddresses(`Current allowed voters for ${web3.utils.hexToUtf8(details.name)} ballot:`, allowedVoters);
      break;
    case 'Show exempted voters':
      showAddresses(`Current exempted voters for ${web3.utils.hexToUtf8(details.name)} ballot:`, exemptedVoters);
      break;
    case 'Show results':
      showBallotResults(web3.utils.hexToUtf8(details.name), proposals, results);
      break;
    case 'Show voters':
      showAddresses(`Voters list for ${web3.utils.hexToUtf8(details.name)} ballot:`, results.voters);
      break;
    case 'Show pending voters':
      showAddresses(`Current pending voters for ${web3.utils.hexToUtf8(details.name)} ballot:`, pendingVoters);
      break;
    case 'Change exempted voters':
      await changeExemptedVotersByBallot(ballotId);
      break;
    case 'Cancel ballot':
      await cancelBallot(ballotId);
      break;
    case 'RETURN':
      return;
  }

  await manageExistingBallot(ballotId);
}

async function changeExemptedVotersByBallot(ballotId) {
  const voters = input.readMultipleAddresses(`Enter addresses to add or remove from exempted voters (ex - add1, add2, add3, ...) or leave empty to read from 'exempted_voters.csv': `);
  const exempts = voters.map(a => readlineSync.keyInYNStrict(`Do you want to exempt ${a}?`));
  if (voters[0] === '') {
    const parsedData = csvParse(EXEMPTED_VOTERS_DATA_CSV);
    const validData = parsedData.filter(row =>
      web3.utils.isAddress(row[0]) &&
      typeof row[1] === "boolean"
    );
    const invalidRows = parsedData.filter(row => !validData.includes(row));
    if (invalidRows.length > 0) {
      console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
    }
    const batches = common.splitIntoBatches(validData, 100);
    const [voterArray, exemptArray] = common.transposeBatches(batches);
    for (let batch = 0; batch < batches.length; batch++) {
      console.log(`Batch ${batch + 1} - Attempting to change multiple exemptions for: \n\n`, voterArray[batch], '\n');
      const action = await currentVotingModule.methods.changeBallotExemptedVotersListMulti(ballotId, voterArray[batch], exemptArray[batch]);
      const receipt = await common.sendTransaction(action);
      console.log(chalk.green('Multiple exemptions have benn changed successfully!'));
      console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
    }
  } else if (voters.length === 1) {
    const action = currentVotingModule.methods.changeBallotExemptedVotersList(ballotId, voters[0], exempts[0]);
    const receipt = await common.sendTransaction(action);
    const event = common.getEventFromLogs(currentVotingModule._jsonInterface, receipt.logs, 'ChangedBallotExemptedVotersList');
    if (exempts[0]) {
      console.log(chalk.green(`${voters[0]} has been added to exempted voters list successfully!`));
    } else {
      console.log(chalk.green(`${voters[0]} has been removed from exempted voters list successfully!`))
    }
  } else {
    const action = await currentVotingModule.methods.changeBallotExemptedVotersListMulti(ballotId, voters, exempts);
    const receipt = await common.sendTransaction(action);
    const event = common.getMultipleEventsFromLogs(currentVotingModule._jsonInterface, receipt.logs, 'ChangedBallotExemptedVotersList');
    console.log(chalk.green('Multiple exemptions have benn changed successfully!'));
  }
}

async function cancelBallot(ballotId) {
  const action = currentVotingModule.methods.cancelBallot(ballotId);
  const receipt = await common.sendTransaction(action);
  const event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'BallotCancelled');
  console.log(chalk.green(`The ballot has been cancelled successfully!`));
}

async function commitVote(ballotId) {
  console.log('\n', chalk.blue('Voting manager - Commit vote', '\n'));

  const details = await currentVotingModule.methods.getBallotDetails(ballotId).call();
  const type = parseInt(details.totalProposals) > 1 ? 'Cumulative' : 'Statutory';
  const proposals = type === 'Statutory' ? await getStatutoryBallotProposal(ballotId) : await getCumulativeBallotProposals(ballotId);

  for (let i = 0; i < proposals.length; i++) {
    console.log(`Proposal no. ${i + 1}: ${proposals[i].title}`);
    console.log(`Details: ${proposals[i].details}`);
    console.log('Choices:');
    if (proposals[i].choicesCount === 0) {
      console.log(`  A) YES`);
      console.log(`  B) NO`);
      console.log(`  C) ABSTAIN`);
    } else {
      const choices = proposals[i].choices;
      for (let j = 0; j < proposals[i].choicesCount; j++) {
        console.log(`  ${String.fromCharCode(65 + j)}) ${choices[j]}`);
      }
    }
    console.log();
  }

  const votingPower = new BigNumber(web3.utils.fromWei(await currentVotingModule.methods.getVoteTokenCount(Issuer.address, ballotId).call()));
  console.log(`You have ${votingPower} votes that can be allocated.`);
  console.log(`You can distribute it over the different choices as you want.`);
  console.log('Please enter the amount of votes you want to assign to each choice:', '\n')

  let remaining = votingPower;
  const proposalVotes = [];
  for (let i = 0; i < proposals.length; i++) {
    const choicesVotes = [];
    const choicesCount = proposals[i].choicesCount > 0 ? proposals[i].choicesCount : 3;
    for (let j = 0; j < choicesCount; j++) {
      const vote = input.readNumberBetween(0, remaining.toNumber(), `Enter how many votes you want to assign for choice ${String.fromCharCode(65 + j)} at proposal no. ${i + 1}: `, 0);
      remaining = remaining.minus(new BigNumber(vote));
      choicesVotes.push(vote);
    }
    proposalVotes.push(choicesVotes);
  }
  console.log('\n', chalk.yellow('Please review your votes'), '\n')
  for (let i = 0; i < proposals.length; i++) {
    console.log(`Proposal no. ${i + 1}: ${proposals[i].title}`);
    console.log(`Details: ${proposals[i].details}`);
    if (proposals[i].choicesCount === 0) {
      console.log(`  A) YES:     \t\t ${proposalVotes[i][0]}`);
      console.log(`  B) NO:      \t\t ${proposalVotes[i][1]}`);
      console.log(`  C) ABSTAIN: \t\t ${proposalVotes[i][2]}`);
    } else {
      const choices = proposals[i].choices;
      for (let j = 0; j < proposals[i].choicesCount; j++) {
        console.log(`  ${String.fromCharCode(65 + j)}) ${choices[j]}:\t\t ${proposalVotes[i][j]}`);
      }
    }
    console.log();
  }
  if (remaining.toNumber() !== 0) {
    console.log(chalk.yellow(`You have not assigned all your votes. The remaining ${remaining} votes will be counted as ABSTAIN.`));
  }

  if (!readlineSync.keyInYNStrict(`Do you confirm it is OK?`)) {
    await commitVote(ballotId);
  } else {
    const defaultSalt = Math.floor(Math.random() * 100000000);
    const salt = input.readNumberBetween(10000000, 99999999, `Enter an 8-digit number to encode your votes (or leave it empty to generate one randomly): `, defaultSalt);
    console.log(`The salt is ${salt}`);
    const flatVotes = proposalVotes.reduce((acc, val) => acc.concat(val), []).map(v => web3.utils.toWei(v));
    const data = [...flatVotes, salt];
    const action = currentVotingModule.methods.commitVote(ballotId, web3.utils.soliditySha3(...data));
    const receipt = await common.sendTransaction(action);
    await fs.writeFile(`${__dirname}/../data/Checkpoint/Voting/MyVotes/${Issuer.address}_${ballotId}.csv`, data.join(','), 'utf8');
    const event = common.getEventFromLogs(currentVotingModule._jsonInterface, receipt.logs, 'VoteCommit');
    console.log(chalk.green(`Your vote has been sent successfully!`));
  }
}

async function revealVote(ballotId) {
  console.log('\n', chalk.blue('Voting manager - Reveal vote', '\n'));

  const csvFilePath = readlineSync.question(`Enter the path for csv data file containing your votes and salt (or leave it empty to use the default path): `, {
    defaultInput: `${__dirname}/../data/Checkpoint/Voting/MyVotes/${Issuer.address}_${ballotId}.csv`
  });
  const fileData = (await fs.readFile(csvFilePath, 'utf8')).split(',');
  const votes = fileData.slice(0, fileData.length - 1).map(d => new BigNumber(d));
  const salt = fileData[fileData.length - 1]
  const action = currentVotingModule.methods.revealVote(ballotId, votes, salt);
  const receipt = await common.sendTransaction(action);
  await fs.unlink(`${__dirname}/../data/Checkpoint/Voting/MyVotes/${Issuer.address}_${ballotId}.csv`);
  const event = common.getEventFromLogs(currentVotingModule._jsonInterface, receipt.logs, 'VoteRevealed');
  console.log(chalk.green(`Your vote has been revealed successfully!`));
}

function showBallotResults(ballotName, proposals, results) {
  console.log('\n', chalk.blue(`Voting manager - ${ballotName} results`, '\n'));

  let k = 0;
  for (let i = 0; i < proposals.length; i++) {
    console.log(`Proposal no. ${i + 1}: ${proposals[i].title}`);
    console.log(`Details: ${proposals[i].details}`);
    console.log('Choices:');
    if (proposals[i].choicesCount === 0) {
      console.log(`  A) YES:     \t\t ${web3.utils.fromWei(results.choicesWeighting[k++])}`);
      console.log(`  B) NO:      \t\t ${web3.utils.fromWei(results.choicesWeighting[k++])}`);
      console.log(`  C) ABSTAIN: \t\t ${web3.utils.fromWei(results.choicesWeighting[k++])}`);
    } else {
      const choices = proposals[i].choices;
      for (let j = 0; j < proposals[i].choicesCount; j++) {
        console.log(`  ${String.fromCharCode(65 + j)}) ${choices[j]}: \t\t\t ${web3.utils.fromWei(results.choicesWeighting[k++])}`);
      }
    }
    console.log();
  }
}

async function reclaimFromContract() {
  const options = ['ETH', 'ERC20'];
  const index = readlineSync.keyInSelect(options, 'What do you want to reclaim?', { cancel: 'RETURN' });
  const selected = index !== -1 ? options[index] : 'RETURN';
  switch (selected) {
    case 'ETH':
      const ethBalance = await web3.eth.getBalance(currentVotingModule.options.address);
      output.logBalance(currentVotingModule.options.address, 'ETH', web3.utils.fromWei(ethBalance));
      const reclaimETHAction = currentVotingModule.methods.reclaimETH();
      await common.sendTransaction(reclaimETHAction);
      console.log(chalk.green('ETH has been reclaimed succesfully!'));
      break;
    case 'ERC20':
      const erc20Address = input.readAddress('Enter the ERC20 token address to reclaim (POLY = ' + polyToken.options.address + '): ', polyToken.options.address);
      const reclaimERC20Action = currentVotingModule.methods.reclaimERC20(erc20Address);
      await common.sendTransaction(reclaimERC20Action);
      console.log(chalk.green('ERC20 has been reclaimed succesfully!'));
      break
  }
}

async function selectCheckpoint(includeCreate) {
  if (await securityToken.methods.currentCheckpointId().call() > 0) {
    let fix = 1; // Checkpoint 0 is not included, so I need to add 1 to fit indexes for checkpoints and options
    let options = [];
    const checkpoints = (await getCheckpoints()).map(function (c) { return c.timestamp });
    if (includeCreate) {
      options.push('Create new checkpoint');
      fix = 0; // If this option is added, fix isn't needed.
    }
    options = options.concat(checkpoints);

    return readlineSync.keyInSelect(options, 'Select a checkpoint:', { cancel: false }) + fix;
  } else {
    return 0;
  }
}

async function selectBallot(allBallotsToShow) {
  let result = null;
  const options = allBallotsToShow.map(function (b) {
    return `Name: ${b.name}
    Type: ${b.type}
    Stage: ${b.stage}
    Cancelled: ${b.isCancelled ? 'YES' : 'NO'}`
  });

  const index = readlineSync.keyInSelect(options, 'Select a ballot:', { cancel: 'RETURN' });
  if (index !== -1) {
    result = allBallotsToShow[index];
  }

  return result;
}

async function getAllBallots() {
  const result = [];
  function BallotToShow(id, name, totalProposals, stage, isCancelled) {
    return {
      id,
      name: web3.utils.hexToUtf8(name),
      type: parseInt(totalProposals) === 1 ? 'Statutory' : 'Cumulative',
      stage: Stage(stage),
      isCancelled
    }
  }

  const allBallots = await currentVotingModule.methods.getAllBallots().call();
  for (let i = 0; i < allBallots[0].length; i++) {
    const ballot = BallotToShow(
      allBallots.ballotIds[i],
      allBallots.names[i],
      allBallots.totalProposals[i],
      allBallots.currentStages[i],
      allBallots.isCancelled[i]
    );
    result.push(ballot);
  }
  return result;
}

async function getCheckpoints() {
  const result = [];

  const checkPointsTimestamps = await securityToken.methods.getCheckpointTimes().call();
  for (let index = 0; index < checkPointsTimestamps.length; index++) {
    const checkpoint = {};
    checkpoint.id = index + 1;
    checkpoint.timestamp = moment.unix(checkPointsTimestamps[index]).format('MMMM Do YYYY, HH:mm:ss');
    result.push(checkpoint);
  }

  return result.sort((a, b) => a.id - b.id);
}

function showAddresses(title, excluded) {
  console.log(title);
  excluded.map(address => console.log(address));
  console.log();
}

async function getCumulativeBallotProposals(ballotId) {
  const event = (await currentVotingModule.getPastEvents('CumulativeBallotCreated', { fromBlock: 0, filter: { _ballotId: [ballotId] } }))[0];
  const proposalsCount = event.returnValues._noOfChoices.length;
  const titles = event.returnValues._proposalTitle.split(',');
  const choicesCounts = event.returnValues._noOfChoices.map(c => parseInt(c));
  const choices = event.returnValues._choices.split(',');
  const proposals = [];
  let startChoiceIndex = 0;
  for (let i = 0; i < proposalsCount; i++) {
    const proposal = Proposal(
      titles[i],
      web3.utils.hexToUtf8(event.returnValues._details[i]),
      choices.slice(startChoiceIndex, startChoiceIndex + choicesCounts[i])
    );
    startChoiceIndex += choicesCounts[i];
    proposals.push(proposal);
  }
  return proposals;
}

async function getStatutoryBallotProposal(ballotId) {
  const event = (await currentVotingModule.getPastEvents('StatutoryBallotCreated', { fromBlock: 0, filter: { _ballotId: [ballotId] } }))[0];
  const proposal = Proposal(
    event.returnValues._proposalTitle,
    web3.utils.hexToUtf8(event.returnValues._details),
    event.returnValues._choices.split(',')
  );
  return [proposal];
}

function Proposal(title, details, choices) {
  return {
    title,
    details,
    choices,
    choicesCount: choices.length
  }
}

function Ballot(startTime, commitDuration, revealDuration, proposals, checkpointId, exemptions) {
  return {
    startTime,
    commitDuration,
    revealDuration,
    proposalTitles: proposals.map(p => p.title),
    proposalDetails: proposals.map(p => p.details),
    choices: proposals.map(p => p.choices).reduce((acc, val) => acc.concat(val), []), // To flat the array
    choicesCounts: proposals.map(p => p.choicesCount),
    checkpointId,
    exemptions: exemptions ? [] : exemptions
  }
}

function Stage(stage) {
  const intStage = parseInt(stage);
  if (intStage === 0) {
    return 'Prepare';
  } else if (intStage === 1) {
    return 'Commit';
  } else if (intStage === 2) {
    return 'Reveal';
  } else {
    return 'Resolved';
  }
}

async function initialize(_tokenSymbol) {
  welcome();
  await setup();
  securityToken = await common.selectToken(securityTokenRegistry, _tokenSymbol);
  if (securityToken === null) {
    process.exit(0);
  } else {
    tokenSymbol = await securityToken.methods.symbol().call();
  }
}

function welcome() {
  common.logAsciiBull();
  console.log("**********************************************");
  console.log("Welcome to the Command-Line Dividends Manager.");
  console.log("**********************************************");
  console.log("Issuer Account: " + Issuer.address + "\n");
}

async function setup() {
  try {
    const securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    const iSecurityTokenRegistryABI = abis.iSecurityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(iSecurityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

    const polyTokenAddress = await contracts.polyToken();
    const polyTokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polyTokenABI, polyTokenAddress);
    polyToken.setProvider(web3.currentProvider);

    const moduleRegistryAddress = await contracts.moduleRegistry();
    const moduleRegistryABI = abis.moduleRegistry();
    moduleRegistry = new web3.eth.Contract(moduleRegistryABI, moduleRegistryAddress);
    moduleRegistry.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

module.exports = {
  executeApp: async function (_tokenSymbol) {
    await initialize(_tokenSymbol);
    return executeApp();
  }
}
