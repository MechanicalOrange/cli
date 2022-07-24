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


const { Client, PrivateKey, AccountCreateTransaction, AccountInfoQuery, AccountBalanceQuery, TransferTransaction, Hbar} = require("@hashgraph/sdk");

require("dotenv").config();


function setOperator(network) {
    //Grab your Hedera testnet account ID and private key from your .env file
    const accountId = process.env.ACCOUNT_ID;
    const privateKey = process.env.PRIVATE_KEY;

    // If we weren't able to grab it, we should throw a new error
    if (accountId == null || privateKey == null ) {
        throw new Error("Environment variables accountId and privateKey must be present");
    }

    let client = null;
    if (network === "main") {
      client = Client.forMainnet();
    }
    else if (network === "test") {
      client = Client.forTestnet();
    }
    client.setOperator(accountId, privateKey);
    return client;
}

const createAccount = async (hbarAmount, memo, maxAssoc, maxFee, network) => {
  //console.log(typeof(PrivateKey))
  const client = setOperator(network); 
  
  const privateKey = await PrivateKey.generate();
  // console.log("privateKey =", privateKey);
  // console.log("publicKey =", privateKey.publicKey);
  // 100 milions of tinibars is one hbar, everything else is as expected
  const transactionResponse = await new AccountCreateTransaction()
      .setKey(privateKey.publicKey)
      .setMaxTransactionFee(new Hbar(maxFee))
      .setInitialBalance(new Hbar(hbarAmount)) // value in hbars
      .setAccountMemo(memo)
      .setMaxAutomaticTokenAssociations(maxAssoc)
      .execute(client);
  
  const transactionReceipt = await transactionResponse.getReceipt(client);
  const newAccountId = transactionReceipt.accountId;
  //console.log("receipt =", transactionReceipt);
  //console.log("accountId =", newAccountId);
  
  const newAccountIdAsString = `${newAccountId.shard}.${newAccountId.realm}.${newAccountId.num}`
  // const publicKeyAsString  = toHexString(privateKey.publicKey._keyData)
  // const privateKeyAsString = toHexString(privateKey._chainCode)
  const publicKeyAsString  = privateKey.publicKey.toString()
  const privateKeyAsString = privateKey.toString()
  
  const newAccount = {
    accountId        : newAccountIdAsString,
    balance          : hbarAmount          ,
    publicKey        : publicKeyAsString   , 
    ED25519PublicKey : privateKey.publicKey,
    privateKey       : privateKeyAsString  ,
    ED25519PrivateKey: privateKey
  }
  //console.log("acc", newAccountIdAsString)
  //console.log("pub", publicKeyAsString  )
  //console.log("prv", privateKeyAsString )
  
  return newAccount
}

const getAccountInfo = async (accountId, network) => {

  const client = setOperator(network);

  const query = new AccountInfoQuery().setAccountId(accountId);
  const accountInfo = await query.execute(client);

  //Print the account info to the console
  //console.log("=========================================");
  //console.log(accountInfo);
  //console.log("=========================================");
  return accountInfo;
}

const getAccountBalance = async (accountId, network) => {
    const client = setOperator(network);
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);
    
    //const tinyBarsInAccount = accountBalance.hbars.toTinybars();
    //console.log("The new account balance is: " + tinyBarsInAccount + " tinybar.");
    //const account = {
    //  balance: tinyBarsInAccount,
    //  id     : accountId
    //}
    return accountBalance.hbars.toBigNumber();
}


const transferCrypto = async (receiverAccntId, amountHbar, network) =>  {
    const accountId = process.env.ACCOUNT_ID;
    const client = setOperator(network);
    const transferTransactionResponse = await new TransferTransaction()
      .addHbarTransfer(accountId  , new Hbar(-amountHbar))
      .addHbarTransfer(receiverAccntId, new Hbar(+amountHbar))
      .execute(client);
  
  //Verify the transaction reached consensus
  const transactionReceipt = await transferTransactionResponse.getReceipt(client);
  //console.log(`The transfer of ${amountHbar} to account ${receiverAccntId} was ${transactionReceipt.status.toString()}`);
  return transactionReceipt.status.toString() 

}


exports.setOperator       = setOperator;
exports.createAccount     = createAccount;
exports.getAccountInfo    = getAccountInfo;
exports.getAccountBalance = getAccountBalance;
exports.transferCrypto    = transferCrypto;

