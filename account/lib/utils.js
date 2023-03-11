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


/**
 * Prints information about an account to the console.
 *
 * This function takes an object containing information about an account and prints the various fields of the object to the console. The fields that are printed include the account ID, public key, balance, live hashes, tokens, NFTs, memo, expiration time, proxy stake, network, Ethereum nonce, and staking information.
 *
 * @param accountInfo An object containing information about an account.
 * @return void
 */
const printAccountInfo = (accountInfo) => {
//  console.log(accountInfo)
  console.log("The account ID of the account the information was requested for: ", accountInfo.accountId.toString())
  console.log("The account ID in Solidity format:", accountInfo.contractAccountId.toString())
  console.log("The account is", accountInfo.isDeleted ? "deleted": "active")
  console.log("The public key of the account:", accountInfo.key.toString())
  console.log("The current balance of hbars on the account:", accountInfo.balance.toString()) 
  console.log("The signature of this account is", accountInfo.isReceiverSignatureRequired ? "": "not" , "required for other accounts to transfer to it.")  
  console.log("All of the livehashes attached to the account:", accountInfo.liveHashes)  
  //console.log("All tokens related to this account:", accountInfo.tokenRelationships.toString())  
  // this will become obsolete
  console.log("All tokens related to this account:")  
  for (const key of accountInfo.tokenRelationships.keys()) {
    console.log(`TokenID: ${key}`)
  }
  console.log("The number of NFTs owned by the specified account:", accountInfo.ownedNfts.toString())  
  console.log("The total number of auto token associations that are specified for this account:", accountInfo.maxAutomaticTokenAssociations.toString())    
  console.log("The memo of the account:", accountInfo.accountMemo) 
  console.log("The account's expiration time in seconds:", accountInfo.expirationTime.toString())  
  console.log("The total number of tinybars proxy staked to this account:", accountInfo.proxyReceived.toString())     
  console.log("The Account ID of the account to which this account is proxy staked. If proxyAccountID is null, or is an invalid account, or is an account that isn't a node, then this account is automatically proxy staked to a node chosen by the network, but without earning payments:", accountInfo.proxyAccountId)    
//console.log("The duration at which the account is charged to renew:", accountInfo.autoRenewPeriod)
  console.log("The ID of the network the response came from:", accountInfo.ledgerId.toString())
  console.log("The Ethereum transaction nonce associated with this account:", accountInfo.ethereumNonce.toString())   
  console.log("Staking metadata for an account. This includes staking period start, pending reward, accounts staked to this account, and the account ID or node ID. Reference HIP-406:", accountInfo.stakingInfo.toString())   
}


/**
 * Prints staking information about an account to the console.
 *
 * This function takes an object containing information about an account and prints the fields related to staking information to the console. The fields that are printed include the proxy account ID and staking info.
 *
 * @param accountInfo An object containing information about an account.
 * @return void
 */
const printAccountStakingInfo = (accountInfo) => {
  console.log("The Account ID of the account to which this account is proxy staked. If proxyAccountID is null, or is an invalid account, or is an account that isn't a node, then this account is automatically proxy staked to a node chosen by the network, but without earning payments:", accountInfo.proxyAccountId)    
  console.log("Staking metadata for an account. This includes staking period start, pending reward, accounts staked to this account, and the account ID or node ID. Reference HIP-406:", accountInfo.stakingInfo.toString())   
}


exports.printAccountInfo        = printAccountInfo
exports.printAccountStakingInfo = printAccountStakingInfo



