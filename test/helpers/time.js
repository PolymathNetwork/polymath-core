// Special non-standard methods implemented by testrpc that
// aren’t included within the original RPC specification.
// See https://github.com/ethereumjs/testrpc#implemented-methods

async function increaseTime(duration) {
    let currentTime = (await web3.eth.getBlock('latest')).timestamp
    await jumpToTime(currentTime + duration);
}

async function jumpToTime(timestamp) {
  const id = Date.now();

  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        params: [timestamp],
        id: id
      },
      (err, res) => {
        return err ? reject(err) : resolve(res);
      }
    );
  });
}

export default function takeSnapshot() {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_snapshot",
                params: [],
                id: new Date().getTime()
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }

                resolve(result.result);
            }
        );
    });
}

async function revertToSnapshot(snapShotId) {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_revert",
                params: [snapShotId],
                id: new Date().getTime()
            },
            err => {
                if (err) {
                    return reject(err);
                }

                resolve();
            }
        );
    });
}

export { increaseTime, takeSnapshot, revertToSnapshot };
