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


const { Client, PrivateKey, TopicCreateTransaction, TopicUpdateTransaction, TopicDeleteTransaction, TopicMessageSubmitTransaction, TopicInfoQuery} = require("@hashgraph/sdk")
const cred = require('../../common/credentials')

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


const createTopic = async (memo, adminCredFile, submitCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    let adminAccountId  = "none" 
    let submitAccountId = "none" 

    const transactionTopic = await new TopicCreateTransaction()
      .setTopicMemo(memo)

    if (adminCredFile !== null) {
      const adminCredentials = cred.readFileJson(adminCredFile)
      adminAccountId  = adminCredentials.accountId 
      const adminKey  = PrivateKey.fromString(adminCredentials.privateKey)
      transactionTopic.setAdminKey(adminKey)
    }

    if (submitCredFile !== null) {
      const submitCredentials = cred.readFileJson(submitCredFile)
      submitAccountId  = submitCredentials.accountId 
      const submitKey = PrivateKey.fromString(submitCredentials.privateKey)
      transactionTopic.setSubmitKey(submitKey)
    }
    const transactionResponse = await transactionTopic.execute(operator)

    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus = transactionReceipt.status.toString()
    const topicIdAsString   = transactionReceipt.topicId.toString()

    const newTopic = 
      { topicId            : topicIdAsString,
        accountId4AdminKey : adminAccountId ,
        accountId4SubmitKey: submitAccountId 
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

const deleteTopic = async (topicId, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionTopic = await new TopicDeleteTransaction()
      .setTopicId(topicId)
      .freezeWith(operator)

    const credentials = cred.readFileJson(credFile)
    const privateKey = PrivateKey.fromString(credentials.privateKey)
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


const updateTopic = async (topicId, memo, adminCredFile, submitCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    let adminAccountId  = "none" 
    let submitAccountId = "none" 

    const credentials = cred.readFileJson(credFile)
    const privateKey = PrivateKey.fromString(credentials.privateKey)

    const transactionTopic = await new TopicUpdateTransaction()
      .setTopicId(topicId)

    if (memo !== null) {
      transactionTopic.setTopicMemo(memo)
    }

    if (adminCredFile !== null) {
      const adminCredentials = cred.readFileJson(adminCredFile)
      adminAccountId  = adminCredentials.accountId 
      const adminKey  = PrivateKey.fromString(adminCredentials.privateKey)
      transactionTopic.setAdminKey(adminKey)
    }
    
    if (submitCredFile !== null) {
      const submitCredentials = cred.readFileJson(submitCredFile)
      submitAccountId  = submitCredentials.accountId 
      const submitKey = PrivateKey.fromString(submitCredentials.privateKey)
      transactionTopic.setSubmitKey(submitKey)
    }

    await transactionTopic.freezeWith(operator)

    let signedTransaction = await transactionTopic.sign(privateKey);

    if (adminCredFile !== null) {
      const adminCredentials = cred.readFileJson(adminCredFile)
      const adminKey  = PrivateKey.fromString(adminCredentials.privateKey)
      signedTransaction = await transactionTopic.sign(adminKey);
    }
    const transactionResponse = await signedTransaction.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)

    const transactionStatus = transactionReceipt.status.toString()

    const updatedTopic = 
      { topicId            : topicId,
        accountId4AdminKey : adminAccountId ,
        accountId4SubmitKey: submitAccountId 
      }

    const result = {
      updatedTopic,
      transactionStatus
    }
    return result
  }
  catch(error) {
    console.error(`Error! Hedera service TopicUpdateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}




const getTopicInfo = async (topicId, network, credFile) => {
  try {
    const operator = setOperator(network, credFile)

    const topicInfo = new TopicInfoQuery()
      .setTopicId(topicId)
      .execute(operator)

    return topicInfo 
  }
  catch(error) {
    console.error(`Error! Hedera service TopicInfoQuery failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}


const sendMessage = async (topicId, message, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

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


exports.createTopic    = createTopic
exports.deleteTopic    = deleteTopic
exports.updateTopic    = updateTopic
exports.sendMessage    = sendMessage
exports.getTopicInfo   = getTopicInfo 

/*
const clearTopicKeys = async (topicId, keyToClear, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    let adminAccountId  = "unmodified" 
    let submitAccountId = "unmodified" 

    const transactionTopic = await new TopicUpdateTransaction()
      .setTopicId(topicId)

    if (keyToClear === "admin") {
      await transactionTopic.clearAdminKey()
      adminAccountId  = "none" 
    }
    else if (keyToClear === "submit") {
      console.log("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")
      await transactionTopic.clearSubmitKey()
      submitAccountId = "none" 
    }
    
    await transactionTopic.freezeWith(operator)

    const credentials = cred.readFileJson(credFile)
    const privateKey = PrivateKey.fromString(credentials.privateKey)
    let signedTransaction = await transactionTopic.sign(privateKey);

    const transactionResponse = await signedTransaction.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus = transactionReceipt.status.toString()

    const updatedTopic = 
      { topicId            : topicId,
        accountId4AdminKey : adminAccountId ,
        accountId4SubmitKey: submitAccountId 
      }

    const result = {
      updatedTopic,
      transactionStatus
    }
    return result
  }
  catch(error) {
    console.error(`Error! Hedera service TopicUpdateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}
*/

//exports.clearTopicKeys = clearTopicKeys 
//
