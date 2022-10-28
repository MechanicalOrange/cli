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
const util    = require('../lib/utils')
const file    = require('../lib/file')
const cred = require('../../common/credentials')


program
  .name("token")
  .description("Accessing HCS via CLI.")
  .version(pckg.version)

program
  .command('create')
  .addOption(new program.Option('-g, --config <config-json-file>', "Path to the JSON file that contains the token configuration.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Create a token.')
  .action(async (args) => {

    console.log(`Creating a token `) 
    const tokenConfig = util.checkTokenConfig(args.config)
    const result = await mapi.createToken(tokenConfig, args.network, args.cred)

    let exitStatus = null
    if (result.transactionStatus === "SUCCESS") {
      file.writeFileToken(result.newToken)
      console.log(result.newToken)
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was created!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('get-balance')
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id that is wiped.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Get token balance for account.')
  .action(async (args) => {

    console.log(`Getting token balance.`) 

    //const tokenBalanceString = await mapi.getTokenBalance(args.accountId, args.network, args.cred)
    const tokenBalance = await mapi.getTokenBalance(args.accountId, args.network, args.cred)

    // DONOTDELETE this gives the class name !!!
    //console.dir(tokenBalance)

    for (const key of tokenBalance.keys()) {
      console.log(`TokenID: ${key} has ${tokenBalance.get(key)} tokens`)
    }

    let exitStatus = 0 
    process.exit(exitStatus)
  })

program
  .command('mint')
  .addOption(new program.Option('-a, --amount <token>', "The amount of token to mint.")
    .argParser(util.tokenParseFloat).default(1)) 
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-s, --supply <supply-credentials-file>', "Path to the file that contains the accountID, public and private key of the supplyKey account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Mint a token.')
  .action(async (args) => {

    console.log(`Minting a token `) 
    const result = await mapi.mintToken(args.amount, args.tokenId, args.supply, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was minted!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was minted!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })


program
  .command('burn')
  .addOption(new program.Option('-a, --amount <token>', "The amount of token to burn.")
    .argParser(util.tokenParseFloat).default(1)) 
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-s, --supply <supply-credentials-file>', "Path to the file that contains the accountID, public and private key of the supplyKey account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Burn a token.')
  .action(async (args) => {

    console.log(`Burning a token `) 
    const result = await mapi.burnToken(args.amount, args.tokenId, args.supply, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was burned!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was burned!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('wipe')
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id that is wiped.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-a, --amount <token>', "The amount of token to wipe.")
    .argParser(util.tokenParseFloat).default(1)) 
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-s, --wipe <supply-credentials-file>', "Path to the file that contains the accountID, public and private key of the wipeKey account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Wipe a token.')
  .action(async (args) => {

    console.log(`Wiping a token `) 
    const result = await mapi.wipeToken(args.accountId, args.amount, args.tokenId, args.wipe, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was wiped!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was wiped!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('pause')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-p, --pause <pause-credentials-file>', "Path to the file that contains the accountID, public and private key of the pauseKey account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Pause a token.')
  .action(async (args) => {

    console.log(`Pausing a token `) 
    const result = await mapi.pauseToken(args.tokenId, args.pause, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was paused!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was paused!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('unpause')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-p, --pause <pause-credentials-file>', "Path to the file that contains the accountID, public and private key of the pauseKey account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Unpause a token.')
  .action(async (args) => {

    console.log(`Unpausing a token `) 
    const result = await mapi.unpauseToken(args.tokenId, args.pause, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was unpaused!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was unpaused!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('associate')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Associate a token.')
  .action(async (args) => {

    console.log(`Associating a token `) 
    const result = await mapi.associateToken(args.tokenId, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was associated!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was associated!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('dissociate')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Dissociate a token.')
  .action(async (args) => {

    console.log(`Dissociating a token `) 
    const result = await mapi.dissociateToken(args.tokenId, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was dissociated!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was dissociated!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('freeze')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id that is freezed.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-f, --freeze-cred <unfreeze-credentials-file>', "Path to the file that contains the accountID, public and private key of the freezeKey account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Freeze a token.')
  .action(async (args) => {

    console.log(`Freezing a token `) 
    const result = await mapi.freezeToken(args.tokenId, args.accountId, args.freezeCred, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was freezed!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was freezed!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('unfreeze')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id that is unfreezed.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-f, --freeze-cred <unfreeze-credentials-file>', "Path to the file that contains the accountID, public and private key of the freezeKey account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Unfreeze a token.')
  .action(async (args) => {

    console.log(`Unfreezing a token `) 
    const result = await mapi.unfreezeToken(args.tokenId, args.accountId, args.freezeCred, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was unfreezed!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was unfreezed!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('grant-kyc')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id that is granted KYC.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-k, --kyc-cred <kyc-credentials-file>', "Path to the file that contains the accountID, public and private key of the kycKey account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Grant KYC for token.')
  .action(async (args) => {

    console.log(`Granting KYC for a token `) 
    const result = await mapi.grantKycToken(args.tokenId, args.accountId, args.kycCred, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was granted KYC!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was granted KYC!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('revoke-kyc')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id that is revoked KYC.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-k, --kyc-cred <kyc-credentials-file>', "Path to the file that contains the accountID, public and private key of the kycKey account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <admin-credentials-file>', "Path to the file that contains the accountID, public and private key of the payer account. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Revoke KYC for token.')
  .action(async (args) => {

    console.log(`Revoking KYC for a token `) 
    const result = await mapi.revokeKycToken(args.tokenId, args.accountId, args.kycCred, args.network, args.cred)

    let exitStatus = null
    if (result === "SUCCESS") {
      console.log("Token was revoked KYC!")
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No token was revoked KYC!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })

program
  .command('transfer-token')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-a, --amount <token>', "Amount of tokens to be transferred.")
    .argParser(util.hbarParseFloat).makeOptionMandatory()) 
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The destination account Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Transfer hbar to another account.')
  .action(async (args) => {

    console.log(`Transferring ${args.amount} of token to ${args.accountId}`) 
    const status = await mapi.transferToken (args.tokenId, args.amount, args.accountId, args.network, args.cred)

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
  .command('delete')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the adminKey. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Delete the token with the id token-id.')
  .action(async (args) => {

    console.log(`Deleting the token ${args.tokenId} `) 
    const status = await mapi.deleteToken(args.tokenId, args.network, args.cred)

    let exitStatus = null

    if (status === "SUCCESS") {
      console.log(`The deletion of ${args.tokenId} was done successfully!`) 
      exitStatus = 0
    }
    else {
      console.error(`The deletion of ${args.tokenId} failed!`) 
      exitStatus = 1
    }

    process.exit(exitStatus)
  })


program
  .command('update')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-m, --memo [memo]', 'The new memo of the token. By default the memo is not changed.')
    .argParser(util.memoParseString).default("")) 
  .addOption(new program.Option('-a, --admin-file [admin-file]', 'The new admin key is the private key from the admin-file. By default the admin key is not changed.')
    .argParser(util.messageParseString).default(null)) 
  .addOption(new program.Option('-s, --submit-file [submit-file]', 'The new submit key is the private key from the submit-file. By default the submit key is not changed.')
    .argParser(util.messageParseString).default(null)) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Update a HCS token. The memo, the admin key and the submit key can be modified jon testnet or mainnet.')
  .action(async (args) => {

    console.log(`Updating token ${args.tokenId} `) 
    const result = await mapi.updateToken(args.tokenId, args.memo, args.adminFile, args.submitFile, args.network, args.cred)

    let exitStatus = null
    if (result.transactionStatus === "SUCCESS") {
      console.log("Token was updated!")
      file.writeFileToken(result.updatedToken)
      exitStatus = 0 
    }
    else {
      console.error("ERROR! Token was not updated!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })


program
  .command('get-info')
  .addOption(new program.Option('-t, --token-id <shard.realm.account>', "The token Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key of the payer. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Get full info of the token with the id token-id.')
  .action(async (args) => {

    console.log(`Getting the info for the token ${args.tokenId} `) 
    const tokenInfo = await mapi.getTokenInfo(args.tokenId, args.network, args.cred)
    util.printTokenInfo(tokenInfo)

    process.exit(0)
  })



program.parse(process.argv)

