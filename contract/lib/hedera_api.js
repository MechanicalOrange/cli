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


const { AccountId, Client, PrivateKey, PublicKey, AccountCreateTransaction, AccountInfoQuery, AccountBalanceQuery, TransferTransaction, KeyList, Hbar, BigNumber, FileCreateTransaction, FileAppendTransaction, ContractCreateTransaction, ContractFunctionParameters, ContractCallQuery, ContractExecuteTransaction, ContractByteCodeQuery, ContractDeleteTransaction, ContractInfoQuery, ContractUpdateTransaction} = require("@hashgraph/sdk");

const fs    = require("fs");
const shell = require('shelljs');
const cred  = require('../../common/credentials')
const msol    = require('../lib/sol_param')

"use strict"

const cl = console.log


/**
 * Sets the operator account for a Hedera network client.
 *
 * Reads the account ID and private key from a JSON file and sets them as the operator account
 * for a client instance for the specified network.
 *
 * @param {string} network - The network to set the operator for. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key.
 * @returns {Client} A Hedera network client instance with the operator account set.
 * @throws {Error} If an error occurs while setting the operator account.
 */
const setOperator = (network, credFile) => {
  try {
    const credentials = cred.readFileJson(credFile)

    const accountId  = credentials.accountId
    const privateKey = credentials.privateKey

    if (accountId == null || privateKey == null ) {
      console.error("Error! Environment variables accountId and privateKey must be present in .env file!")
      process.exit(1)
    }

    let operator = null
    if (network === "main") {
      operator = Client.forMainnet()
    }
    else if (network === "test") {
      operator = Client.forTestnet()
    }
    operator.setOperator(accountId, privateKey)
    return operator
  }
  catch(error) {
    console.error("Error! Hedera service failed to set the operator!")
    process.exit(1)
  }
}


/**
 * Compiles a Solidity smart contract and generates its binary and ABI files.
 *
 * Reads a Solidity contract source file and generates its binary and ABI files using the Solidity
 * compiler. The generated files are saved in a directory specified by the user.
 *
 * @param {string} pathContractSol - The path to the Solidity contract source file.
 * @param {string} pathDirContractBin - The path to the directory where the generated files should be saved.
 * @throws {Error} If an error occurs during the compilation process.
 */
const compileContract = (pathContractSol, pathDirContractBin) => {

//  const command = 'solc --overwrite  -o ' + pathDirContractBin + ' --bin --abi --json-indent 4 --ast-compact-json --asm-json ' +  pathContractSol;
  const rm_command = "rm " + pathDirContractBin + "/*"
  cl(rm_command)
  if (shell.exec(rm_command).code !== 0) {
    shell.echo('Error: rm failed!');
    //shell.exit(1);
  }

  const compile_command = 'solc --overwrite  -o ' + pathDirContractBin + ' --bin --abi --json-indent 4 ' +  pathContractSol;
  cl(compile_command)

  if (shell.exec(compile_command).code !== 0) {
    shell.echo('Error: solc failed!');
    shell.exit(1);
  }
  let pathArray = pathContractSol.split("/")
  let contractName = pathArray[pathArray.length - 1]
  let contractNameNoExtension = contractName.split(".")[0]
  let contractNameAbi = pathDirContractBin + "/" + contractNameNoExtension + ".abi"
  const abi = cred.readFileJson(contractNameAbi)
  const abiHumanPath = pathDirContractBin + "/" + contractNameNoExtension + ".abih"
  cred.writeFileJson(abi, abiHumanPath) 

  shell.exit(0)
}

/**
 * Stores a compiled Solidity smart contract on the Hedera network.
 *
 * Reads a binary file containing the compiled bytecode of a Solidity smart contract and stores it
 * on the Hedera network as a file. The file ID is returned for later use in deploying the contract.
 *
 * @param {string} pathContractBin - The path to the binary file containing the compiled bytecode of the smart contract.
 * @param {string} memo - A memo to attach to the transaction.
 * @param {number} maxFee - The maximum fee to pay for the transaction.
 * @param {string} network - The network to use for the transaction, either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key.
 * @returns {Object} An object containing the file ID and transaction status.
 * @throws {Error} If an error occurs during the transaction.
 */
