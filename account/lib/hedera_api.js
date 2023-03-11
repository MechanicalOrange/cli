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
 * Creates a new Hedera account.
 *
 * Generates a new private key and creates a new account on the specified network
 * with the specified initial balance, memo, and maximum automatic token associations.
 *
 * @param {number} hbarAmount - The initial balance for the new account, in HBAR.
 * @param {string} memo - The memo to include with the account creation transaction.
 * @param {number} maxAssoc - The maximum number of automatic token associations for the new account.
 * @param {number} maxFee - The maximum transaction fee for the account creation transaction, in HBAR.
 * @param {string} network - The network to create the account on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {Promise<{newAccount: Object, transactionStatus: string}>} An object with the new account details and the transaction status.
 * @throws {Error} If an error occurs while creating the account.
 */
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

/**
 * Creates a new Hedera account using a mnemonic phrase.
 *
 * Generates a new account key pair from a mnemonic phrase and creates a new account on the specified network
 * with the specified initial balance, memo, and maximum automatic token associations.
 *
 * @param {number} hbarAmount - The initial balance for the new account, in HBAR.
 * @param {string} memo - The memo to include with the account creation transaction.
 * @param {number} maxAssoc - The maximum number of automatic token associations for the new account.
 * @param {number} maxFee - The maximum transaction fee for the account creation transaction, in HBAR.
 * @param {number} mnemonicIndex - The index of the account key pair to derive from the mnemonic phrase.
 * @param {string} network - The network to create the account on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {Promise<{newAccount: Object, mnemonic: {words: string, index: number}, transactionStatus: string}>} An object with the new account details, the mnemonic phrase used to generate the account key pair, and the transaction status.
 * @throws {Error} If an error occurs while creating the account.
 */
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

