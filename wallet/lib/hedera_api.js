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

const { Client, PrivateKey, AccountCreateTransaction, AccountDeleteTransaction, AccountInfoQuery, AccountBalanceQuery, TransferTransaction, Hbar} = require("@hashgraph/sdk")
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


const createAccount = async (hbarAmount, memo, maxAssoc, maxFee, network) => {
  try {
    const operator = setOperator(network) 
    
    const privateKey = await PrivateKey.generate()
    const transactionCreateResponse = await new AccountCreateTransaction()
      .setKey(privateKey.publicKey)
      .setMaxTransactionFee(new Hbar(maxFee))
      .setInitialBalance(new Hbar(hbarAmount)) // value in hbars
      .setAccountMemo(memo)
      .setMaxAutomaticTokenAssociations(maxAssoc)
      .execute(operator)
    
    const transactionReceipt = await transactionCreateResponse.getReceipt(operator)
    const newAccountId = transactionReceipt.accountId
    const transactionStatus = transactionReceipt.status.toString()

    const newAccountIdAsString = `${newAccountId.shard}.${newAccountId.realm}.${newAccountId.num}`
    const publicKeyAsString  = privateKey.publicKey.toString()
    const privateKeyAsString = privateKey.toString()
    
    const newAccount = {
      accountId        : newAccountIdAsString,
      publicKey        : publicKeyAsString   , 
      privateKey       : privateKeyAsString  ,
    }

    const result = {
      newAccount,
      transactionStatus
    }
    return result 
  }
  catch(error) {
    console.error(`Error! Hedera service AccountCreateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }

}


const getAccountBalance = async (accountId, network) => {
  try {
    const operator = setOperator(network)
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(operator)
    
    return accountBalance.hbars.toBigNumber()
  }
  catch(error) {
    console.error(`Error! Hedera service AccountBalanceQuery failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}


const transferCrypto = async (receiverAccntId, amountHbar, network) =>  {
  try {
    const accountId = process.env.ACCOUNT_ID
    const operator = setOperator(network)
    const transferTransactionResponse = await new TransferTransaction()
      .addHbarTransfer(accountId  , new Hbar(-amountHbar))
      .addHbarTransfer(receiverAccntId, new Hbar(+amountHbar))
      .execute(operator)
    
    const transactionReceipt = await transferTransactionResponse.getReceipt(operator)
    const transactionStatus = transactionReceipt.status.toString()
    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TransferTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}


exports.setOperator       = setOperator
exports.createAccount     = createAccount
exports.getAccountBalance = getAccountBalance
exports.transferCrypto    = transferCrypto

/*
exports.getAccountInfo    = getAccountInfo
const getAccountInfo = async (accountId, network) => {
  const operator = setOperator(network)
  const query = new AccountInfoQuery().setAccountId(accountId)
  const accountInfo = await query.execute(operator)

  return accountInfo
}

exports.deleteAccount     = deleteAccount 
const deleteAccount = async (accountId, network) => {
  try {
    const operator = setOperator(network) 
    //const accountIdWhereToTransferBalance = process.env.ACCOUNT_ID
    const accountIdWhereToTransferBalance = "0.0.47853934"

    const transactionDelete = await new AccountDeleteTransaction()
      .setAccountId(accountId)
      .setTransferAccountId(accountIdWhereToTransferBalance)
      .freezeWith(operator)

    const privateKey = PrivateKey.fromString(process.env.PRIVATE_KEY)
    const transactionDeleteSigned = await transactionDelete.sign(privateKey)
    const transactionResponse = await transactionDeleteSigned.execute(operator)

    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString()

    return transactionStatus
  }
  catch(error) {
    console.error(error)
    console.error(`Error! Hedera service TopicDeleteTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}
*/

