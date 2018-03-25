// Special non-standard methods implemented by testrpc that
// aren’t included within the original RPC specification.
// See https://github.com/ethereumjs/testrpc#implemented-methods

function increaseTime (duration) {
    const id = Date.now();
  
    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [duration],
        id: id,
      }, err1 => {
        if (err1) return reject(err1);
  
        web3.currentProvider.sendAsync({
          jsonrpc: '2.0',
          method: 'evm_mine',
          id: id + 1,
        }, (err2, res) => {
          return err2 ? reject(err2) : resolve(res);
        });
      });
    });
  }

export default function takeSnapshot() {
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_snapshot',
            params: [],
            id: new Date().getTime()
        }, (err, result) => {
            if (err) {
                return reject(err);
            }

            resolve(result.result);
        });
    });
};

function revertToSnapshot(snapShotId) {
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_revert',
            params: [snapShotId],
            id: new Date().getTime()
        }, (err) => {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
};

  export { increaseTime, takeSnapshot, revertToSnapshot };