const storeContract = async (pathContractBin, memo, maxFee, network, credFile) => {

  let  bytecodeFileId = null 
  let  bytecodeFileIdAsString = null
  const operator = setOperator(network, credFile) 
  try {
    const credentials = cred.readFileJson(credFile)
    //adminAccountId  = adminCredentials.accountId 
    const privateKey  = PrivateKey.fromString(credentials.privateKey)

    //Create a file on Hedera and store the hex-encoded bytecode
    const fileCreateTx = await new FileCreateTransaction()
      .setKeys([privateKey]) 
      .setFileMemo(memo)
	    .setMaxTransactionFee(maxFee)  

    //Submit the file to the Hedera test network signing with the transaction fee payer key specified with the operator 
    const submitTx = await fileCreateTx.execute(operator)

    //Get the receipt of the file create transaction
    const fileReceipt = await submitTx.getReceipt(operator)
    //console.log(fileReceipt)

    //Get the file ID from the receipt
    bytecodeFileId = fileReceipt.fileId

    //console.log(bytecodeFileId)
    bytecodeFileIdAsString = `${bytecodeFileId.shard}.${bytecodeFileId.realm}.${bytecodeFileId.num}`
    //cl("File that stores the bytecode of the contract: ", bytecodeFileIdAsString)
    const transactionStatus = fileReceipt.status.toString()
    if (transactionStatus !== "SUCCESS") {
      console.error(`Error! Hedera service FileCreateTransaction failed with error status ${transactionStatus}!`)
      process.exit(1)
    }
  }
  catch(error) {
    console.error(`Error! Hedera service FileCreateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }

  try {
    //Log the file ID
    //console.log("The smart contract byte code file ID is " + bytecodeFileId)

    const buffer = fs.readFileSync(pathContractBin)
    const bytecode = buffer.toString('utf8')

    // Append contents to the file
    const fileAppendTx = await new FileAppendTransaction()
	    .setFileId(bytecodeFileId)
	    .setContents(bytecode)
	    .setMaxChunks(10)   // FIXME 
	    .setMaxTransactionFee(maxFee)  

    const fileAppendSubmit = await fileAppendTx.execute(operator)
    const fileAppendReceipt = await fileAppendSubmit.getReceipt(operator)
    const transactionStatus = fileAppendReceipt.status.toString()

    const result = {
      bytecodeFileIdAsString,
      transactionStatus
    }

    return result
  }
  catch(error) {
    console.error(`Error! Hedera service FileAppendTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Deploys a compiled Solidity smart contract to the Hedera network.
 *
 * Instantiates a smart contract on the Hedera network using the specified bytecode file ID and
 * constructor parameters. The contract instance is created using a ContractCreateTransaction,
 * and the transaction status and contract ID are returned.
 *
 * @param {string} bytecodeFileId - The file ID of the Hedera file storing the bytecode.
 * @param {Array} solParam - An array of constructor parameters for the smart contract.
 * @param {number} maxGas - The maximum gas to use for the transaction.
 * @param {Object} contractCfg - An object containing configuration parameters for the smart contract.
 * @param {string} network - The network to use for the transaction, either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key.
 * @returns {Object} An object containing the contract ID and transaction status.
 * @throws {Error} If an error occurs during the transaction.
 */
const deployContract = async (bytecodeFileId, solParam, maxGas, maxFee, contractCfg, network, adminFile, credFile) => {
  try {
    debugger
    //cl("max-fee = ", maxFee)

    const operator = setOperator(network, credFile) 
    // Instantiate the contract instance
    const contractTx = await new ContractCreateTransaction()
      //Set the file ID of the Hedera file storing the bytecode
      .setBytecodeFileId(bytecodeFileId)
      //Set the gas to instantiate the contract
      .setGas(maxGas) 
	    .setMaxTransactionFee(maxFee)  

    if (contractCfg.stakedNodeId    != undefined  && contractCfg.stakedAccountId != undefined) {
      console.error("Error! Both stakeNodeId and stakeAccountId are defined, only one should be!")
      process.exit(1)
    }

    if (solParam !== null) {
      contractTx.setConstructorParameters(solParam);
    }
    if (contractCfg.initialBalance  != undefined) {
      contractTx.setInitialBalance(new Hbar(contractCfg.initialBalance)) 
    }

    let adminPublicKey = null 
    let adminPrivateKey = null 
    if (adminFile !== "") {
      const adminCredentials = cred.readFileJson(adminFile)
      adminPublicKey  = adminCredentials.publicKey
      adminPrivateKey = adminCredentials.privateKey
    }
    if (adminPublicKey              != null) contractTx.setAdminKey(PublicKey.fromString(adminPublicKey))

    if (contractCfg.memo            != undefined) contractTx.setContractMemo(contractCfg.memo)
    if (contractCfg.stakedNodeId    != undefined) contractTx.setStakedNodeId(contractCfg.stakedNodeId)
    if (contractCfg.stakedAccountId != undefined) contractTx.setStakedAccountId(contractCfg.stakedAccountId)
    if (contractCfg.declineStaking  != undefined) contractTx.setDeclineStakingReward(contractCfg.declineStaking === "true" ? true : false)
    if (contractCfg.maxAutomaticTokenAssociations != undefined) contractTx.setMaxAutomaticTokenAssociations(contractCfg.maxAutomaticTokenAssociations)

    contractTx.freezeWith(operator)

    let contractResponse = null
    // Sign with the private admin key if the contract has admin key
    if (adminPrivateKey        != null) {
      const signedTransaction = await contractTx.sign(PrivateKey.fromString(adminPrivateKey));
      contractResponse = await signedTransaction.execute(operator)
    }
    else {
      //Submit the transaction to the Hedera test network
      contractResponse = await contractTx.execute(operator)
    }

    //Get the receipt of the file create transaction
    const contractReceipt = await contractResponse.getReceipt(operator)
    //Get the smart contract ID
    const contractId = contractReceipt.contractId
    const transactionStatus = contractReceipt.status.toString()
    const contractIdAsString = `${contractId.shard}.${contractId.realm}.${contractId.num}`

    const result = {
      contractIdAsString,
      transactionStatus
    }
    return result
  }
  catch(error) {
    console.error(`Error! Hedera service ContractCreateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Deletes a smart contract from the Hedera network.
 *
 * Deletes a smart contract from the Hedera network using a ContractDeleteTransaction. If
 * contract ID transfer or account ID transfer is specified, the contract is transferred to
 * the new account or contract before deletion. The transaction status is returned.
 *
 * @param {string} contractId - The ID of the smart contract to delete.
 * @param {string} contractIdToTransfer - The ID of the contract to transfer ownership to before deletion, or "null" if not transferring.
 * @param {string} accountIdToTransfer - The ID of the account to transfer ownership to before deletion, or "null" if not transferring.
 * @param {Object} contractCfg - An object containing configuration parameters for the smart contract.
 * @param {string} network - The network to use for the transaction, either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key.
 * @returns {Object} An object containing the transaction status.
 * @throws {Error} If an error occurs during the transaction.
 */
const deleteContract = async (contractId, contractIdToTransfer, accountIdToTransfer, contractCfg, network, adminFile, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    // Instantiate the contract instance
    const contractTx = await new ContractDeleteTransaction()
      .setContractId(contractId)

    if (contractIdToTransfer !== "null") {
      contractTx.setTransferContractId(contractIdToTransfer)
    }
    else if (accountIdToTransfer !== "null") {
      contractTx.setTransferAccountId(accountIdToTransfer)
    }
    const adminCredentials = cred.readFileJson(adminFile)
    const adminPrivateKey = adminCredentials.privateKey
    if (adminPrivateKey === undefined) {
      console.error("Error! The contract needs the adminKey to be deleted!")
      process.exit(1)
    }
    contractTx.freezeWith(operator)
    //Sign with the admin key on the contract
    const signTx = await contractTx.sign(PrivateKey.fromString(adminPrivateKey)) 
    //Submit the transaction to the Hedera test network
    const contractResponse = await signTx.execute(operator)

    //Get the receipt of the file create transaction
    const contractReceipt = await contractResponse.getReceipt(operator);
    //Get the smart contract ID
    const transactionStatus = contractReceipt.status.toString()

    const result = {
      transactionStatus
    }
    return result;
  }
  catch(error) {
    console.error(`Error! Hedera service ContractDeleteTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Calls a function of a smart contract on the Hedera network.
 *
 * Calls a function of a smart contract on the Hedera network using a ContractCallQuery. The
 * function name and parameters are specified in the function call. The transaction status and
 * query response are returned.
 *
 * @param {string} contractId - The ID of the smart contract to call the function on.
 * @param {string} functionName - The name of the function to call.
 * @param {Array} solParam - An array containing the parameters to pass to the function.
 * @param {number} maxGas - The maximum amount of gas to use for the query.
 * @param {string} network - The network to use for the query, either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key.
 * @returns {Object} An object containing the query response and transaction status.
 * @throws {Error} If an error occurs during the query.
 */
const queryContract = async (contractId, functionName, solParam, maxGas, network, credFile) => {
  try {
    //debugger
    const operator = setOperator(network, credFile) 
    // Calls a function of the smart contract
    const contractQuery = await new ContractCallQuery()
        //Set the gas for the query
        .setGas(maxGas) 
        //Set the contract ID to return the request for
        .setContractId(contractId)
        //Set the contract function to call
        .setFunction(functionName, solParam)
        //Set the query payment for the node returning the request
        //This value must cover the cost of the request otherwise will fail
        .setQueryPayment(new Hbar(10)) // FIXME
    //Submit to a Hedera network
    const queryResponse = await contractQuery.execute(operator);
    const transactionStatus = "SUCCESS" 
    const result = {
      queryResponse,
      transactionStatus
    }
    return result;
  }
  catch(error) {
    console.error(`Error! Hedera service ContractCallQuery failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Updates the state of a smart contract on the Hedera network.
 *
 * Calls a function of a smart contract instance specified by its contract ID, with the specified function name and parameters.
 * The transaction includes an optional payment of Hbar and a specified maximum gas limit.
 *
 * @param {string} contractId - The ID of the smart contract to update.
 * @param {string} functionName - The name of the function to call.
 * @param {Array} solParam - The array of parameters to pass to the function.
 * @param {number} pay - The amount of Hbar to pay to the contract function, in tinybar (1 Hbar = 1000000 tinybar). Optional; defaults to null.
 * @param {number} maxGas - The maximum amount of gas to allow for the transaction.
 * @param {string} network - The network to use for the transaction.
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {Object} An object containing the transaction response, transaction record, and transaction status.
 * @throws {Error} If an error occurs while updating the contract.
 */
// FIXME not good name
const updateContract = async (contractId, functionName, solParam, pay, maxGas, network, credFile) => {
  try {  
    const operator = setOperator(network, credFile) 
    //Create the transaction to update the contract message
    const contractExecTx = await new ContractExecuteTransaction()
        //Set the ID of the contract
        .setContractId(contractId)
        //Set the gas for the contract call
        .setGas(maxGas) 
        //Set the contract function to call
        .setFunction(functionName, solParam)
        .setMaxTransactionFee(new Hbar(20)) // FIXME
       
    if (pay !== null) {
        contractExecTx.setPayableAmount(new Hbar(pay))
    }
    //Submit the transaction to a Hedera network and store the response
    const updateResponse = await contractExecTx.execute(operator);

    const record = await updateResponse.getRecord(operator)

    //Get the receipt of the transaction
    const contractReceipt = await updateResponse.getReceipt(operator)
    //Confirm the transaction was executed successfully
    const transactionStatus = contractReceipt.status.toString()
    //const transactionStatus = "SUCCESS"

    const result = {
      updateResponse,
      record,
      transactionStatus
    }
    return result;
  }
  catch(error) {
    console.error(`Error! Hedera service ContractExecuteTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}


/**
 * Gets the ABI parameters of a function in a contract.
 *
 * Reads the ABI from a JSON file and returns the parameters of the function with the given name.
 *
 * @param {string} funcName - The name of the function to get the parameters for.
 * @param {string} pathContractAbi - The path to the JSON file containing the contract ABI.
 * @returns {Object} An object containing the state mutability, inputs, and outputs of the function.
 */
const getFunctionAbiParams = (funcName, pathContractAbi) => {
  const abi = cred.readFileJson(pathContractAbi)
  let stateMutability = null
  let inputs          = null
  let outputs         = null

  const isFunctionPresent = !!abi.find(func => {
    const funcExists = ((func.name === funcName) && (func.type === "function"))
    if (funcExists) {
      inputs = func.inputs
      outputs = func.outputs
      stateMutability = func.stateMutability
      return true
    }
  })

  const result = {
    isFunctionPresent,
    stateMutability,
    inputs,
    outputs
  }
  return result
}

/**
 * Retrieves the ABI parameters for the constructor function of a Solidity smart contract.
 *
 * Reads the ABI file of the contract and searches for the constructor function. If found, returns
 * the state mutability, inputs, and outputs of the constructor function.
 *
 * @param {string} pathContractAbi - The path to the JSON file containing the ABI of the Solidity smart contract.
 * @returns {Object} An object containing the state mutability, inputs, and outputs of the constructor function.
 */
const getConstructorAbiParams = (pathContractAbi) => {
  const abi = cred.readFileJson(pathContractAbi)
  let stateMutability = null
  let inputs          = null
  //let outputs         = null

  const isConstructorPresent = !!abi.find(func => {
    const constructorExists = (func.type === "constructor")
    if (constructorExists) {
      inputs = func.inputs
      //outputs = func.outputs
      stateMutability = func.stateMutability
      return true
    }
  })

  const result = {
    isConstructorPresent,
    stateMutability,
    inputs,
//    outputs
  }
  return result
}

/**

    Prepares the output of a smart contract function call for printing.
    Takes the transaction response and the ABI information for the function and returns an array
    of strings containing the output values of the function call. If the function has no output
    parameters, an empty array is returned.
    @param {TransactionResponse} txnResponse - The response from the Hedera network after executing a smart contract function call.
    @param {Object} abiInfo - An object containing the ABI information for the smart contract function.
    @returns {string[]} An array of strings representing the output values of the smart contract function call.
*/
const prepareOutputForPrinting = (txnResponse, abiInfo) => {
  const outputAsStringArray = []
  if (abiInfo.outputs.length > 0) {
    const contractResults = msol.getContractResult(txnResponse, abiInfo.outputs)
    contractResults.forEach(element => {
      if (element._isBigNumber) { // FIXME not a nice solution
        outputAsStringArray.push(element.toString())
      }
      else {
        outputAsStringArray.push(element)
      }
    })
  }
  return outputAsStringArray
}


/**
    Prepares the events from a Hedera transaction record for printing.
    Iterates through the logs in the contractFunctionResult property of the transaction record and converts
    their data to a string, then extracts the topics. Returns an array of events as strings.
    @param {TransactionRecord} txnRecord - The transaction record to extract events from.
    @returns {string[]} An array of events as strings.
*/
// IMPLEMENTME FIXME
const prepareEventsForPrinting = (txnRecord) => {
  let eventsAsStringArray = []
  txnRecord.contractFunctionResult.logs.forEach((log) => {
    // convert the log.data (uint8Array) to a string
    let logStringHex = "0x".concat(Buffer.from(log.data).toString("hex"))
    // get topics from log
    let logTopics = []
    log.topics.forEach((topic) => {
      logTopics.push("0x".concat(Buffer.from(topic).toString("hex")))
    })
    cl("logStringHex=", logStringHex)
    cl("logTopics=", logTopics)
/*
    // decode the event data
		const event = decodeEvent("Log", logStringHex, logTopics.slice(1));
		// output the from address stored in the event
		console.log(`Record event: '${event.message}'`)
*/
    eventsAsStringArray.push(logTopics)
  }) 
  return eventsAsStringArray
}

/**
    Executes a pure/view function of a Solidity smart contract.
    Calls a pure/view function of the specified contract on the Hedera network, and returns the result
    of the function call. If successful, returns an object containing the output of the function call,
    any events emitted by the function call, the amount of gas used, and the status of the transaction.
    @param {string} contractId - The ID of the Solidity smart contract to call the function on.
    @param {string} functionName - The name of the pure/view function to call.
    @param {Array} solParam - An array of parameters to pass to the function call.
    @param {Object} abiInfo - An object containing the state mutability, inputs, and outputs of the function.
    @param {number} maxGas - The maximum amount of gas to allow for the function call.
    @param {string} network - The network to execute the function call on. Must be either "main" or "test".
    @param {string} credFile - The path to the JSON file containing the account ID and private key.
    @returns {Object} An object containing the output of the function call, any events emitted by the function call,
                  the amount of gas used, and the status of the transaction.

*/
const executeViewPureFunction = async (contractId, functionName, solParam, abiInfo, maxGas, network, credFile) => {
  cl("Execute Pure/View function.")
  const resultQuery = await queryContract(contractId, functionName, solParam, maxGas, network, credFile)
  let outputAsStringArray = null
  if (resultQuery.transactionStatus === "SUCCESS") {
    outputAsStringArray = prepareOutputForPrinting(resultQuery.queryResponse, abiInfo) 
  } 

  // TODO
  const eventsAsStringArray = null
  const result = {
    outputAsStringArray,
    eventsAsStringArray,
    gasUsed: resultQuery.queryResponse.gasUsed.toNumber(),
    transactionStatus: resultQuery.transactionStatus
  }
  return result;
}

/**
 * Executes a payable function of a Solidity smart contract on the Hedera network.
 *
 * Updates the state of a Solidity smart contract on the Hedera network by executing a payable
 * function with the specified parameters. If successful, returns the output and events generated
 * by the transaction.
 *
 * @param {string} contractId - The ID of the Solidity smart contract to execute the function on.
 * @param {string} functionName - The name of the function to execute.
 * @param {Array} solParam - An array of parameters to pass to the function, in the order specified in the Solidity code.
 * @param {Object} abiInfo - An object containing the state mutability, inputs, and outputs of the function to execute.
 * @param {number} pay - The amount of Hbar to attach to the transaction as payment.
 * @param {number} maxGas - The maximum amount of gas to use for the transaction.
 * @param {string} network - The network to execute the transaction on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key for the operator account.
 * @returns {Object} An object containing the output and events generated by the transaction, as well as the gas used and transaction status.
 * @throws {Error} If an error occurs while executing the function.
 */
const executePayableFunction = async (contractId, functionName, solParam, abiInfo, pay, maxGas, network, credFile) => {
  cl("Execute Payable function.")
  
  //FIXME better name for resultUpdate
  const resultUpdate = await updateContract(contractId, functionName, solParam, pay, maxGas, network, credFile)

  let eventsAsStringArray = null 
  let outputAsStringArray = null
  if (resultUpdate.transactionStatus === "SUCCESS") {
    outputAsStringArray = prepareOutputForPrinting(resultUpdate.updateResponse, abiInfo) 
    eventsAsStringArray = prepareEventsForPrinting(resultUpdate.record)
  }
  const result = {
    outputAsStringArray,
    eventsAsStringArray,
    gasUsed: resultUpdate.record.contractFunctionResult.gasUsed.toNumber(),
    transactionStatus: resultUpdate.transactionStatus
  }
  return result;
}


/**
 * Executes a non-payable function of a Solidity smart contract on the Hedera network.
 *
 * Calls the specified function of the contract with the provided parameters, using a `ContractExecuteTransaction`
 * instance to submit the transaction to the network. Returns an object containing the output values and events
 * emitted by the function, as well as the gas used and the transaction status.
 *
 * @param {string} contractId - The ID of the Solidity smart contract to execute the function on.
 * @param {string} functionName - The name of the function to execute.
 * @param {Array} solParam - An array of the parameters to pass to the function.
 * @param {Object} abiInfo - An object containing the state mutability, inputs, and outputs of the function.
 * @param {number} maxGas - The maximum amount of gas to allow the function to consume.
 * @param {string} network - The network to execute the function on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key.
 * @returns {Object} An object containing the output values and events emitted by the function, as well as the gas used and the transaction status.
 */
const executeNonPayableFunction = async (contractId, functionName, solParam, abiInfo, pay, maxGas, network, credFile) => {
  cl("Execute NonPayable function.")
  pay = null // FIXME probably this is the only difference between PAYABLE and NONPAYABLE
  
  //FIXME better name for resultUpdate
  const resultUpdate = await updateContract(contractId, functionName, solParam, pay, maxGas, network, credFile)
  let eventsAsStringArray = null 
  let outputAsStringArray = null
  if (resultUpdate.transactionStatus === "SUCCESS") {
    outputAsStringArray = prepareOutputForPrinting(resultUpdate.updateResponse, abiInfo) 
    eventsAsStringArray = prepareEventsForPrinting(resultUpdate.record)
  }
  const result = {
    outputAsStringArray,
    eventsAsStringArray,
    gasUsed: resultUpdate.record.contractFunctionResult.gasUsed.toNumber(),
    transactionStatus: resultUpdate.transactionStatus
  }
  return result;
}

/**
    Executes a function on a Solidity smart contract deployed on the Hedera network.
    Determines the state mutability of the function and whether it is payable, and then executes
    the function accordingly. Returns the output of the function and any events emitted by the
    function, along with the gas used and the transaction status.
    @param {string} contractId - The ID of the Solidity smart contract on the Hedera network.
    @param {string} functionName - The name of the function to execute.
    @param {Array} userInputs - The user inputs to pass to the function.
    @param {number} pay - The amount of hbars to attach to the function call, if the function is payable.
    @param {Object} abi - The ABI of the Solidity smart contract.
    @param {number} maxGas - The maximum amount of gas to use for the function call.
    @param {string} network - The network to execute the function on. Must be either "main" or "test".
    @param {string} credFile - The path to the JSON file containing the account ID and private key.
    @returns {Object} An object containing the output and events of the function, along with the gas used and transaction status.
    @throws {Error} If the function does not exist on the contract.
*/
const executeContractFunction = async (contractId, functionName, userInputs, pay, abi, maxGas, network, credFile) => {
  let result = null
  const abiInfo = getFunctionAbiParams(functionName, abi)

  // debugger
  if (abiInfo.isFunctionPresent) {
    cl(`Function ${functionName} exists, has stateMutability ${abiInfo.stateMutability} and has inputs.`)
    cl("*** abi inputs = ", abiInfo.inputs)
  }
  else {
    console.error(`Error! Function ${functionName} does not exist!`)
    process.exit(1)
  }
  const solParam = msol.buildContractParams(userInputs, abiInfo.inputs)
  if (abiInfo.stateMutability === 'view' || abiInfo.stateMutability === 'pure') {
    result = await executeViewPureFunction(contractId, functionName, solParam, abiInfo, maxGas, network, credFile)
  }
  else if (abiInfo.stateMutability === 'payable') {
    result = await executePayableFunction(contractId, functionName, solParam, abiInfo, pay, maxGas, network, credFile) 
  }
  else {
    result = await executeNonPayableFunction(contractId, functionName, solParam, abiInfo, pay, maxGas, network, credFile)
  }
  
  return result
}

/**

    Retrieves the bytecode of a Solidity smart contract deployed on the Hedera network.
    Executes a ContractByteCodeQuery to retrieve the bytecode of a Solidity smart contract
    with the specified contractId on the specified network. Returns an object containing the
    bytecode response and transaction status.
    @param {string} contractId - The ID of the contract to retrieve bytecode for.
    @param {string} network - The network the contract is deployed on. Must be either "main" or "test".
    @param {string} credFile - The path to the JSON file containing the account ID and private key of the operator.
    @returns {Object} An object containing the bytecode response and transaction status.
    @throws {Error} If an error occurs while retrieving the bytecode.
*/
const getByteCode = async (contractId, network, credFile) => {
  try {  
    const operator = setOperator(network, credFile) 

    const byteCodeResponse  = await new ContractByteCodeQuery()
      .setContractId(contractId)
      .execute(operator)

    const transactionStatus = "SUCCESS"
    const result = {
      byteCodeResponse,
      transactionStatus
    }
    return result;
  }
  catch(error) {
    console.error(`Error! Hedera service ContractByteCodeQuery failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
    Retrieves information about a Solidity smart contract deployed on a Hedera network.
    Executes a ContractInfoQuery on the specified network using the provided operator account credentials.
    Returns an object containing the query response and transaction status.
    @param {string} contractId - The ID of the contract to retrieve information for.
    @param {string} network - The network to execute the query on. Must be either "main" or "test".
    @param {string} credFile - The path to the JSON file containing the operator account credentials.
    @returns {Object} An object containing the query response and transaction status.
    @throws {Error} If an error occurs while executing the query.
*/
const getInfo = async (contractId, network, credFile) => {
  try {  
    const operator = setOperator(network, credFile) 

    const infoQueryResponse  = await new ContractInfoQuery()
      .setContractId(contractId)
      .execute(operator)

    const transactionStatus = "SUCCESS"
    const result = {
      infoQueryResponse,
      transactionStatus
    }
    return result;
  }
  catch(error) {
    console.error(`Error! Hedera service ContractInfoQuery failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}


/**
    Updates the admin key, memo, staking settings, and automatic token association settings for a
    Solidity smart contract.
    Builds and sends a transaction to update the admin key, memo, staking settings, and automatic token
    association settings for the specified Solidity smart contract. If successful, returns the contract
    response and transaction status.
    @param {string} contractId - The ID of the Solidity smart contract to update.
    @param {Object} contractCfg - The configuration object containing the updated admin key, memo, staking settings, and automatic token association settings for the Solidity smart contract.
    @param {string} network - The network to send the transaction to. Must be either "main" or "test".
    @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
    @returns {Object} An object containing the contract response and transaction status.
    @throws {Error} If an error occurs while updating the contract.
*/

//FIXME it does not work
const updateInfo = async (contractId, contractCfg, maxFee, network, adminFile, credFile) => {
  try {
    debugger

    const operator = setOperator(network, credFile) 
    // Instantiate the contract instance
    const contractTx = await new ContractUpdateTransaction()
      .setContractId(contractId)
//	    .setMaxTransactionFee(maxFee)  


    if (contractCfg.stakedNodeId    != undefined  && contractCfg.stakedAccountId != undefined) {
      console.error("Error! Both stakeNodeId and stakeAccountId are defined, only one should be!")
      process.exit(1)
    }
    let adminPublicKey = null 
    let adminPrivateKey = null 
    if (adminFile !== "") {
      const adminCredentials = cred.readFileJson(adminFile)
      adminPublicKey = adminCredentials.publicKey
      adminPrivateKey = adminCredentials.privateKey
    }
/*
    if (contractCfg.adminKey        != undefined) contractTx.setAdminKey(adminPublicKey)
    if (contractCfg.memo            != undefined) contractTx.setContractMemo(contractCfg.memo)
    if (contractCfg.stakedNodeId    != undefined) contractTx.setStakedNodeId(contractCfg.stakedNodeId)
    if (contractCfg.stakedAccountId != undefined) contractTx.setStakedAccountId(contractCfg.stakedAccountId)
    if (contractCfg.declineStaking  != undefined) contractTx.setDeclineStakingReward(contractCfg.declineStaking === "true" ? true : false)
    if (contractCfg.maxAutomaticTokenAssociations != undefined) contractTx.setMaxAutomaticTokenAssociations(contractCfg.maxAutomaticTokenAssociations)

    contractTx.freezeWith(operator)
*/
    let contractResponse = null
    // Sign with the private admin key if the contract has admin key
    if (adminPrivateKey        != null) {
      const signedTransaction = await contractTx.sign(adminPrivateKey);
      contractResponse = await signedTransaction.execute(operator)
    }
    else {
      //Submit the transaction to the Hedera test network
      contractResponse = await contractTx.execute(operator)
    }

    //Get the receipt of the file create transaction
    const contractReceipt = await contractResponse.getReceipt(operator);
    //Get the smart contract ID
    //const contractId = contractReceipt.contractId;
    const transactionStatus = contractReceipt.status.toString()
    //const contractIdAsString = `${contractId.shard}.${contractId.realm}.${contractId.num}`

    const result = {
      contractResponse,
      transactionStatus
    }
    return result;
  }
  catch(error) {
    console.error(`Error! Hedera service ContractUpdateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

exports.compileContract         = compileContract
exports.storeContract           = storeContract 
exports.deployContract          = deployContract
exports.deleteContract          = deleteContract
exports.getFunctionAbiParams    = getFunctionAbiParams 
exports.getConstructorAbiParams = getConstructorAbiParams
exports.queryContract           = queryContract
exports.updateContract          = updateContract
exports.executeContractFunction = executeContractFunction 
exports.getByteCode             = getByteCode 
exports.getInfo                 = getInfo
exports.updateInfo              = updateInfo



