function logBalance(address, symbol, balance) {
  console.log(`Balance of ${address}: ${balance} ${symbol}`);
}

function logUnlockedBalance() {
  if (balanceUnlocked !== totalBalance) {
    console.log(`Balance of ${address}: ${balanceUnlocked} ${tokenSymbol} unlocked (${totalBalance} ${tokenSymbol} total)`);
  } else {
    console.log(`Balance of ${address}: ${totalBalance} ${tokenSymbol}`);
  }
}

function logUnlockedBalanceWithPercentage(address, tokenSymbol, balanceUnlocked, totalBalance, totalSupply) {
  let percentage = totalSupply !== '0' ? ` - ${parseFloat(totalBalance) / parseFloat(totalSupply) * 100}% of total supply` : '';
  if (balanceUnlocked !== totalBalance) {
    console.log(`Balance of ${address}: ${balanceUnlocked} ${tokenSymbol} unlocked (${totalBalance} ${tokenSymbol} total${percentage})`);
  } else {
    console.log(`Balance of ${address}: ${totalBalance} ${tokenSymbol}${percentage}`);
  }
}

function logBalanceAtCheckpoint(address, tokenSymbol, checkpoint, balance) {
  console.log(`Balance of ${address} at checkpoint ${checkpoint}: ${balance} ${tokenSymbol}`);
}

function logTotalSupply(tokenSymbol, totalSupply) {
  console.log(`Total supply is: ${totalSupply} ${tokenSymbol}`);
}

function logTotalSupplyAtCheckpoint(tokenSymbol, checkpoint, totalSupply) {
  console.log(`TotalSupply at checkpoint ${checkpoint} is: ${totalSupply} ${tokenSymbol}`);
}

module.exports = {
  logBalance,
  logUnlockedBalance,
  logBalanceAtCheckpoint,
  logUnlockedBalanceWithPercentage,
  logTotalSupply,
  logTotalSupplyAtCheckpoint
}
