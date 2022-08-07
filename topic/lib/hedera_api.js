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


const { Client, PrivateKey, TopicCreateTransaction, TopicDeleteTransaction, TopicMessageSubmitTransaction} = require("@hashgraph/sdk")
require("dotenv").config()

const setOperator = (network) => {
  try {
    const accountId = process.env.ACCOUNT_ID
    const privateKey = process.env.PRIVATE_KEY

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


const createTopic = async (memo, useAdminKey, useSubmitKey, network) => {
  try {
    const operator = setOperator(network) 

    const privateKey = PrivateKey.fromString(process.env.PRIVATE_KEY )

    const transactionTopic = await new TopicCreateTransaction()
      .setTopicMemo(memo)

    if (useAdminKey === "yes") {
      transactionTopic.setAdminKey(privateKey)
    }

    if (useSubmitKey === "yes") {
      transactionTopic.setSubmitKey(privateKey)
    }
    const transactionResponse = await transactionTopic.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)

    const transactionStatus = transactionReceipt.status.toString()
    const topicIdAsString   = transactionReceipt.topicId.toString()


    const accountId = process.env.ACCOUNT_ID
    const newTopic = 
      { topicId           : topicIdAsString,
        accountId4AdminKey: accountId 
      }

    const result = {
      newTopic,
      transactionStatus
    }
    return result
  }
  catch(error) {
    console.error(`Error! Hedera service TopicCreateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
  
}

const deleteTopic = async (topicId, network) => {
  try {
    const operator = setOperator(network) 

    const transactionTopic = await new TopicDeleteTransaction()
      .setTopicId(topicId)
      .freezeWith(operator)

    const privateKey = PrivateKey.fromString(process.env.PRIVATE_KEY)
    const transactionTopicSigned = await transactionTopic.sign(privateKey);

    const transactionResponse = await transactionTopicSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TopicDeleteTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

const sendMessage = async (topicId, message, network) => {
  try {
    const operator = setOperator(network) 

    const transactionTopic = new TopicMessageSubmitTransaction()
    transactionTopic.setTopicId(topicId)
    transactionTopic.setMessage(message) 
    const transactionResponse = await transactionTopic.execute(operator)

    const transactionReceipt = await transactionResponse.getReceipt(operator)
    const transactionStatus = transactionReceipt.status.toString()
    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TopicMessageSubmitTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }

}


exports.createTopic = createTopic
exports.deleteTopic = deleteTopic
exports.sendMessage = sendMessage

