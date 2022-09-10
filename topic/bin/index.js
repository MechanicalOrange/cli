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


program
  .name("topic")
  .description("Accessing HCS via CLI.")
  .version(pckg.version)

program
  .command('create')
  .addOption(new program.Option('-m, --memo [memo]', 'Memo of the topic. Default value is empty string "".')
    .argParser(util.memoParseString).default("")) 
  .addOption(new program.Option('-a, --admin-file [admin-file]', 'The admin key is the private key from the admin-file. By default no admin key is set.')
    .argParser(util.messageParseString).default(null)) 
  .addOption(new program.Option('-s, --submit-file [submit-file]', 'The submit key is the private key from the submit-file. By default no submit key is set.')
    .argParser(util.messageParseString).default(null)) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Create a HCS topic. Topic can have a memo and is created on testnet or mainnet. The admin key must be identical with the credential key.')
  .action(async (args) => {

    console.log(`Creating a topic `) 
    const result = await mapi.createTopic(args.memo, args.adminFile, args.submitFile, args.network, args.cred)

    let exitStatus = null
    if (result.transactionStatus === "SUCCESS") {
      file.writeFileTopic(result.newTopic)
      exitStatus = 0 
    }
    else {
      console.error("ERROR! No topic was created!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })


program
  .command('delete')
  .addOption(new program.Option('-i, --topic-id <shard.realm.account>', "The account Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Delete the topic with the id topic-id.')
  .action(async (args) => {

    console.log(`Deleting the topic ${args.topicId} `) 
    const status = await mapi.deleteTopic(args.topicId, args.network, args.cred)

    let exitStatus = null

    if (status === "SUCCESS") {
      console.log(`The deletion of ${args.topicId} was done successfully!`) 
      exitStatus = 0
    }
    else {
      console.error(`The deletion of ${args.topicId} failed!`) 
      exitStatus = 1
    }

    process.exit(exitStatus)
  })


program
  .command('update')
  .addOption(new program.Option('-i, --topic-id <shard.realm.account>', "The topic Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-m, --memo [memo]', 'The new memo of the topic. By default the memo is not changed.')
    .argParser(util.memoParseString).default("")) 
  .addOption(new program.Option('-a, --admin-file [admin-file]', 'The new admin key is the private key from the admin-file. By default the admin key is not changed.')
    .argParser(util.messageParseString).default(null)) 
  .addOption(new program.Option('-s, --submit-file [submit-file]', 'The new submit key is the private key from the submit-file. By default the submit key is not changed.')
    .argParser(util.messageParseString).default(null)) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Update a HCS topic. The memo, the admin key and the submit key can be modified jon testnet or mainnet.')
  .action(async (args) => {

    console.log(`Updating topic ${args.topicId} `) 
    const result = await mapi.updateTopic(args.topicId, args.memo, args.adminFile, args.submitFile, args.network, args.cred)

    let exitStatus = null
    if (result.transactionStatus === "SUCCESS") {
      console.log("Topic was updated!")
      file.writeFileTopic(result.updatedTopic)
      exitStatus = 0 
    }
    else {
      console.error("ERROR! Topic was not updated!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })


program
  .command('get-info')
  .addOption(new program.Option('-i, --topic-id <shard.realm.account>', "The topic Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Get full info of the topic with the id topic-id.')
  .action(async (args) => {

    console.log(`Getting the info for the topic ${args.topicId} `) 
    const topicInfo = await mapi.getTopicInfo(args.topicId, args.network, args.cred)
    util.printTopicInfo(topicInfo)

    process.exit(0)
  })


program
  .command('send-message')
  .addOption(new program.Option('-i, --topic-id <shard.realm.account>', 'The account Id.')
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-m, --message <message>', 'Message sent. Use quotes for multiple words. Default value is empty string "".')
    .argParser(util.messageParseString).default("")) 
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Send a message to the topic.')
  .action(async (args) => {

    console.log(`Sending the message:\n${args.message}\nto ${args.topicId} `) 
    const status = await mapi.sendMessage(args.topicId, args.message, args.network, args.cred)

    let exitStatus = null
    if (status === "SUCCESS") {
      console.log(`Message was sent successfully!`) 
      exitStatus = 0
    }
    else {
      console.error(`Error! Message failed to be sent!`) 
      exitStatus = 1
    }
    process.exit(exitStatus)
  })


program
  .command('send-file')
  .addOption(new program.Option('-i, --topic-id <shard.realm.account>', "The account Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-f, --file <path-to-file> ', "The file that contains the message that is going to be sent. This is useful for long messages.")
    .argParser(util.messageParseString).makeOptionMandatory())
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Send the content of a file as a message to the topic. The file size must be smaller than 1024 bytes.')
  .action(async (args) => {

    const message = file.transformFileIntoMessage(args.file) 

    console.log(`Sending the message:\n${message}\nto ${args.topicId} `) 
    const status = await mapi.sendMessage(args.topicId, message, args.network, args.cred)

    let exitStatus = null

    if (status === "SUCCESS") {
      console.log(`Message was sent successfully!`) 
      exitStatus = 0
    }
    else {
      console.error(`Error! Message failed to be sent!`) 
      exitStatus = 1
    }
    process.exit(exitStatus)
  })

program
  .command('send-signature')
  .addOption(new program.Option('-i, --topic-id <shard.realm.account>', 'The account Id.')
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-m, --memo <memo>', 'Memo of the timestamp. Default value is empty string "".')
    .argParser(util.messageParseString).default("")) 
  .addOption(new program.Option('-f, --file <path-to-file> ', 'File sent that has the SHA3-256 signature computed and sent to the network.')
    .argParser(util.messageParseString).makeOptionMandatory())
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Generate the SHA3-256 hash and send it to the topic. The format of the message is "message-memo sha-signature".')
  .action(async (args) => {

    const shaSignature = file.generateSHA256Hash(args.file) 
     
    const message = `${args.memo} ${shaSignature}`

    console.log(`Sending the message:\n${message}\nto ${args.topicId} `) 
    const status = await mapi.sendMessage(args.topicId, message, args.network, args.cred)

    let exitStatus = null

    if (status === "SUCCESS") {
      console.log(`Message was sent successfully!`) 
      exitStatus = 0
    }
    else {
      console.error(`Error! Message failed to be sent!`) 
      exitStatus = 1
    }
    process.exit(exitStatus)
})

program.parse(process.argv)

/*
program
  .command('clear-key')
  .addOption(new program.Option('-i, --topic-id <shard.realm.account>', "The topic Id.")
    .argParser(util.accntParseString).makeOptionMandatory()) 
  .addOption(new program.Option('-k, --key <key-type>', 'The key to be cleared.')
    .choices(['admin', 'submit']).makeOptionMandatory())
  .addOption(new program.Option('-n, --network <type>', 'Network type: mainnet or testnet')
    .choices(['main', 'test']).makeOptionMandatory())
  .addOption(new program.Option('-c, --cred <credentials-file>', "Path to the file that contains the accountID, public and private key. In the future it can be encrypted.")
    .argParser(util.messageParseString).makeOptionMandatory()) 
  .description('Create a HCS topic. Topic can have a memo and is created on testnet or mainnet.')
  .action(async (args) => {

    console.log(`Clearing key ${args.keyType} for topic ${args.topicId} `) 
    const result = await mapi.clearTopicKeys(args.topicId, args.key, args.network, args.cred)

    let exitStatus = null
    if (result.transactionStatus === "SUCCESS") {
      console.log(`Topic key  ${args.key} was cleared!`)
      file.writeFileTopic(result.updatedTopic)
      exitStatus = 0 
    }
    else {
      console.error("ERROR! Topic key was not cleared!")
      exitStatus = 1 
    }
    process.exit(exitStatus)
  })
  */
