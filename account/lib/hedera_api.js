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

"use strict"
const { Client, PrivateKey, AccountCreateTransaction, AccountDeleteTransaction, AccountInfoQuery, AccountBalanceQuery, TransferTransaction, AccountUpdateTransaction, Hbar, Mnemonic} = require("@hashgraph/sdk")
const file        = require('../lib/file')
const cred = require('../../common/credentials')

const setOperator = (network, credFile) => {
  try {
    const credentials = cred.readFileCredentials(credFile)
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


const createAccount = async (hbarAmount, memo, maxAssoc, maxFee, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 
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

const createAccountWithMnemonics = async (hbarAmount, memo, maxAssoc, maxFee, mnemonicIndex, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 
    const mnemonicInfo = await generateMnemonicAndKeysAssociated(mnemonicIndex)

    const transactionCreateResponse = await new AccountCreateTransaction()
      .setKey(mnemonicInfo.publicKeyMO)
      .setMaxTransactionFee(new Hbar(maxFee))
      .setInitialBalance(new Hbar(hbarAmount)) // value in hbars
      .setAccountMemo(memo)
      .setMaxAutomaticTokenAssociations(maxAssoc)
      .execute(operator)
    
    const transactionReceipt = await transactionCreateResponse.getReceipt(operator)
    const newAccountId = transactionReceipt.accountId
    const transactionStatus = transactionReceipt.status.toString()

    const newAccountIdAsString = `${newAccountId.shard}.${newAccountId.realm}.${newAccountId.num}`
    const publicKeyAsString  = mnemonicInfo.publicKeyMO.toString()
    const privateKeyAsString = mnemonicInfo.privateKeyMO.toString() 
    
    const newAccount = {
      accountId        : newAccountIdAsString,
      publicKey        : publicKeyAsString   , 
      privateKey       : privateKeyAsString  ,
    }
    const mnemonic = {
      words: mnemonicInfo.mnemonicSpaceSeparatedString,
      index: mnemonicInfo.mnemonicIndex
    }
    const result = {
      newAccount,
      mnemonic,
      transactionStatus
    }
    return result 
  }
  catch(error) {
    console.error(`Error! Hedera service AccountCreateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}
const deleteAccount = async (accountId, accountIdToTransferBalance, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionDelete = await new AccountDeleteTransaction()
      .setAccountId(accountId)
      .setTransferAccountId(accountIdToTransferBalance)

    const transactionResponse = await transactionDelete.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString()

    return transactionStatus
  }
  catch(error) {
    console.error(error)
    console.error(`Error! Hedera service AccountTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}



const updateAccount = async (accountId, memo, maxAssoc, stakedNodeId, stakedAccountId, declineStaking, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionUpdate = await new AccountUpdateTransaction()
      .setAccountId(accountId)

    if (memo !== null) {
      transactionUpdate.setAccountMemo(memo)
    }
    if (maxAssoc !== null) {
      transactionUpdate.setMaxAutomaticTokenAssociations(maxAssoc)
    }
    if (stakedNodeId !== null) {
      transactionUpdate.setStakedNodeId(stakedNodeId) 
    } 
    if (stakedAccountId !== null) {
      transactionUpdate.setStakedAccountId(stakedAccountId) 
    } 
    if (declineStaking === "yes") {
      transactionUpdate.setDeclineStakingReward(true) 
    }
    else {
      transactionUpdate.setDeclineStakingReward(false) 
    }

    const transactionUpdateResponse = await transactionUpdate.execute(operator);
    const transactionReceipt = await transactionUpdateResponse.getReceipt(operator)
    const transactionStatus = transactionReceipt.status.toString()

    return transactionStatus
  }
  catch(error) {
    console.log(error)
    console.error(`Error! Hedera service AccountUpdateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}


const getAccountBalance = async (accountId, network, credFile) => {
  try {
    const operator = setOperator(network, credFile)
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


const transferCrypto = async (receiverAccntId, amountHbar, network, credFile) =>  {
  try {
    const credentials = cred.readFileCredentials(credFile)
    const accountId  = credentials.accountId
    const operator = setOperator(network, credFile)
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


const getAccountInfo = async (accountId, network, credFile) => {
  try {
    const operator = setOperator(network, credFile)
    const query = new AccountInfoQuery().setAccountId(accountId)
    const accountInfo = await query.execute(operator)

    return accountInfo
  }
  catch(error) {
    console.error(`Error! Hedera service AccountInfoQuery failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

const MyHbarWalletIndex = 1099511627775

const generateMnemonicAndKeysAssociatedMyHbarWallet = async () => {
  const mnemonic = await Mnemonic.generate();
  const mnemonicSpaceSeparatedString = mnemonic.toString()
  const rootPrivateKey = await mnemonic.toLegacyPrivateKey();
  const privateKeyMhwRoot = await rootPrivateKey.legacyDerive(MyHbarWalletIndex);
  const privateKeyMhwString = privateKeyMhwRoot.toString()
  const publicKeyMhwString = privateKeyMhwRoot.publicKey.toString()

  const result = {
    publicKeyMhwString,
    privateKeyMhwString,
    mnemonicSpaceSeparatedString, 
    mnemonicIndex: MyHbarWalletIndex
  }
  return result 
}

const reconstructKeysFromMnemonicMyHbarWallet = async (mnemonicSpaceSeparatedString) => {
  let mnemonic = await Mnemonic.fromString(mnemonicSpaceSeparatedString)
  const rootPrivateKey = await mnemonic.toLegacyPrivateKey();
  const privateKeyMhwRoot = await rootPrivateKey.legacyDerive(MyHbarWalletIndex);

  const privateKeyMhwString = privateKeyMhwRoot.toString()
  const publicKeyMhwString  = privateKeyMhwRoot.publicKey.toString()
  const result = {
    publicKeyMhwString,
    privateKeyMhwString,
    mnemonicSpaceSeparatedString,
    mnemonicIndex: MyHbarWalletIndex
  }
  return result
}

const MechanicalOrangeIndex = 1233217899870

const generateMnemonicAndKeysAssociated = async (index) => {
  const mnemonic = await Mnemonic.generate();
  const mnemonicSpaceSeparatedString = mnemonic.toString()
  const rootPrivateKey = await mnemonic.toPrivateKey();

  if (index === null) {
    index = MechanicalOrangeIndex 
  }
  const privateKeyMORoot = await rootPrivateKey.derive(index);

  const privateKeyMO = privateKeyMORoot
  const publicKeyMO  = privateKeyMORoot.publicKey

  const result = {
    publicKeyMO,
    privateKeyMO,
    mnemonicSpaceSeparatedString,
    mnemonicIndex: index 
  }
  return result
}


const reconstructKeysFromMnemonic = async (mnemonicSpaceSeparatedString, index) => {
  let mnemonic = await Mnemonic.fromString(mnemonicSpaceSeparatedString)
  const rootPrivateKey = await mnemonic.toPrivateKey();
  if (index === null) {
    index = MechanicalOrangeIndex 
  }
  const privateKeyMORoot = await rootPrivateKey.derive(index);

  const result = {
    publicKeyMO  : privateKeyMORoot.publicKey,
    privateKeyMO : privateKeyMORoot,
    mnemonicSpaceSeparatedString,
    mnemonicIndex: index 
  }
  return result
}


exports.setOperator       = setOperator
exports.createAccount     = createAccount
exports.deleteAccount     = deleteAccount 
exports.updateAccount     = updateAccount
exports.getAccountBalance = getAccountBalance
exports.transferCrypto    = transferCrypto
exports.getAccountInfo    = getAccountInfo

exports.generateMnemonicAndKeysAssociatedMyHbarWallet = generateMnemonicAndKeysAssociatedMyHbarWallet
exports.reconstructKeysFromMnemonicMyHbarWallet = reconstructKeysFromMnemonicMyHbarWallet 
exports.generateMnemonicAndKeysAssociated       = generateMnemonicAndKeysAssociated 
exports.reconstructKeysFromMnemonic  = reconstructKeysFromMnemonic 
exports.createAccountWithMnemonics   = createAccountWithMnemonics


