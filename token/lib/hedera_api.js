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


let cl = console.log  

const { Client, PublicKey, PrivateKey, AccountBalanceQuery, TokenFeeScheduleUpdateTransaction, TokenGrantKycTransaction, TokenRevokeKycTransaction, TransferTransaction, TokenAssociateTransaction, TokenDissociateTransaction, TokenCreateTransaction, TokenUpdateTransaction, TokenDeleteTransaction, TokenInfoQuery, TokenMintTransaction, TokenBurnTransaction, TokenWipeTransaction, TokenPauseTransaction, TokenUnpauseTransaction, TokenFreezeTransaction, TokenUnfreezeTransaction, TokenType, TokenSupplyType, CustomFractionalFee, CustomFixedFee } = require("@hashgraph/sdk")

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
 * Creates a new Hedera token with the specified configuration.
 *
 * @param {Object} tokenCfg - The configuration for the new token.
 * @param {Object} network - The network configuration object.
 * @param {string} credFile - The path to the credentials JSON file for the operator account.
 * @returns {Promise<Object>} A Promise that resolves to an object containing the new token ID, configuration, and transaction status.
 * @throws {Error} If the Hedera service call fails for any reason.
 */
const createToken = async (tokenCfg, network, credFile) => {
  try {

    const txnToken = await new TokenCreateTransaction()
      .setTokenName(tokenCfg.name)
      //.setMaxTransactionFee(new Hbar(maxFee))
      .setMaxTransactionFee(100) // FIXME the max transaction fee must be programmable, see account
      .setTokenSymbol(tokenCfg.symbol)
      .setTreasuryAccountId(tokenCfg.treasuryAccount)
 
    if (tokenCfg.tokenType      != undefined) {
      if (tokenCfg.tokenType === "NonFungibleUnique") txnToken.setTokenType(TokenType.NonFungibleUnique)
      if (tokenCfg.tokenType === "FungibleCommon") txnToken.setTokenType(TokenType.FungibleCommon)
    }
    
    if (tokenCfg.decimal        != undefined) txnToken.setDecimals      (tokenCfg.decimals      )
    if (tokenCfg.initialSupply  != undefined) txnToken.setInitialSupply (tokenCfg.initialSupply )
    if (tokenCfg.adminKey       != undefined) txnToken.setAdminKey      (PublicKey.fromString(tokenCfg.adminKey      ))
    if (tokenCfg.kycKey         != undefined) txnToken.setKycKey        (PublicKey.fromString(tokenCfg.kycKey        ))
    if (tokenCfg.freezeKey      != undefined) txnToken.setFreezeKey     (PublicKey.fromString(tokenCfg.freezeKey     ))
    if (tokenCfg.wipeKey        != undefined) txnToken.setWipeKey       (PublicKey.fromString(tokenCfg.wipeKey       ))
    if (tokenCfg.supplyKey      != undefined) txnToken.setSupplyKey     (PublicKey.fromString(tokenCfg.supplyKey     ))
    if (tokenCfg.feeScheduleKey != undefined) txnToken.setFeeScheduleKey(PublicKey.fromString(tokenCfg.feeScheduleKey))
    if (tokenCfg.pauseKey       != undefined) txnToken.setPauseKey      (PublicKey.fromString(tokenCfg.pauseKey      ))
    if (tokenCfg.customFee      != undefined) txnToken.setCustomFees    (tokenCfg.customFees    )
    if (tokenCfg.maxSupply      != undefined) txnToken.setMaxSupply     (tokenCfg.maxSupply     )
    if (tokenCfg.supplyType     != undefined) {
      if (tokenCfg.supplyType === "Finite") txnToken.setSupplyType(TokenSupplyType.Finite)
      if (tokenCfg.supplyType === "Infinite") txnToken.setSupplyType(TokenSupplyType.Infinite)
    }
    if (tokenCfg.freezeDefault  != undefined) {
      let val = tokenCfg.freezeDefault === "true" ? true : false;
      txnToken.setFreezeDefault (val)
    }
    if (tokenCfg.memo           != undefined) txnToken.setTokenMemo     (tokenCfg.memo          )

    const operator = setOperator(network, credFile) 
    const transactionResponse = await txnToken.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus = transactionReceipt.status.toString()
    const tokenIdAsString   = transactionReceipt.tokenId.toString()
    const newToken = { 
      tokenId : tokenIdAsString,
      tokenCfg
    }
 
    const result = {
      newToken,
      transactionStatus
    }
    return result
  }
  catch(error) {
    console.error(`Error! Hedera service TokenCreateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Gets the token balance for an account on the Hedera network.
 *
 * Executes an AccountBalanceQuery to get the token balance for the specified account ID on the
 * specified network, using the account ID and private key stored in the specified JSON file to
 * set the operator account for the client instance.
 *
 * @param {string} accountId The ID of the account to get the token balance for.
 * @param {string} network The network to execute the query on. Must be either "main" or "test".
 * @param {string} credFile The path to the JSON file containing the account ID and private key.
 * @returns {string} The token balance for the specified account ID, as a string.
 * @throws Throws an error if there is an issue executing the AccountBalanceQuery.
 */
const getTokenBalance = async (accountId, network, credFile) => {
  try {
    const operator = setOperator(network, credFile)
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(operator)
    
    //return accountBalance.tokens.toString()
    return accountBalance.tokens
  }
  catch(error) {
    console.error(`Error! Hedera service AccountBalanceQuery failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Mints a specified amount of tokens for a given token ID on the Hedera network.
 *
 * Executes a TokenMintTransaction to mint the specified amount of tokens for the specified
 * token ID on the specified network, using the account ID and private key stored in the
 * specified JSON file to set the operator account for the client instance. The private key
 * for the supply account is read from a separate JSON file.
 *
 * @param {number} amount The amount of tokens to mint.
 * @param {string} tokenId The ID of the token to mint.
 * @param {string} supplyCredFile The path to the JSON file containing the private key of the
 *                                supply account used for token minting.
 * @param {string} network The network to execute the transaction on. Must be either "main" or "test".
 * @param {string} credFile The path to the JSON file containing the account ID and private key
 *                          for the operator account.
 * @returns {string} The status of the transaction as a string.
 * @throws Throws an error if there is an issue executing the TokenMintTransaction.
 */
const mintToken = async (amount, tokenId, supplyCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setAmount(amount)
      .freezeWith(operator)

    const supplyCred = cred.readFileJson(supplyCredFile)
    const supplyKey = PrivateKey.fromString(supplyCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(supplyKey);

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenDeleteTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Burns a specified amount of tokens for a given token ID on the Hedera network.
 *
 * Executes a TokenBurnTransaction to burn the specified amount of tokens for the specified
 * token ID on the specified network, using the account ID and private key stored in the
 * specified JSON file to set the operator account for the client instance. The private key
 * for the supply account is read from a separate JSON file.
 *
 * @param {number} amount The amount of tokens to burn.
 * @param {string} tokenId The ID of the token to burn.
 * @param {string} supplyCredFile The path to the JSON file containing the private key of the
 *                                supply account used for token burning.
 * @param {string} network The network to execute the transaction on. Must be either "main" or "test".
 * @param {string} credFile The path to the JSON file containing the account ID and private key
 *                          for the operator account.
 * @returns {string} The status of the transaction as a string.
 * @throws Throws an error if there is an issue executing the TokenBurnTransaction.
 */
const burnToken = async (amount, tokenId, supplyCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenBurnTransaction()
      .setTokenId(tokenId)
      .setAmount(amount)
      .freezeWith(operator)

    const supplyCred = cred.readFileJson(supplyCredFile)
    const supplyKey = PrivateKey.fromString(supplyCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(supplyKey);

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenBurnTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Wipes tokens from a specified account on the Hedera network.
 *
 * This function creates a token wipe transaction to remove a specified amount of tokens from the specified account.
 * The transaction is signed with the private keys stored in the specified JSON files, and executed on the specified network
 * using the operator account set in the credFile parameter.
 *
 * @param {string} wipedAccountId - The ID of the account from which to wipe tokens.
 * @param {string} amount - The amount of tokens to wipe.
 * @param {string} tokenId - The ID of the token to wipe.
 * @param {string} wipeCredFile - The path to the JSON file containing the private key for the account that will perform the wipe transaction.
 * @param {string} network - The network on which to execute the transaction. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {string} The status of the executed transaction.
 * @throws {Error} If an error occurs while executing the transaction.
 */
const wipeToken = async (wipedAccountId, amount, tokenId, wipeCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenWipeTransaction()
      .setAccountId(wipedAccountId)
      .setTokenId(tokenId)
      .setAmount(amount)
      .freezeWith(operator)

    const wipeCred = cred.readFileJson(wipeCredFile)
    const wipeKey = PrivateKey.fromString(wipeCred.privateKey)
    const credentials = cred.readFileJson(credFile)
    const privateKey = PrivateKey.fromString(credentials.privateKey)

    const transactionTokenSigned = await (await transactionToken.sign(privateKey)).sign(wipeKey)

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenBurnTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Pauses a specified token on the Hedera network.
 *
 * This function creates a token pause transaction to pause the specified token on the network. The transaction is signed
 * with the private key stored in the specified JSON file, and executed on the specified network using the operator account
 * set in the credFile parameter.
 *
 * @param {string} tokenId - The ID of the token to pause.
 * @param {string} pauseCredFile - The path to the JSON file containing the private key for the account that will perform the pause transaction.
 * @param {string} network - The network on which to execute the transaction. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {string} The status of the executed transaction.
 * @throws {Error} If an error occurs while executing the transaction.
 */
const pauseToken = async (tokenId, pauseCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenPauseTransaction()
      .setTokenId(tokenId)
      .freezeWith(operator)

    const pauseCred = cred.readFileJson(pauseCredFile)
    const pauseKey = PrivateKey.fromString(pauseCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(pauseKey);

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenPauseTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Unpauses a specified token on the Hedera network.
 *
 * This function creates a token unpause transaction to unpause the specified token on the network. The transaction is signed
 * with the private key stored in the specified JSON file, and executed on the specified network using the operator account
 * set in the credFile parameter.
 *
 * @param {string} tokenId - The ID of the token to unpause.
 * @param {string} pauseCredFile - The path to the JSON file containing the private key for the account that will perform the unpause transaction.
 * @param {string} network - The network on which to execute the transaction. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {string} The status of the executed transaction.
 * @throws {Error} If an error occurs while executing the transaction.
 */
const unpauseToken = async (tokenId, pauseCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenUnpauseTransaction()
      .setTokenId(tokenId)
      .freezeWith(operator)

    const pauseCred = cred.readFileJson(pauseCredFile)
    const pauseKey = PrivateKey.fromString(pauseCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(pauseKey);

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenUnpauseTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Associates a token with the operator account on the Hedera network.
 *
 * This function creates a token associate transaction to associate the specified token with the operator account on the network.
 * The transaction is signed with the private key stored in the specified JSON file, and executed on the specified network
 * using the operator account set in the credFile parameter.
 *
 * @param {string} tokenId - The ID of the token to associate.
 * @param {string} network - The network on which to execute the transaction. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {string} The status of the executed transaction.
 * @throws {Error} If an error occurs while executing the transaction.
 */
const associateToken = async (tokenId, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 
    const credentials = cred.readFileJson(credFile)
    const accountId  = credentials.accountId
    const privateKey = PrivateKey.fromString(credentials.privateKey)

    const transactionToken = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId])
      .freezeWith(operator)

    const transactionTokenSigned = await transactionToken.sign(privateKey);
    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenAssociateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Dissociates a token from the operator account on the Hedera network.
 *
 * This function creates a token dissociate transaction to dissociate the specified token from the operator account on the network.
 * The transaction is signed with the private key stored in the specified JSON file, and executed on the specified network
 * using the operator account set in the credFile parameter.
 *
 * @param {string} tokenId - The ID of the token to dissociate.
 * @param {string} network - The network on which to execute the transaction. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {string} The status of the executed transaction.
 * @throws {Error} If an error occurs while executing the transaction.
 */
const dissociateToken = async (tokenId, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 
    const credentials = cred.readFileJson(credFile)
    const accountId  = credentials.accountId
    const privateKey = PrivateKey.fromString(credentials.privateKey)


    const transactionToken = await new TokenDissociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId])
      .freezeWith(operator)

    const transactionTokenSigned = await transactionToken.sign(privateKey);

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenAssociateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Freezes a specified token on the Hedera network.
 *
 * This function creates a token freeze transaction to freeze the specified token for the specified account on the network.
 * The transaction is signed with the private key stored in the specified JSON file, and executed on the specified network
 * using the operator account set in the credFile parameter.
 *
 * @param {string} tokenId - The ID of the token to freeze.
 * @param {string} unfreezeAccountId - The ID of the account to freeze the token for.
 * @param {string} freezeCredFile - The path to the JSON file containing the private key for the account that will perform the freeze transaction.
 * @param {string} network - The network on which to execute the transaction. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the operator account ID and private key.
 * @returns {string} The status of the executed transaction.
 * @throws {Error} If an error occurs while executing the transaction.
 */
const freezeToken = async (tokenId, unfreezeAccountId, freezeCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenFreezeTransaction()
      .setAccountId(unfreezeAccountId)
      .setTokenId(tokenId)
      .freezeWith(operator)

    const freezeCred = cred.readFileJson(freezeCredFile)
    const freezeKey = PrivateKey.fromString(freezeCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(freezeKey);

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenUnfreezeTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Unfreezes a token on the Hedera network.
 *
 * @function
 * @async
 * @param {string} tokenId - The ID of the token to unfreeze.
 * @param {string} unfreezeAccountId - The account ID to unfreeze the token from.
 * @param {string} freezeCredFile - The path to the JSON file containing the private key of the account that froze the token.
 * @param {string} network - The network to transact on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key of the operator account.
 * @throws {Error} If an error occurs while unfreezing the token.
 * @returns {Promise<string>} The status of the transaction, represented as a string.
 */
const unfreezeToken = async (tokenId, unfreezeAccountId, freezeCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenUnfreezeTransaction()
      .setAccountId(unfreezeAccountId)
      .setTokenId(tokenId)
      .freezeWith(operator)

    const freezeCred = cred.readFileJson(freezeCredFile)
    const freezeKey = PrivateKey.fromString(freezeCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(freezeKey);

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenUnfreezeTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Grants KYC for a token on the Hedera network.
 *
 * @function
 * @async
 * @param {string} tokenId - The ID of the token to grant KYC for.
 * @param {string} grantKycAccountId - The account ID to grant KYC for the token to.
 * @param {string} kycCredFile - The path to the JSON file containing the private key of the account that has KYC privileges.
 * @param {string} network - The network to transact on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key of the operator account.
 * @throws {Error} If an error occurs while granting KYC for the token.
 * @returns {Promise<string>} The status of the transaction, represented as a string.
 */
const grantKycToken = async (tokenId, grantKycAccountId, kycCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenGrantKycTransaction()
      .setAccountId(grantKycAccountId)
      .setTokenId(tokenId)
      .freezeWith(operator)

    const kycCred = cred.readFileJson(kycCredFile)
    const kycKey = PrivateKey.fromString(kycCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(kycKey);

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenGrantKycTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Revokes KYC for a token on the Hedera network.
 *
 * @function
 * @async
 * @param {string} tokenId - The ID of the token to revoke KYC for.
 * @param {string} grantKycAccountId - The account ID to revoke KYC for the token from.
 * @param {string} kycCredFile - The path to the JSON file containing the private key of the account that has KYC privileges.
 * @param {string} network - The network to transact on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key of the operator account.
 * @throws {Error} If an error occurs while revoking KYC for the token.
 * @returns {Promise<string>} The status of the transaction, represented as a string.
 */
const revokeKycToken = async (tokenId, grantKycAccountId, kycCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenRevokeKycTransaction()
      .setAccountId(grantKycAccountId)
      .setTokenId(tokenId)
      .freezeWith(operator)

    const kycCred = cred.readFileJson(kycCredFile)
    const kycKey = PrivateKey.fromString(kycCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(kycKey);

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenRevokeKycTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Transfers a specified amount of a token to a receiver account on the Hedera network.
 *
 * @function
 * @async
 * @param {string} tokenId - The ID of the token to transfer.
 * @param {number} amount - The amount of the token to transfer.
 * @param {string} receiverAccntId - The account ID of the receiver.
 * @param {string} network - The network to transact on. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key of the sender.
 * @throws {Error} If an error occurs while transferring the token.
 * @returns {Promise<string>} The status of the transaction, represented as a string.
 */
const transferToken = async (tokenId, amount, receiverAccntId, network, credFile) =>  {
  try {
    const credentials = cred.readFileJson(credFile)
    const accountId  = credentials.accountId
    const privateKey = PrivateKey.fromString(credentials.privateKey)
    const operator   = setOperator(network, credFile)

    const transactionToken = await new TransferTransaction()
      .addTokenTransfer(tokenId, accountId      , -amount)
      .addTokenTransfer(tokenId, receiverAccntId, +amount)
      .freezeWith(operator);
    
    const transactionTokenSigned = await transactionToken.sign(privateKey)
    const transferTransactionResponse = await transactionTokenSigned.execute(operator)

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
 * Deletes a token from the Hedera network.
 *
 * This function deletes a token with the specified ID from the Hedera network. It requires a network
 * client instance with an operator account set. It also requires a JSON file containing the private key
 * for the operator account.
 *
 * @param {string} tokenId - The ID of the token to delete.
 * @param {string} network - The network to use. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the private key for the operator account.
 * @returns {string} The status of the transaction as a string.
 * @throws {Error} If an error occurs while deleting the token.
 */
const deleteToken = async (tokenId, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenDeleteTransaction()
      .setTokenId(tokenId)
      .freezeWith(operator)

    const credentials = cred.readFileJson(credFile)
    const privateKey = PrivateKey.fromString(credentials.privateKey)
    const transactionTokenSigned = await transactionToken.sign(privateKey);

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenDeleteTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Updates a token on the Hedera network.
 *
 * This function updates the properties of a token with the specified ID on the Hedera network. It requires
 * a network client instance with an operator account set. It also requires a JSON file containing the private key
 * for the admin account that is authorized to make updates to the token.
 *
 * @param {string} tokenId - The ID of the token to update.
 * @param {object} tokenCfg - The new configuration for the token. Must contain at least one of the following fields:
 *   - name: The new name for the token.
 *   - symbol: The new symbol for the token.
 *   - treasuryAccount: The ID of the account that will become the new treasury for the token.
 *   - adminKey: The new public key that will be used to sign administrative transactions for the token.
 *   - kycKey: The new public key that will be used to sign KYC transactions for the token.
 *   - freezeKey: The new public key that will be used to sign freeze transactions for the token.
 *   - wipeKey: The new public key that will be used to sign wipe transactions for the token.
 *   - supplyKey: The new public key that will be used to sign supply transactions for the token.
 *   - feeScheduleKey: The new public key that will be used to sign fee schedule transactions for the token.
 *   - pauseKey: The new public key that will be used to sign pause transactions for the token.
 *   - memo: The new memo for the token.
 * @param {string} adminCredFile - The path to the JSON file containing the private key for the admin account.
 * @param {string} network - The network to use. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the private key for the operator account.
 * @returns {object} An object containing the updated token configuration and the status of the transaction.
 * @throws {Error} If an error occurs while updating the token.
 */
const updateToken = async (tokenId, tokenCfg, adminCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const txnToken = await new TokenUpdateTransaction()
      .setTokenId(tokenId)
 
    if (tokenCfg.name           != undefined) txnToken.setTokenName     (tokenCfg.name)
    if (tokenCfg.symbol         != undefined) txnToken.setTokenSymbol   (tokenCfg.symbol)
    if (tokenCfg.treasuryAccount!= undefined) txnToken.setTreasuryAccountId(tokenCfg.treasuryAccount)
    if (tokenCfg.adminKey       != undefined) txnToken.setAdminKey      (PublicKey.fromString(tokenCfg.adminKey      ))
    if (tokenCfg.kycKey         != undefined) txnToken.setKycKey        (PublicKey.fromString(tokenCfg.kycKey        ))
    if (tokenCfg.freezeKey      != undefined) txnToken.setFreezeKey     (PublicKey.fromString(tokenCfg.freezeKey     ))
    if (tokenCfg.wipeKey        != undefined) txnToken.setWipeKey       (PublicKey.fromString(tokenCfg.wipeKey       ))
    if (tokenCfg.supplyKey      != undefined) txnToken.setSupplyKey     (PublicKey.fromString(tokenCfg.supplyKey     ))
    if (tokenCfg.feeScheduleKey != undefined) txnToken.setFeeScheduleKey(PublicKey.fromString(tokenCfg.feeScheduleKey))
    if (tokenCfg.pauseKey       != undefined) txnToken.setPauseKey      (PublicKey.fromString(tokenCfg.pauseKey      ))
    if (tokenCfg.memo           != undefined) txnToken.setTokenMemo     (tokenCfg.memo          )

    txnToken.freezeWith(operator)

    const adminCred = cred.readFileJson(adminCredFile)
    const adminKey = PrivateKey.fromString(adminCred.privateKey)
    const txnTokenSigned = await txnToken.sign(adminKey);

    const transactionResponse = await txnTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus = transactionReceipt.status.toString()
    const newToken = { 
      tokenId : tokenId,
      tokenCfg
    }
 
    const result = {
      newToken,
      transactionStatus
    }
    return result
  }
  catch(error) {
    console.error(`Error! Hedera service TokenUpdateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}


/**
 * Updates the fixed fee schedule for a token on the Hedera network.
 *
 * This function sets a custom fixed fee schedule for a token on the Hedera network,
 * using the specified account ID, amount, and currency. It reads the operator account ID and private key
 * from a JSON file and sets them as the operator account for the specified network. It also reads the
 * private key for the fee collector account from a separate JSON file.
 *
 * @param {string} tokenId - The ID of the token to update the fee schedule for.
 * @param {string} accountId - The ID of the account to collect fees into.
 * @param {number} amount - The amount of the fee in the specified currency.
 * @param {string} feeCurrency - The currency to use for the fee. Must be either "hbar" or the ID of a token on the network.
 * @param {string} feeCredFile - The path to the JSON file containing the private key for the fee collector account.
 * @param {string} network - The network to set the operator for. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key for the operator.
 * @returns {object} An object containing the transaction status.
 * @throws {Error} If an error occurs while updating the fee schedule.
 */
const updateFixedFeeSchedule = async (tokenId, accountId, amount, feeCurency, feeCredFile, network, credFile) => {
  try {

    cl("a0")
    const fee = new CustomFixedFee()
      .setFeeCollectorAccountId(accountId) 


    cl("a1", feeCurency)
    if (feeCurency === "hbar") {
      cl("a1", feeCurency)
      //fee.setHbarAmount(amount)
      cl("a1AOAOAO", feeCurency)
    }
    else {
      fee.setDenominatingTokenId(tokenId) 
      fee.setAmount(amount) 
    }

    cl("a1")
    const operator = setOperator(network, credFile) 

    const txnToken = await new TokenFeeScheduleUpdateTransaction()
     .setTokenId(tokenId)
     .setCustomFees([fee])
     .freezeWith(operator);

    cl("a2")
    const feeCredentials = cred.readFileJson(feeCredFile)
    const feeScheduleKey = PrivateKey.fromString(feeCredentials.privateKey)

    const txnTokenSigned = await txnToken.sign(feeScheduleKey);

    cl("a3")
    const transactionResponse = await txnTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus = transactionReceipt.status.toString()

    const result = {
      transactionStatus
    }
    return result
  }
  catch(error) {
    console.error(`Error! Hedera service TokenFeeScheduleUpdateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Updates the fractional fee schedule for a token on the Hedera network.
 *
 * This function sets a custom fractional fee schedule for a token on the Hedera network,
 * using the specified account ID, numerator, denominator, and fee limits. It reads the operator account ID and private key
 * from a JSON file and sets them as the operator account for the specified network. It also reads the
 * private key for the fee collector account from a separate JSON file.
 *
 * @param {string} tokenId - The ID of the token to update the fee schedule for.
 * @param {string} accountId - The ID of the account to collect fees into.
 * @param {number} numerator - The numerator of the fee fraction.
 * @param {number} denominator - The denominator of the fee fraction.
 * @param {number} maxFee - The maximum amount of the fee.
 * @param {number} minFee - The minimum amount of the fee.
 * @param {string} feeCredFile - The path to the JSON file containing the private key for the fee collector account.
 * @param {string} network - The network to set the operator for. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key for the operator.
 * @returns {object} An object containing the transaction status.
 * @throws {Error} If an error occurs while updating the fee schedule.
 */
const updateFractionalFeeSchedule = async (tokenId, accountId, numerator, denominator, maxFee, minFee, feeCredFile, network, credFile) => {
  try {

    const fee = new CustomFractionalFee()
      .setNumerator(numerator) 
      .setDenominator(denominator) 
      .setMax(maxFee)
      .setMin(minFee)
      .setFeeCollectorAccountId(accountId)

    const operator = setOperator(network, credFile) 

    const txnToken = await new TokenFeeScheduleUpdateTransaction()
     .setTokenId(tokenId)
     .setCustomFees([fee])
     .freezeWith(operator);

    const feeCredentials = cred.readFileJson(feeCredFile)
    const feeScheduleKey = PrivateKey.fromString(feeCredentials.privateKey)

    const txnTokenSigned = await txnToken.sign(feeScheduleKey);

    const transactionResponse = await txnTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus = transactionReceipt.status.toString()

    const result = {
      transactionStatus
    }
    return result
  }
  catch(error) {
    console.error(`Error! Hedera service TokenFeeScheduleUpdateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

/**
 * Retrieves information about a token on the Hedera network.
 *
 * This function retrieves information about a token on the Hedera network, using the specified token ID.
 * It reads the operator account ID and private key from a JSON file and sets them as the operator account
 * for the specified network.
 *
 * @param {string} tokenId - The ID of the token to retrieve information for.
 * @param {string} network - The network to set the operator for. Must be either "main" or "test".
 * @param {string} credFile - The path to the JSON file containing the account ID and private key for the operator.
 * @returns {Promise<TokenInfo>} A promise that resolves to a TokenInfo object containing information about the token.
 * @throws {Error} If an error occurs while retrieving the token information.
 */
const getTokenInfo = async (tokenId, network, credFile) => {
  try {
    const operator = setOperator(network, credFile)

    const tokenInfo = new TokenInfoQuery()
      .setTokenId(tokenId)
      .execute(operator)

    return tokenInfo 
  }
  catch(error) {
    console.error(`Error! Hedera service TokenInfoQuery failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}



exports.createToken     = createToken
exports.getTokenBalance = getTokenBalance
exports.mintToken       = mintToken
exports.burnToken       = burnToken
exports.wipeToken       = wipeToken
exports.pauseToken      = pauseToken
exports.unpauseToken    = unpauseToken
exports.associateToken  = associateToken
exports.dissociateToken = dissociateToken
exports.freezeToken     = freezeToken
exports.unfreezeToken   = unfreezeToken
exports.grantKycToken   = grantKycToken 
exports.revokeKycToken  = revokeKycToken 
exports.transferToken   = transferToken
exports.deleteToken     = deleteToken
exports.updateToken     = updateToken 
exports.getTokenInfo    = getTokenInfo 
exports.updateFixedFeeSchedule      = updateFixedFeeSchedule
exports.updateFractionalFeeSchedule = updateFractionalFeeSchedule
/*
exports.updateToken    = updateToken
*/


