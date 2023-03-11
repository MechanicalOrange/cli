#!/usr/bin/env node

/*
MIT License

Copyright (c) [2022] [MechanicalOrange]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


const pckg    = require('./../package.json')
const program = require('commander')
const mapi    = require('../lib/hedera_api')
const msol    = require('../lib/sol_param')
const file    = require('../lib/file')
const util    = require('../lib/utils')

const ccheck  = require('../../common/cmd_checker')


const cl = console.log

program
  .name("contract")
  .description("Hedera contract services.")
  .version(pckg.version)


program
  .command('compile')
  .addOption(new program.Option('-s, --sol <solidity-file>', "Path to the solidity file that contains the contract to be compiled.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .addOption(new program.Option('-b, --bin-dir <binary-file>', "Path to the binary file that is generated.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .description('Compiles a solidity contract.')
  .action(async (args) => {

    console.log(`Compiling solidiry contract.`) 
    const result = await mapi.compileContract(args.sol, args.binDir)
  })


program
  .command('store')
  .addOption(new program.Option('-b, --bin <binary-file>', "Path to the binary file that is generated.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .addOption(new program.Option('-m, --memo <memo>', "Memo of the account.")
    .argParser(ccheck.checkHederaMemo).default("")) 
  .addOption(new program.Option('-f, --max-fee <hbar>', "Maximum transaction fee to be paid for creating an account.")
    .argParser(ccheck.checkFloatNumber).makeOptionMandatory())  
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .description('Store the binary contract into a Hedera file.')
  .action(async (args) => {

    console.log(`Storing a contract`) 
    const result = await mapi.storeContract(args.bin, args.memo, args.maxFee, args.network, args.cred)

    let exitStatus = null
    if (result.transactionStatus === "SUCCESS") {
      file.writeFileBytecodeFileId(result.bytecodeFileIdAsString)
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No contract byte code was stored!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })


program
  .command('deploy')
  .addOption(new program.Option('-f, --file-id <shard.realm.account>', 'The file Id that contains the contract .')
    .argParser(ccheck.checkHederaAccount).makeOptionMandatory()) 
  .addOption(new program.Option('-u, --user-inputs <arguments separated by commas>', "List of the input arguments separated by commas.")
    .argParser(ccheck.checkString)) 
  .addOption(new program.Option('-a, --abi <solidity-abi-file>', "Path to the solidity abi file.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .addOption(new program.Option('-g, --max-gas <unit of gas>', "Maximum units of gas allocated for this transaction.")
    .makeOptionMandatory())  // FIXME check that it is integer
  .addOption(new program.Option('-o, --config <config-json-file>', "Path to the JSON file that contains the contract configuration.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .description('Deploy a contract.')
  .action(async (args) => {

    debugger
    console.log(`Deploying a contract.`) 
    const resultAbi = mapi.getConstructorAbiParams(args.abi)

    let solParam = null
    if (resultAbi.isConstructorPresent) {
      cl(`Constructor exists, has stateMutability ${resultAbi.stateMutability} and has the inputs:`)
      cl(resultAbi.inputs)
      solParam = msol.buildContractParams(args.userInputs, resultAbi.inputs)
    }
    else {
      console.error(`Warning! Constructor does not exist!`)
    }

    const contractConfig = util.checkContractConfig(args.config)
    const result = await mapi.deployContract(args.fileId, solParam, args.maxGas, contractConfig, args.network, args.cred)

    let exitStatus = null
    if (result.transactionStatus === "SUCCESS") {
      console.log(`File ${args.fileId} was deployed as contract with the id ${result.contractIdAsString}`) 
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No fileID was deployed as contract!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })


program
  .command('delete')
  .addOption(new program.Option('-i, --contract-id <shard.realm.account>', 'The contract Id that contains the deployed contract .')
    .argParser(ccheck.checkHederaAccount).makeOptionMandatory()) 
  .addOption(new program.Option('-x, --contract-id-to-transfer <shard.realm.account>', 'The contract Id that receives the funds of the contract .')
    .argParser(ccheck.checkHederaAccount).default("null")) 
  .addOption(new program.Option('-d, --account-id-to-transfer <shard.realm.account>', 'The account Id that receives the funds of the contract .')
    .argParser(ccheck.checkHederaAccount).default("null"))  
  .addOption(new program.Option('-o, --config <config-json-file>', "Path to the JSON file that contains the token configuration.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .description('Delete a contract. The funds are transferred to account-id-to-transfer or the contract-id-to-transfer.')
  .action(async (args) => {

    console.log('Deleting a contract.') 

    const contractConfig = util.checkContractConfig(args.config)
    const result = await mapi.deleteContract(args.contractId, args.contractIdToTransfer, args.accountIdToTransfer, contractConfig, args.network, args.cred)

    let exitStatus = null
    if (result.transactionStatus === "SUCCESS") {
      console.log(`Contract ${args.contractId} was deleted.`) 
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No contract was deleted!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })



program
  .command('execute')
  .addOption(new program.Option('-i, --contract-id <shard.realm.account>', 'The contract Id that contains the deployed contract .')
    .argParser(ccheck.checkHederaAccount).makeOptionMandatory()) 
  .addOption(new program.Option('-f, --function-name <solidity-function>', "Function name in solidity file.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .addOption(new program.Option('-a, --abi <solidity-abi-file>', "Path to the solidity abi file.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .addOption(new program.Option('-u, --user-inputs <arguments separated by commas>', "List of the input arguments separated by commas.")
    .argParser(ccheck.checkString)) 
  .addOption(new program.Option('-p, --pay <hbar>', "Pay amount in hbar.")
    .argParser(ccheck.checkFloatNumber).default(1)) 
  .addOption(new program.Option('-g, --max-gas <unit of gas>', "Maximum units of gas allocated for this transaction.")
    .makeOptionMandatory())  // FIXME check that it is integer
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .description('Check that the function exists and has the right params.')
  .action(async (args) => {

    console.log(`Executing the function: ${args.functionName}`) 

    const result = await mapi.executeContractFunction(args.contractId, args.functionName, args.userInputs, args.pay, args.abi, args.maxGas, args.network, args.cred)
    

    let exitStatus = null
    if (result !== null && result.transactionStatus === "SUCCESS") {
      if (args.userInputs === undefined) {
        console.log(`Function "${args.functionName}" with no arguments was executed successfully.`)
      }
      else {
        console.log(`Function "${args.functionName}" with arguments "${args.userInputs}" was executed successfully.`)
      }
      exitStatus = 0 
      if (result.outputAsStringArray !== null) {
        result.outputAsStringArray.forEach(element => console.log(element)) 
      }
      if (result.eventsAsStringArray !== null) {
        result.eventsAsStringArray.forEach(element => console.log(element)) 
      }
      console.log("Gas used: ", result.gasUsed)
    }
    else {
      exitStatus = 1 
      console.error(`Error! The contract ${args.contractId} could not execute the function "${args.functionName}" with the arguments "${args.userInputs}"!`)
    }
    process.exit(exitStatus)
  })


program
  .command('get-byte-code')
  .addOption(new program.Option('-i, --contract-id <shard.realm.account>', 'The contract Id that contains the deployed contract .')
    .argParser(ccheck.checkHederaAccount).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .description('Get the byte code of the contract.')
  .action(async (args) => {

    console.log(`Getting the bytecode of the contract.`) 

    const result = await mapi.getByteCode(args.contractId, args.network, args.cred)
    
    let exitStatus = null
    if (result !== null && result.transactionStatus === "SUCCESS") {
      console.log(`The byte code of the contract ${args.contractId} is:`)
      console.log(result.byteCodeResponse.toString("hex"))
      //Buffer.from(data).toString("hex")
      exitStatus = 0 
    }
    else {
      exitStatus = 1 
      console.error(`Error! The byte code of the contract ${args.contractId} could not be retrieved!`)
    }
    process.exit(exitStatus)
  })


program
  .command('get-info')
  .addOption(new program.Option('-i, --contract-id <shard.realm.account>', 'The contract Id that contains the deployed contract .')
    .argParser(ccheck.checkHederaAccount).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .description('Get the info of the contract.')
  .action(async (args) => {

    console.log(`Getting the info of the contract.`) 

    const result = await mapi.getInfo(args.contractId, args.network, args.cred)
    
    let exitStatus = null
    if (result !== null && result.transactionStatus === "SUCCESS") {
      console.log(`The info of the contract ${args.contractId} is:`)
      //console.log(JSON.stringify(result.infoQueryResponse, null, 2))
      util.printContractInfo(result.infoQueryResponse)
      exitStatus = 0 
    }
    else {
      exitStatus = 1 
      console.error(`Error! The byte code of the contract ${args.contractId} could not be retrieved!`)
    }
    process.exit(exitStatus)
  })


program
  .command('update-info')
  .addOption(new program.Option('-i, --contract-id <shard.realm.account>', 'The contract Id that contains the deployed contract .')
    .argParser(ccheck.checkHederaAccount).makeOptionMandatory()) 
  .addOption(new program.Option('-o, --config <config-json-file>', "Path to the JSON file that contains the token configuration.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(ccheck.checkString).makeOptionMandatory()) 
  .description('Update info of the contract.')
  .action(async (args) => {

    console.log(`Updating the info of the contract.`) 

    const contractConfig = util.checkContractConfig(args.config)
    const result = await mapi.updateInfo(args.contractId, contractConfig, args.network, args.cred)
    
    let exitStatus = null
    if (result !== null && result.transactionStatus === "SUCCESS") {
      console.log(`The info of the contract ${args.contractId} was updated!`)
      //console.log(JSON.stringify(result.infoQueryResponse, null, 2))
      //util.printContractInfo(result.contractResponse)
      //console.log(result.contractResponse)
      exitStatus = 0 
    }
    else {
      exitStatus = 1 
      console.error(`Error! The byte code of the contract ${args.contractId} could not be retrieved!`)
    }
    process.exit(exitStatus)
  })

program.parse(process.argv)


