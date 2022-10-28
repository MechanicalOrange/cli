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

const { Client, PrivateKey, AccountBalanceQuery, TokenGrantKycTransaction, TokenRevokeKycTransaction, TransferTransaction, TokenAssociateTransaction, TokenDissociateTransaction, TokenCreateTransaction, TokenUpdateTransaction, TokenDeleteTransaction, TokenInfoQuery, TokenMintTransaction, TokenBurnTransaction, TokenWipeTransaction, TokenPauseTransaction, TokenUnpauseTransaction, TokenFreezeTransaction, TokenUnfreezeTransaction, TokenType, TokenSupplyType } = require("@hashgraph/sdk")

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


const createToken = async (tokenCfg, network, credFile) => {
  try {

    const txnToken = await new TokenCreateTransaction()
      .setTokenName(tokenCfg.name)
      .setTokenSymbol(tokenCfg.symbol)
      .setTreasuryAccountId(tokenCfg.treasuryAccount)
 
    if (tokenCfg.tokenType      != undefined) {
      if (tokenCfg.tokenType === "NonFungibleUnique") txnToken.setTokenType(TokenType.NonFungibleUnique)
      if (tokenCfg.tokenType === "FungibleCommon") txnToken.setTokenType(TokenType.FungibleCommon)
    }
    
    if (tokenCfg.decimal        != undefined) txnToken.setDecimals      (tokenCfg.decimals      )
    if (tokenCfg.initialSupply  != undefined) txnToken.setInitialSupply (tokenCfg.initialSupply )
    if (tokenCfg.adminKey       != undefined) txnToken.setAdminKey      (PrivateKey.fromString(tokenCfg.adminKey      ))
    if (tokenCfg.kycKey         != undefined) txnToken.setKycKey        (PrivateKey.fromString(tokenCfg.kycKey        ))
    if (tokenCfg.freezeKey      != undefined) txnToken.setFreezeKey     (PrivateKey.fromString(tokenCfg.freezeKey     ))
    if (tokenCfg.wipeKey        != undefined) txnToken.setWipeKey       (PrivateKey.fromString(tokenCfg.wipeKey       ))
    if (tokenCfg.supplyKey      != undefined) txnToken.setSupplyKey     (PrivateKey.fromString(tokenCfg.supplyKey     ))
    if (tokenCfg.feeScheduleKey != undefined) txnToken.setFeeScheduleKey(PrivateKey.fromString(tokenCfg.feeScheduleKey))
    if (tokenCfg.pauseKey       != undefined) txnToken.setPauseKey      (PrivateKey.fromString(tokenCfg.pauseKey      ))
    if (tokenCfg.customFee      != undefined) txnToken.setCustomFees    (tokenCfg.customFees    )
    if (tokenCfg.maxSupply      != undefined) txnToken.setMaxSupply     (tokenCfg.maxSupply     )
    if (tokenCfg.supplyType     != undefined) {
      if (tokenCfg.supplyType === "Finite") txnToken.setSupplyType(TokenSupplyType.Finite)
      if (tokenCfg.supplyType === "Infinite") txnToken.setSupplyType(TokenSupplyType.Infinite)
    }
    if (tokenCfg.freezeDefault  != undefined) txnToken.setFreezeDefault (tokenCfg.freezeDefault )
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

const wipeToken = async (wipedAccountId, amount, tokenId, wipeCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    const transactionToken = await new TokenWipeTransaction()
      .setAccountId(wipedAccountId)
      .setTokenId(tokenId)
      .setAmount(amount)
      .freezeWith(operator)

    console.log("a0")
    const wipeCred = cred.readFileJson(wipeCredFile)
    const wipeKey = PrivateKey.fromString(wipeCred.privateKey)
    const credentials = cred.readFileJson(credFile)
    const privateKey = PrivateKey.fromString(credentials.privateKey)

    console.log("a1")
    const transactionTokenSigned = await (await transactionToken.sign(privateKey)).sign(wipeKey)

    const transactionResponse = await transactionTokenSigned.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)
    const transactionStatus   = transactionReceipt.status.toString();
    console.log("a2")

    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TokenBurnTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

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

const associateToken = async (tokenId, network, credFile) => {
  try {
    console.log("a0")
    const operator = setOperator(network, credFile) 
    const credentials = cred.readFileJson(credFile)
    const accountId  = credentials.accountId
    const privateKey = PrivateKey.fromString(credentials.privateKey)

    console.log("a1")

    const transactionToken = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId])
      .freezeWith(operator)

    console.log("a2")
    const transactionTokenSigned = await transactionToken.sign(privateKey);

    console.log("a3")
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

const dissociateToken = async (tokenId, network, credFile) => {
  try {
    console.log("a0")
    const operator = setOperator(network, credFile) 
    const credentials = cred.readFileJson(credFile)
    const accountId  = credentials.accountId
    const privateKey = PrivateKey.fromString(credentials.privateKey)

    console.log("a1")

    const transactionToken = await new TokenDissociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId])
      .freezeWith(operator)

    console.log("a2")
    const transactionTokenSigned = await transactionToken.sign(privateKey);

    console.log("a3")
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

const freezeToken = async (tokenId, unfreezeAccountId, freezeCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 
    console.log("a0")

    const transactionToken = await new TokenFreezeTransaction()
      .setAccountId(unfreezeAccountId)
      .setTokenId(tokenId)
      .freezeWith(operator)

    console.log("a1")
    const freezeCred = cred.readFileJson(freezeCredFile)
    const freezeKey = PrivateKey.fromString(freezeCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(freezeKey);

    console.log("a2")
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

const unfreezeToken = async (tokenId, unfreezeAccountId, freezeCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 
    console.log("a0")

    const transactionToken = await new TokenUnfreezeTransaction()
      .setAccountId(unfreezeAccountId)
      .setTokenId(tokenId)
      .freezeWith(operator)

    console.log("a1")
    const freezeCred = cred.readFileJson(freezeCredFile)
    const freezeKey = PrivateKey.fromString(freezeCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(freezeKey);

    console.log("a2")
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

const grantKycToken = async (tokenId, grantKycAccountId, kycCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 
    console.log("a0")

    const transactionToken = await new TokenGrantKycTransaction()
      .setAccountId(grantKycAccountId)
      .setTokenId(tokenId)
      .freezeWith(operator)

    console.log("a1")
    const kycCred = cred.readFileJson(kycCredFile)
    const kycKey = PrivateKey.fromString(kycCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(kycKey);

    console.log("a2")
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

const revokeKycToken = async (tokenId, grantKycAccountId, kycCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 
    console.log("a0")

    const transactionToken = await new TokenRevokeKycTransaction()
      .setAccountId(grantKycAccountId)
      .setTokenId(tokenId)
      .freezeWith(operator)

    console.log("a1")
    const kycCred = cred.readFileJson(kycCredFile)
    const kycKey = PrivateKey.fromString(kycCred.privateKey)
    const transactionTokenSigned = await transactionToken.sign(kycKey);

    console.log("a2")
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
    console.log("a4")
    const transferTransactionResponse = await transactionTokenSigned.execute(operator)

    const transactionReceipt = await transferTransactionResponse.getReceipt(operator)
    const transactionStatus = transactionReceipt.status.toString()
    console.log("a5")
    return transactionStatus
  }
  catch(error) {
    console.error(`Error! Hedera service TransferTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}


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


/*
const updateToken = async (tokenId, memo, adminCredFile, submitCredFile, network, credFile) => {
  try {
    const operator = setOperator(network, credFile) 

    let adminAccountId  = "none" 
    let submitAccountId = "none" 

    const credentials = cred.readFileJson(credFile)
    const privateKey = PrivateKey.fromString(credentials.privateKey)

    const transactionToken = await new TokenUpdateTransaction()
      .setTokenId(tokenId)

    if (memo !== null) {
      transactionToken.setTokenMemo(memo)
    }

    if (adminCredFile !== null) {
      const adminCredentials = cred.readFileJson(adminCredFile)
      adminAccountId  = adminCredentials.accountId 
      const adminKey  = PrivateKey.fromString(adminCredentials.privateKey)
      transactionToken.setAdminKey(adminKey)
    }
    
    if (submitCredFile !== null) {
      const submitCredentials = cred.readFileJson(submitCredFile)
      submitAccountId  = submitCredentials.accountId 
      const submitKey = PrivateKey.fromString(submitCredentials.privateKey)
      transactionToken.setSubmitKey(submitKey)
    }

    await transactionToken.freezeWith(operator)

    let signedTransaction = await transactionToken.sign(privateKey);

    if (adminCredFile !== null) {
      const adminCredentials = cred.readFileJson(adminCredFile)
      const adminKey  = PrivateKey.fromString(adminCredentials.privateKey)
      signedTransaction = await transactionToken.sign(adminKey);
    }
    const transactionResponse = await signedTransaction.execute(operator)
    const transactionReceipt  = await transactionResponse.getReceipt(operator)

    const transactionStatus = transactionReceipt.status.toString()

    const updatedToken = 
      { tokenId            : tokenId,
        accountId4AdminKey : adminAccountId ,
        accountId4SubmitKey: submitAccountId 
      }

    const result = {
      updatedToken,
      transactionStatus
    }
    return result
  }
  catch(error) {
    console.error(`Error! Hedera service TokenUpdateTransaction failed with error status ${error.status.toString()}!`)
    process.exit(1)
  }
}

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
exports.getTokenInfo    = getTokenInfo 
/*
exports.updateToken    = updateToken
*/


