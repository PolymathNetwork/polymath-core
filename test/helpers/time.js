// Special non-standard methods implemented by testrpc that
// aren’t included within the original RPC specification.
// See https://github.com/ethereumjs/testrpc#implemented-methods

// async function increaseTime(duration) {
//     //let currentTime = (await web3.eth.getBlock('latest')).timestamp
//     await sendIncreaseTime(duration);
//     return advanceBlock();
// }

// async function sendIncreaseTime(duration) {
//     return new Promise(() => 
//         web3.currentProvider.send({
//             jsonrpc: '2.0',
//             method: 'evm_increaseTime',
//             params: [duration],
//         })
//     );
// }

// async function advanceBlock() {
//     return new Promise(() => 
//         web3.currentProvider.send({
//             jsonrpc: '2.0',
//             method: 'evm_mine',
//         })
//     );
// }

const pify = require('pify');

function advanceBlock() {
  return pify(web3.currentProvider.send)({
    jsonrpc: '2.0',
    method: 'evm_mine',
  });
}

// Increases ganache time by the passed duration in seconds
async function increaseTime(duration) {
  await pify(web3.currentProvider.send)({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [duration],
  });
  await advanceBlock();
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