/**
 * Deletes a Hedera account and transfers its remaining balance to another account.
 *
 * Deletes the account with the specified ID on the specified network and transfers its remaining balance
 * to the account with the specified ID to transfer the balance to. Returns the transaction status.
 *
 * @param {string} accountId - The ID of the account to delete.
 * @param {string} accountIdToTransferBalance - The ID of the account to transfer the balance to.
 * @param {string} network - The network to delete the account on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {Promise<string>} The transaction status.
 * @throws {Error} If an error occurs while deleting the account.
 */
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
    console.error(`Error! Hedera service AccountDeleteTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}


/**
 * Updates a Hedera account.
 *
 * Updates the account with the specified ID on the specified network, modifying its memo, maximum automatic token associations,
 * staked node ID, staked account ID, and/or staking reward preferences. Returns the transaction status.
 *
 * @param {string} accountId - The ID of the account to update.
 * @param {string} memo - The new memo for the account, or null to leave it unchanged.
 * @param {number} maxAssoc - The new maximum number of automatic token associations for the account, or null to leave it unchanged.
 * @param {string} stakedNodeId - The ID of the node to stake the account to, or null to leave it unchanged.
 * @param {string} stakedAccountId - The ID of the account to stake the account to, or null to leave it unchanged.
 * @param {string} declineStaking - "yes" to decline staking rewards, "no" to accept staking rewards, or null to leave it unchanged.
 * @param {number} maxFee - The maximum transaction fee for the account update transaction, in HBAR.
 * @param {string} network - The network to update the account on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {Promise<string>} The transaction status.
 * @throws {Error} If an error occurs while updating the account.
 */
const updateAccount = async (accountId, memo, maxAssoc, stakedNodeId, stakedAccountId, declineStaking, maxFee, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionUpdate = await new AccountUpdateTransaction()
      .setMaxTransactionFee(new Hbar(maxFee))
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

/**
 * Gets the balance of a Hedera account.
 *
 * Gets the balance of the account with the specified ID on the specified network.
 *
 * @param {string} accountId - The ID of the account to get the balance for.
 * @param {string} network - The network to get the account balance on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {Promise<BigNumber>} The balance of the account, in HBAR.
 * @throws {Error} If an error occurs while getting the account balance.
 */
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

/**
 * Transfers a specified amount of cryptocurrency (Hbar) from one account to another on the Hedera network.
 *
 * @async
 * @param {string} receiverAccntId - The account ID of the receiver.
 * @param {number} amountHbar - The amount of Hbar to transfer.
 * @param {string} network - The network on which the transfer is to take place.
 * @param {string} credFile - The path to a JSON file containing the credentials necessary for the transaction.
 * @throws {Error} Throws an error if the transaction fails.
 * @returns {string} Returns the status of the transaction.
 */
const transferCrypto = async (receiverAccntId, amountHbar, network, credFile) =>  {
  try {
    const credentials = cred.readFileJson(credFile)
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

/**
 * Retrieves the account information for a given account ID on the Hedera network.
 *
 * @async
 * @param {string} accountId - The account ID to retrieve information for.
 * @param {string} network - The network on which to retrieve the information.
 * @param {string} credFile - The path to a JSON file containing the credentials necessary for the query.
 * @throws {Error} Throws an error if the query fails.
 * @returns {Promise<AccountInfo>} Returns a Promise that resolves to the account information object.
 */
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

/**
 * Generates a new mnemonic phrase and the corresponding private and public keys for the MyHbarWallet app.
 *
 * @async
 * @throws {Error} Throws an error if the keys cannot be generated.
 * @returns {Promise<{publicKeyMhwString: string, privateKeyMhwString: string, mnemonicSpaceSeparatedString: string, mnemonicIndex: number}>} Returns a Promise that resolves to an object containing the public and private keys, the mnemonic phrase, and the index for the MyHbarWallet.
 */
//const MyHbarWalletIndex = 1099511627775
const MyHbarWalletIndex = 0

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

/**
 * Reconstructs the private and public keys for the MyHbarWallet app from a provided mnemonic phrase.
 *
 * @async
 * @param {string} mnemonicSpaceSeparatedString - The mnemonic phrase to use for key reconstruction.
 * @throws {Error} Throws an error if the keys cannot be reconstructed.
 * @returns {Promise<{publicKeyMhwString: string, privateKeyMhwString: string, mnemonicSpaceSeparatedString: string, mnemonicIndex: number}>} Returns a Promise that resolves to an object containing the public and private keys, the mnemonic phrase, and the index for the MyHbarWallet.
 */
const reconstructKeysFromMnemonicMyHbarWallet = async (mnemonicSpaceSeparatedString) => {
  let mnemonic = await Mnemonic.fromString(mnemonicSpaceSeparatedString)
  console.log(mnemonic)
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


/**
 * Generates a new mnemonic phrase and the corresponding private and public keys for the Mechanical Orange app.
 *
 * @async
 * @param {number} index - The index to derive the private key from. If null, defaults to the Mechanical Orange index.
 * @throws {Error} Throws an error if the keys cannot be generated.
 * @returns {Promise<{publicKeyMO: Ed25519PublicKey, privateKeyMO: Ed25519PrivateKey, mnemonicSpaceSeparatedString: string, mnemonicIndex: number}>} Returns a Promise that resolves to an object containing the public and private keys, the mnemonic phrase, and the index for the Mechanical Orange app.
 */
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

/**
 * Reconstructs the private and public keys for the Mechanical Orange app from a provided mnemonic phrase.
 *
 * @async
 * @param {string} mnemonicSpaceSeparatedString - The mnemonic phrase to use for key reconstruction.
 * @param {number} index - The index to derive the private key from. If null, defaults to the Mechanical Orange index.
 * @throws {Error} Throws an error if the keys cannot be reconstructed.
 * @returns {Promise<{publicKeyMO: Ed25519PublicKey, privateKeyMO: Ed25519PrivateKey, mnemonicSpaceSeparatedString: string, mnemonicIndex: number}>} Returns a Promise that resolves to an object containing the public and private keys, the mnemonic phrase, and the index for the Mechanical Orange app.
 */
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


