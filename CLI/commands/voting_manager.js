const readlineSync = require('readline-sync');
const chalk = require('chalk');
const moment = require('moment');
const BigNumber = require('bignumber.js');
const { table } = require('table');
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
const ADD_SCHEDULE_FROM_TEMPLATE_CSV = `${__dirname}/../data/Wallet/VEW/add_schedule_from_template_data.csv`;
const MODIFY_SCHEDULE_CSV = `${__dirname}/../data/Wallet/VEW/modify_schedule_data.csv`;
const REVOKE_SCHEDULE_CSV = `${__dirname}/../data/Wallet/VEW/revoke_schedule_data.csv`;

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
  const moduleList = await common.getAvailableModules(moduleRegistry, gbl.constants.MODULES_TYPES.DIVIDENDS, securityToken.options.address);
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
  const defaultExemptedVoters = await currentVotingModule.methods.getDefaultExemptionVotersList().call();

  console.log(`- Current ST checkpoint:         ${currentCheckpointId > 0 ? currentCheckpointId : 'None'}`);
  console.log(`- Exempted voters by default:    ${defaultExemptedVoters.length}`);
  console.log(`- Total ballot count:            ${allBalotsToShow.length}`);
  console.log(`- Current ballots:               ${prepareBallots.length + commitBallots.length + revealBallots.length}`);
  console.log(`    Preparation satage:          ${prepareBallots.length}`);
  console.log(`    Commit satage:               ${commitBallots.length}`);
  console.log(`    Reveal satage:               ${revealBallots.length}`);
  console.log();
  console.log(`- Pending ballots:               ${pendingBallots.length}`);

  const options = ['Create checkpoint'];
  if (currentCheckpointId > 0) {
    options.push('Explore checkpoint');
  }
  if (defaultExemptedVoters.length > 0) {
    options.push('Show current exempted voters by default');
  }
  options.push('Add or remove exempted voters by default');
  if (allBalotsToShow.length > 0) {
    options.push('Manage existing ballots');
  }
  options.push('Create a new ballot', 'Reclaim ETH or ERC20 tokens from contract');

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let selected = index !== -1 ? options[index] : 'RETURN';
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
      let selectedBallot = await selectBallot(allBalotsToShow);
      if (selectedBallot) {
        await manageExistingBallot(selectedBallot.id);
      }
      break;
    case 'Create a new ballot':
      await createBallot();
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

  const ballot = Ballot(startTime, commitDuration, revealDuration, proposals, checkpointId, useDefaultExemptions, exemptions);

  if (ballot.proposalDetails.length === 1) {
    // Statutory ballot
    let action;
    if (ballot.checkpointId === 0) {
      // Standard
      if (exemptions) {
        // With exemptions
        action = currentVotingModule.methods.createStatutoryBallotWithExemption(
          web3.utils.toHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          web3.utils.toHex(ballot.proposalDetails[0]),
          ballot.choices.join(','),
          ballot.choicesCounts[0],
          ballot.exemptions
        )
      } else {
        // Standard
        action = currentVotingModule.methods.createStatutoryBallot(
          web3.utils.toHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          web3.utils.toHex(ballot.proposalDetails[0]),
          ballot.choices.join(','),
          ballot.choicesCounts[0]
        )
      }
    } else {
      // Custom
      if (exemptions) {
        // With exemptions
        action = currentVotingModule.methods.createCustomStatutoryBallotWithExemption(
          web3.utils.toHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          web3.utils.toHex(ballot.proposalDetails[0]),
          ballot.choices.join(','),
          ballot.choicesCounts[0],
          ballot.checkpointId,
          ballot.exemptions
        )
      } else {
        // Standard
        action = currentVotingModule.methods.createCustomStatutoryBallot(
          web3.utils.toHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          web3.utils.toHex(ballot.proposalDetails[0]),
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
          web3.utils.toHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          ballot.proposalDetails.map(pd => web3.utils.toHex(pd)),
          ballot.choices.join(','),
          ballot.choicesCounts,
          ballot.exemptions
        )
      } else {
        // Standard
        action = currentVotingModule.methods.createCumulativeBallot(
          web3.utils.toHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          ballot.proposalDetails.map(pd => web3.utils.toHex(pd)),
          ballot.choices.join(','),
          ballot.choicesCounts
        )
      }
    } else {
      // Custom
      if (exemptions) {
        // With exemptions
        action = currentVotingModule.methods.createCustomCumulativeBallotWithExemption(
          web3.utils.toHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          ballot.proposalDetails.map(pd => web3.utils.toHex(pd)),
          ballot.choices.join(','),
          ballot.choicesCounts,
          ballot.checkpointId,
          ballot.exemptions
        )
      } else {
        // Standard
        action = currentVotingModule.methods.createCustomCumulativeBallot(
          web3.utils.toHex(name),
          ballot.startTime,
          ballot.commitDuration,
          ballot.revealDuration,
          ballot.proposalTitles.join(','),
          ballot.proposalDetails.map(pd => web3.utils.toHex(pd)),
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
  // Show current data
  const details = await currentVotingModule.methods.getBallotDetails(ballotId).call();
  const type = details.totalProposals > 1 ? 'Cumulative' : 'Statutory';
  const allowedVoters = await currentVotingModule.methods.getAllowedVotersByBallot(ballotId).call();
  const exemptedVoters = await currentVotingModule.methods.getExemptedVoters(ballotId).call();
  const proposals = type === 'Statutory' ? await getStatutoryBallotProposal(ballotId) : await getCumulativeBallotProposals(ballotId);
  const results = details.currentStage === 3 ? await currentVotingModule.methods.getBallotResults(ballotId) : undefined;

  console.log(`- Name:                            ${details.name}`);
  if (details.isCancelled) {
    console.log(`- Cancelled:                       ${chalk.red('YES')}`);
  } else {
    console.log(`- Current stage:                   ${details.currentStage}`);
  }
  console.log(`- Type:                            ${type}`);
  console.log(`- Checkpoint:                      ${details.checkpointId}`);
  console.log(`- Total supply at checkpoint:      ${details.totalSupplyAtCheckpoint}`);
  console.log(`- Start time:                      ${details.startTime}`);
  console.log(`- Commit duration:                 ${details.commitDuration}`);
  console.log(`- Reveal duration:                 ${details.revealDuration}`);
  console.log(`- Allowed voters:                  ${allowedVoters.length}`);
  console.log(`- Exempted voters:                 ${exemptedVoters.length}`);
  console.log(`- Total commited votes:            ${details.commitedVoteCount}`);
  console.log(`- Total revealed votes:            ${details.totalVoters}`);
  console.log(`- Proposals:`);
  for (let i = 0; i < details.totalProposals; i++) {
    console.log(`  - ${proposals[i].title}:         ${proposals[i].details}`);
    const choices = proposals[i].choices;
    for (let j = 0; j < proposals[i].choicesCount; j++) {
      console.log(`    - ${choices[j]}`);
    }
  }

  let options = ['Show allowed voters', 'Show exempted voters'];
  if (details.currentStage === 3) {
    options.push('Show results')
  } else {
    options.push('Change exempted voters', 'Cancel ballot');
  }

  const index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  const optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Show allowed voters':
      showAddresses(`Current allowed voters for ${details.name} ballot:`, allowedVoters);
      break;
    case 'Show exempted voters':
      showAddresses(`Current exempted voters for ${details.name} ballot:`, exemptedVoters);
      break;
    case 'Show results':
      // TODO
      break;
    case 'Change exempted voters':
      // TODO
      break;
    case 'Cancel ballot':
      // TODO
      break;
    case 'RETURN':
      return;
  }

  await manageExistingBallot(ballotId);
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

  let index = readlineSync.keyInSelect(options, 'Select a ballot:', { cancel: 'RETURN' });
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
      type: totalProposals === 1 ? 'Statutory' : 'Cumulative',
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
  let result = [];

  let checkPointsTimestamps = await securityToken.methods.getCheckpointTimes().call();
  for (let index = 0; index < checkPointsTimestamps.length; index++) {
    let checkpoint = {};
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
  const choices = event.returnValues._choices.split(',');
  const proposals = [];
  let startChoiceIndex = 0;
  for (let i = 0; i < proposalsCount; i++) {
    const proposal = Proposal(
      titles[i],
      web3.utils.hexToUtf8(event.returnValues._details[i]),
      choices.slice(startChoiceIndex, startChoiceIndex + choices[i] - 1)
    );
    startChoiceIndex = choices[i];
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
    exemptions
  }
}

function Stage(stage) {
  if (stage === 0) {
    return 'Prepare';
  } else if (stage === 1) {
    return 'Commit';
  } else if (stage === 2) {
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
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let iSecurityTokenRegistryABI = abis.iSecurityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(iSecurityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

    let polyTokenAddress = await contracts.polyToken();
    let polyTokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polyTokenABI, polyTokenAddress);
    polyToken.setProvider(web3.currentProvider);

    let moduleRegistryAddress = await contracts.moduleRegistry();
    let moduleRegistryABI = abis.moduleRegistry();
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
