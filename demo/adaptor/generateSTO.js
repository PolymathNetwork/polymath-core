var readlineSync = require('readline-sync')
var fs = require('fs')
var ozadaptor_path = "zeppelin-solidity/contracts/crowdsale";
let parent_contract
let import_statements
let contract_name

async function generate() {
  let start = readlineSync.question('Press enter to continue or exit (CTRL + C): ', {
    defaultInput: 'Y'
  })

  if (start != 'Y') {
    return
  }
  get_sto_type();
}

async function get_sto_type() {
  let sto_type = readlineSync.question(`Enter the STO type:\n
    Press 1 for Capped STO\n
    Press 2 for Finalizable STO\n
    Press 3 for PostDelivery STO\n
    Press 4 for Refundable STO\n
    Press 5 for IndividuallyCapped STO\n
    Press 6 for Whitelisted STO\n
    >     `, {
  })

  if (sto_type == '1') {

    parent_contract = "CappedCrowdsale"
    contract_name = "CappedSTO"

    console.log(`You Successfully select ${contract_name}. Please wait 5 Seconds to create the automated smart contract...`)

    import_statements = `import "${ozadaptor_path}` + '/' + `validation/${parent_contract}"` + ";"
    try {
      let configuration = await configure_contract(sto_type)
      await create_contract(parent_contract, contract_name, import_statements, configuration)

    } catch(error) {

      console.log('*** Something is wrong, Not able to create contract ***')

    }  

  } else if (sto_type == '2') {

    parent_contract = "FinalizableCrowdsale"
    contract_name = "FinalizableSTO"

    console.log(`You Successfully select ${contract_name}. Please wait 5 Seconds to create the automated smart contract...`)

    import_statements = `import "${ozadaptor_path}` + '/' + `distribution/${parent_contract}"` + ";"
    
    try {
      let configuration = await configure_contract(sto_type)
      await create_contract(parent_contract, contract_name, import_statements, configuration)

    } catch(error) {

      console.log('*** Something is wrong, Not able to create contract ***')

    }  

  } else if (sto_type == '3') {

    parent_contract = "PostDeliveryCrowdsale"
    contract_name = "PostDeliverySTO"

    console.log(`You Successfully select ${contract_name}. Please wait 5 Seconds to create the automated smart contract...`)

    import_statements = `import "${ozadaptor_path}` + '/' + `distribution/${parent_contract}"` + ";"
    
    try {

      let configuration = await configure_contract(sto_type)
      await create_contract(parent_contract, contract_name, import_statements, configuration)

    } catch(error) {

      console.log('*** Something is wrong, Not able to create contract ***')

    }  

  } else if (sto_type == '4') {
      
    parent_contract = "RefundableCrowdsale"
    contract_name = "RefundableSTO"

    console.log(`You Successfully select ${contract_name}. Please wait 5 Seconds to create the automated smart contract...`)

    import_statements = `import "${ozadaptor_path}` + '/' + `distribution/${parent_contract}"` + ";"
    
    try {

      let configuration = await configure_contract(sto_type)
      await create_contract(parent_contract, contract_name, import_statements, configuration)

    } catch(error) {

      console.log('*** Something is wrong, Not able to create contract ***')

    }  

  } else if (sto_type == '5') {

    parent_contract = "IndividuallyCappedCrowdsale"
    contract_name = "IndividuallyCappedSTO"

    console.log(`You Successfully select ${contract_name}. Please wait 5 Seconds to create the automated smart contract...`)

    import_statements = `import "${ozadaptor_path}` + '/' + `validation/${parent_contract}"` + ";"
    
    try {

      let configuration = await configure_contract(sto_type)
      await create_contract(parent_contract, contract_name, import_statements, configuration)

    } catch(error) {

      console.log('*** Something is wrong, Not able to create contract ***')
    
    }

  } else if (sto_type == '6') {

    parent_contract = "WhitelistedCrowdsale"
    contract_name = "WhitelistedSTO"

    console.log(`You Successfully select ${contract_name}. Please wait 5 Seconds to create the automated smart contract...`)

    import_statements = `import "${ozadaptor_path}` + '/' + `validation/${parent_contract}"` + ";"
    
    try {

      let configuration = await configure_contract(sto_type)
      await create_contract(parent_contract, contract_name, import_statements, configuration)

    } catch(error) {

      console.log('*** Something is wrong, Not able to create contract ***')

    }  
  }

}

async function create_contract(parent_contract, contract_name, import_statements, configuration) {
  
  let solidity_version = "pragma solidity ^0.4.21;"
  let import_sto = `import "../../contracts/modules/STO/ISTO.sol";\nimport "../../contracts/interfaces/IST20.sol";\nimport "${ozadaptor_path}` + '/' + `emission/MintedCrowdsale";`
  let content = `${solidity_version}\n\n${import_sto}\n${import_statements} \n \ncontract ${contract_name} is ${parent_contract}, ISTO, MintedCrowdsale { \n
  function ${contract_name}(address _securityToken)\n  IModule(_securityToken)\n  { \n  }\n\n ${configuration}\n}`

  fs.writeFile('./demo/adaptor/' + contract_name + '.sol', content, function(error) {
    if (error) {
      console.log(error)
      return
    }
  })
}

async function configure_contract(sto_type) {
  var configure_content = ` function configure(\n    uint256 _startTime,\n    uint256 _endTime,\n    uint256 _rate,\n    uint8 _fundRaiseType,\n    address _polyToken,\n    address _fundsReceiver\n  )\n  public\n  onlyFactory\n  {\n  }
  \n\n  function getInitFunction() public returns (bytes4) { \n    return bytes4(keccak256("configure(uint256,uint256,uint256,uint8,address,address)"));\n  }`
  
  if (sto_type == '1' || sto_type == '4') {
    let variable = sto_type == '1'?"_cap":"_goal"
    configure_content = ` function configure(\n    uint256 _startTime,\n    uint256 _endTime,\n    uint256 _rate,\n    uint256 ${variable},\n    uint8 _fundRaiseType,\n    address _polyToken,\n    address _fundsReceiver\n  )\n  public\n  onlyFactory\n  {\n  }
    \n\n  function getInitFunction() public returns (bytes4) { \n    return bytes4(keccak256("configure(uint256,uint256,uint256,uint256,uint8,address,address)"));\n  }`
    return configure_content
  } 
 else {
    return configure_content
 }
      
} 

generate()