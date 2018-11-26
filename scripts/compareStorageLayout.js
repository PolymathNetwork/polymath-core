const fs = require('fs');
const logicContract = fs.readFileSync('./logic.sol', 'utf8');
const proxyContract = fs.readFileSync('./proxy.sol', 'utf8');
const _ = require('underscore');
const solc = require('solc');

let logicInput = {
  'contracts': logicContract
}
let proxyInput = {
  'contracts': proxyContract
}

function traverseAST(_input, _elements) {
  if(_input.children) {
    for(var i=0;i<_input.children.length;i++) {
      traverseAST(_input.children[i], _elements);
    }
  }
  _elements.push(_input);
}

function compareStorageLayouts(oldLayout, newLayout) {
  function makeComp(x) {
    return [x.constant, x.name, x.scope, x.stateVariable, x.storageLocation, x.type, x.value, x.visibility].join(':');
  }
  // if(newLayout.length < oldLayout.length) return false;
  for(var i=0;i<oldLayout.length;i++) {
    const a = oldLayout[i].attributes;
    const comp1 = makeComp(a)
    console.log(comp1);
    const b = newLayout[i].attributes;
    const comp2 = makeComp(b);
    console.log(comp2);
    if(comp1 != comp2) {
      // return false;
    }
  }
  return true;
}

function parseContract(input) {
  // var output = JSON.parse(require('fs').readFileSync('../build/contracts/Pausable.json').toString()).ast;
  var output = solc.compile({ sources: input }, 1, _.noop);
  const elements = [];
  const AST = output.sources.contracts.AST;
  // console.log(AST);
  traverseAST(AST, elements);
  // console.log(elements);

  // filter out all Contract Definitions
  const contractDefinitions = _.filter(elements, (e,i) =>  e.name == 'ContractDefinition');

  // filter out all linearizedBaseContracts
  // pick the last one as the last contract always has the full inheritance
  const linearizedBaseContracts = _.last(_.map(contractDefinitions, e => e.attributes.linearizedBaseContracts));

  // get all stateVariables
  const stateVariables = _.filter(elements, e => e.attributes && e.attributes.stateVariable )

  // group them by scope
  const stateVariableMap = _.groupBy(stateVariables, e => e.attributes.scope);

  orderedStateVariables = _.reduceRight(linearizedBaseContracts, (a, b) =>  {
    return a.concat(stateVariableMap[b] || [])
  }, []);
  return orderedStateVariables;
}

// console.log(orderedStateVariables);
console.log(compareStorageLayouts(parseContract(logicInput), parseContract(proxyInput)));
