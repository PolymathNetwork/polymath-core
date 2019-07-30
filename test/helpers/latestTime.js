// Returns the time of the last mined block in seconds
export default async function latestTime() {
    let block = await latestBlock();
    return block.timestamp;
}

async function latestBlock() {
    return web3.eth.getBlock("latest");
}
