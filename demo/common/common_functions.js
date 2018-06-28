var chalk = require('chalk');

module.exports = {
  estimateGas: async function (actionToEstimate, fromAddress, factor) {
    let estimatedGAS = Math.round(factor * (await actionToEstimate.estimateGas({ from: fromAddress })));
    console.log(chalk.black.bgYellowBright(`---- Transaction executed: ${actionToEstimate._method.name} - Gas limit provided: ${estimatedGAS} ----`));    
    return estimatedGAS;
  }
};
