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

const { Client, PrivateKey, AccountCreateTransaction, AccountInfoQuery, AccountBalanceQuery, TransferTransaction, Hbar} = require("@hashgraph/sdk")
require("dotenv").config()


const setOperator = (network) => {
    const accountId = process.env.ACCOUNT_ID
    const privateKey = process.env.PRIVATE_KEY

    if (accountId == null || privateKey == null ) {
        throw new Error("Environment variables accountId and privateKey must be present")
    }

    let client = null
    if (network === "main") {
      client = Client.forMainnet()
    }
    else if (network === "test") {
      client = Client.forTestnet()
    }
    client.setOperator(accountId, privateKey)
    return client
}

const createAccount = async (hbarAmount, memo, maxAssoc, maxFee, network) => {
  const client = setOperator(network) 
  
  const privateKey = await PrivateKey.generate()
  const transactionResponse = await new AccountCreateTransaction()
    .setKey(privateKey.publicKey)
    .setMaxTransactionFee(new Hbar(maxFee))
    .setInitialBalance(new Hbar(hbarAmount)) // value in hbars
    .setAccountMemo(memo)
    .setMaxAutomaticTokenAssociations(maxAssoc)
    .execute(client)
  
  const transactionReceipt = await transactionResponse.getReceipt(client)
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


const getAccountBalance = async (accountId, network) => {
  const client = setOperator(network)
  const accountBalance = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(client)
  
  return accountBalance.hbars.toBigNumber()
}


const transferCrypto = async (receiverAccntId, amountHbar, network) =>  {
  const accountId = process.env.ACCOUNT_ID
  const client = setOperator(network)
  const transferTransactionResponse = await new TransferTransaction()
    .addHbarTransfer(accountId  , new Hbar(-amountHbar))
    .addHbarTransfer(receiverAccntId, new Hbar(+amountHbar))
    .execute(client)
  
  //Verify the transaction reached consensus
  const transactionReceipt = await transferTransactionResponse.getReceipt(client)

  const transactionStatus = transactionReceipt.status.toString()
  return transactionStatus
}


exports.setOperator       = setOperator
exports.createAccount     = createAccount
exports.getAccountBalance = getAccountBalance
exports.transferCrypto    = transferCrypto

/*
exports.getAccountInfo    = getAccountInfo
const getAccountInfo = async (accountId, network) => {
  const client = setOperator(network)
  const query = new AccountInfoQuery().setAccountId(accountId)
  const accountInfo = await query.execute(client)

  return accountInfo
}
*/

