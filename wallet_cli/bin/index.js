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


program.version(pckg.version)
cl = console.log

program
  .command('create-account')
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
  .description('Create an account. Account can have an initial amount of hbar, a memo, and a number of token associations. Account is created on testnet or mainnet.')
  .action(async (args) => {

    const newAccount = await mapi.createAccount(args.amount, args.memo, args.assoc, args.maxFee, args.network)
    file.writeFile(newAccount)
    process.exit(0)

  })

program
  .command('transfer-hbar')
  .addOption(new program.Option('-a, --amount <hbar>', "Amount of hbar to be transferred.")
    .argParser(util.hbarParseFloat).makeOptionMandatory()) 
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .description('Transfer hbar to another account.')
  .action(async (args) => {
    const status = await mapi.transferCrypto (args.accountId, args.amount, args.network)
    const resultAsString = status === "SUCCESS" ? "was done successfully!" : "FAILED!"
    console.log(`The transfer of ${args.amount} hbars to account ${args.accountId} ${resultAsString}`) 

    process.exit(0)
  })

program
  .command('get-balance')
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .description('Get the account balance.')
  .action(async (args) => {
    const hbar = await mapi.getAccountBalance(args.accountId, args.network)
    cl(`The account ${args.accountId} has ${hbar.toNumber()} hbars.`)

    process.exit(0)
  })

program
  .command('get-account-info')
  .addOption(new program.Option('-i, --account-id <shard.realm.account>', "The account Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .description('Get the account info in primary form.')
  .action(async (args) => {
    const accInfo = await mapi.getAccountInfo(args.accountId, args.network)
    cl(accInfo)

    process.exit(0)
  })


program.parse(process.argv)

