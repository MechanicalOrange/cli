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
const file    = require('../lib/file')
const util    = require('../lib/utils')


program
  .name("account")
  .description("Hedera account services.")
  .version(pckg.version)


program
  .command('create')
  .addOption(new program.Option('-a, --amount <hbar>', "Initial amount of hbar in account.")
    .argParser(util.hbarParseFloat).default(1)) 
  .addOption(new program.Option('-m, --memo <memo>', "Memo of the account.")
    .argParser(util.memoParseString).default("")) 
  .addOption(new program.Option('-s, --assoc <number-associations>', "Number of token associated with this account.")
    .argParser(util.assocParseInt).default(0))  
  .addOption(new program.Option('-f, --max-fee <hbar>', "Maximum transaction fee to be paid for creating an account.")
    .argParser(util.hbarParseFloat).makeOptionMandatory())  
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Create an account. Account can have an initial amount of hbar, a memo, and a number of token associations. Account is created on testnet or mainnet.')
  .action(async (args) => {

    console.log(`Creating an account`) 
    const result = await mapi.createAccount(args.amount, args.memo, args.assoc, args.maxFee, args.network, args.cred)

    let exitStatus = null
    if (result.transactionStatus === "SUCCESS") {
      file.writeFileAccount(result.newAccount)
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No account was created!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })


program
  .command('create-with-mnemonic')
  .addOption(new program.Option('-a, --amount <hbar>', "Initial amount of hbar in account.")
    .argParser(util.hbarParseFloat).default(1)) 
  .addOption(new program.Option('-m, --memo <memo>', "Memo of the account.")
    .argParser(util.memoParseString).default("")) 
  .addOption(new program.Option('-s, --assoc <number-associations>', "Number of token associated with this account.")
    .argParser(util.assocParseInt).default(0))  
  .addOption(new program.Option('-f, --max-fee <hbar>', "Maximum transaction fee to be paid for creating an account.")
    .argParser(util.hbarParseFloat).makeOptionMandatory())  
  .addOption(new program.Option('-p, --mnemonic-index <integer>', "If set, the mnemonic-index must be saved with the mnemonic phrase, without it the private key will not be properly reconstructed.")
    .argParser(util.hbarParseFloat).default(null))  
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Create an account with mnemonics. Account can have an initial amount of hbar, a memo, and a number of token associations. Account is created on testnet or mainnet. ')
  .action(async (args) => {

    console.log(`Creating an account`) 
    const result = await mapi.createAccountWithMnemonics(args.amount, args.memo, args.assoc, args.maxFee, args.mnemonicIndex, args.network, args.cred)

    let exitStatus = null
    if (result.transactionStatus === "SUCCESS") {
      file.writeFileAccount(result.newAccount)
      file.writeFileMnemonic(result.newAccount, result.mnemonic)
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No account was created!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })


program
  .command('delete')
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', 'The account Id that is deleted.')
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-d, --account-id-to-transfer <shard.realm.account>', 'The account Id.')
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Delete an account. The account funds are transferred to account-id-to-transfer. Account is created on testnet or mainnet.')
  .action(async (args) => {

    console.log(`Deleting an account`) 

    const cred = require('../../common/credentials')
    const credentials = cred.readFileJson(args.cred)
    if (credentials.accountId.localeCompare(args.accountId) !== 0) {
      console.error(`ERROR! The credentials used must have the same accountId ${credentials.accountId} as the one passed with the account-id option ${args.accountId}!`)
      process.exit(1)
    }

    const transactionStatus = await mapi.deleteAccount(args.accountId, args.accountIdToTransfer, args.network, args.cred)

    let exitStatus = null
    if (transactionStatus === "SUCCESS") {
      console.log(`Account ${args.accountId} was deleted!`) 
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No account was deleted!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })


//TODO: Any restrictions for Stacked Node? Use the same like for max-association tokens
program
  .command('update')
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', 'The account Id.')
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-m, --memo [memo]', 'Memo of the account.')
    .argParser(util.memoParseString).default(null)) 
  .addOption(new program.Option('-s, --assoc <number-associations>', 'Number of token associated with this account.')
    .argParser(util.assocParseInt).default(null))  
  .addOption(new program.Option('-j, --staked-node-id <node-id>', 'Hashgraph node this account is staked to.')
    .argParser(util.assocParseInt).default(null))  
  .addOption(new program.Option('-k, --staked-account-id <shard.realm.account>', 'The account Id this account is staked to.')
    .argParser(util.accntParseString).default(null)) 
  .addOption(new program.Option('-d, --decline-staking [yes/no], default "no"', 'If set to "yes", the account will not receive staking rewards.')
    .choices(['yes', 'no']).default(null)) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Update an account. Account can have a new memo, new number of token associations, staked-account or staked node, can decline staking. Account can be updated on testnet or mainnet.')
  .action(async (args) => {

    console.log(`Updating an account`) 
    let exitStatus = null
    if ((args.stakedNodeId !== null) && (args.stakedAccountId !== null)) {
      exitStatus = 1 
      console.error('ERROR! Only Staked Node or only Staked Account can be set, not both!') 
      process.exit(exitStatus)
    }

    const cred = require('../../common/credentials')
    const credentials = cred.readFileJson(args.cred)
    if (credentials.accountId.localeCompare(args.accountId) !== 0) {
      console.error(`ERROR! The credentials used must have the same accountId ${credentials.accountId} as the one passed with the account-id option ${args.accountId}!`)
      process.exit(1)
    }

    const transactionStatus = await mapi.updateAccount(args.accountId, args.memo, args.assoc, args.stakedNodeId, args.stakedAccountId, args.declineStaking, args.network, args.cred)

    if (transactionStatus === "SUCCESS") {
      console.log(`Account ${args.accountId} was updated successfully!`)
      exitStatus = 0 
    }
    else {
      console.error("ERROR! Account was not updated!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })


program
  .command('transfer-hbar')
  .addOption(new program.Option('-a, --amount <hbar>', "Amount of hbar to be transferred.")
    .argParser(util.hbarParseFloat).makeOptionMandatory()) 
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Transfer hbar to another account.')
  .action(async (args) => {

    console.log(`Transferring ${args.amount} of hbar to ${args.accountId}`) 
    const status = await mapi.transferCrypto (args.accountId, args.amount, args.network, args.cred)

    let exitStatus = null
    if (status === "SUCCESS") {
      console.log(`Transfer was done successfully!`) 
      exitStatus = 0
    }
    else {
      console.error(`Error! Transfer failed!`) 
      exitStatus = 1
    }
    process.exit(exitStatus)
  })


program
  .command('get-balance')
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Get the account balance.')
  .action(async (args) => {

    console.log(`Getting the account balance of ${args.accountId}`) 
    const hbar = await mapi.getAccountBalance(args.accountId, args.network, args.cred)
    console.log(`The account ${args.accountId} has ${hbar.toNumber()} hbars.`)

    process.exit(0)
  })

program
  .command('get-info')
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Get the account info.')
  .action(async (args) => {

    console.log(`Getting the account info of ${args.accountId}`) 
    const accInfo = await mapi.getAccountInfo(args.accountId, args.network, args.cred)
    util.printAccountInfo(accInfo)
    process.exit(0)
  })


program
  .command('get-stacking-info')
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Get the account stacking info.')
  .action(async (args) => {

    console.log(`Getting the account stacking info of ${args.accountId}`) 
    const accInfo = await mapi.getAccountInfo(args.accountId, args.network, args.cred)
    util.printAccountStakingInfo(accInfo)
    process.exit(0)
  })


program
  .command('reconstruct-key-from-myhbarwallet')
  .addOption(new program.Option('-m, --mnemonic <mnemonic-file>', "Path to the file that contains the mnemonic words separated by space.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Generates the private and public key for the mnemonics compatible with MyHbarWallet. The account id is not known, therefore the credential file generated has the account id set to 0.0.o.')
  .action(async (args) => {
    const mnemonicInfo = file.readFileMnemonic(args.mnemonic)
    const mnemonicSpaceSeparatedString = mnemonicInfo.words
    const keysInfo = await mapi.reconstructKeysFromMnemonicMyHbarWallet(mnemonicSpaceSeparatedString)

    const accInfoWithFakeId = {
      accountId        : "0.0.0",
      publicKey        : keysInfo.publicKeyMhwString, 
      privateKey       : keysInfo.privateKeyMhwString,
    }

    file.writeFileAccount(accInfoWithFakeId)
    process.exit(0)
  })


program
  .command('reconstruct-key-from-mnemonic')
  .addOption(new program.Option('-m, --mnemonic <mnemonic-file>', "Path to the file that contains the mnemonic words separated by space.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Generates the private and public key for the mnemonics with the index that is present in the mnemonics file. The account id is not known, therefore the credential file generated has the account id set to 0.0.o.')
  .action(async (args) => {
    const mnemonicInfo = file.readFileMnemonic(args.mnemonic)
    const mnemonicSpaceSeparatedString = mnemonicInfo.words
    const mnemonicIndex                = mnemonicInfo.index
    const keysInfo = await mapi.reconstructKeysFromMnemonic(mnemonicSpaceSeparatedString, mnemonicIndex)

    const accInfoWithFakeId = {
      accountId        : "0.0.0",
      publicKey        : keysInfo.publicKeyMO.toString(), 
      privateKey       : keysInfo.privateKeyMO.toString(),
    }

    file.writeFileAccount(accInfoWithFakeId)
    process.exit(0)
  })


program
  .command('test-mnemonics')
  .description('Test.')
  .action(async (args) => {
    let resKMHBW = await mapi.generateMnemonicAndKeysAssociatedMyHbarWallet()
    let resKMHBWReconstructed = await mapi.reconstructKeysFromMnemonicMyHbarWallet(resKMHBW.mnemonicSpaceSeparatedString)

    //console.log(resKMHBW)
    if (JSON.stringify(resKMHBW) != JSON.stringify(resKMHBWReconstructed)) {
      console.log(resKMHBW)
      console.log(resKMHBWReconstructed)
      console.error("Mnemonic MyHbarWallet key generation failed!")
      process.exit(1)
    }
    else {
      console.log("Mnemonic MyHbarWallet key generation passed!")
    }

    let resKM = await mapi.generateMnemonicAndKeysAssociated(null)

    resKM.publicKeyMO  = resKM.publicKeyMO.toString()
    resKM.privateKeyMO = resKM.privateKeyMO.toString()

    //console.log(resKM)
    let resKMReconstructed = await mapi.reconstructKeysFromMnemonic(resKM.mnemonicSpaceSeparatedString, null)
    resKMReconstructed.publicKeyMO  = resKMReconstructed.publicKeyMO.toString()
    resKMReconstructed.privateKeyMO = resKMReconstructed.privateKeyMO.toString()

    if (JSON.stringify(resKM) != JSON.stringify(resKMReconstructed)) {
      console.log(resKM)
      console.log(resKMReconstructed)
      console.error("Mnemonic  key generation failed!")
      process.exit(1)
    }
    else {
      console.log("Mnemonic key generation passed!")
    }

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    process.exit(0)
  })


program
  .command('test-json')
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('test JSON file')
  .action(async (args) => {

    const cred = require('../../common/credentials')
    let cl = console.log
    //cred.writeFileJson(credentials, path)
    let td = cred.readFileJson("/home/roni/DONOTDELETE/test_cli/token_template.json")
    cl(td)

  })

program.parse(process.argv)


