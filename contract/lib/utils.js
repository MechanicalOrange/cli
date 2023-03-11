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


const printContractInfo = (contractInfo) => {
//  console.log(contractInfo)
  console.log("The account ID of the contract the information was requested for: ", contractInfo.accountId.toString())
  console.log("The contract ID of the contract the information was requested for: ", contractInfo.contractId.toString())
  console.log("The account ID in Solidity format:", contractInfo.contractAccountId.toString())
  console.log("The account is", contractInfo.isDeleted ? "deleted": "active")
  console.log("The adminKey of the contract:", contractInfo.adminKey.toString())
  console.log("The current balance of hbars on the account:", contractInfo.balance.toString()) 
  console.log("The memo of the account:", contractInfo.contractMemo) 
  console.log("The account's expiration time in seconds:", contractInfo.expirationTime.toString())  
console.log("The duration in seconds at which the account is charged to renew:", contractInfo.autoRenewPeriod.seconds.toNumber())
  console.log("The ID of the network the response came from:", contractInfo.ledgerId.toString())
  console.log("Staking metadata for an account. This includes staking period start, pending reward, accounts staked to this account, and the account ID or node ID. Reference HIP-406:", contractInfo.stakingInfo.toString())   
}


const printAccountStakingInfo = (contractInfo) => {
  console.log("The Account ID of the account to which this account is proxy staked. If proxyAccountID is null, or is an invalid account, or is an account that isn't a node, then this account is automatically proxy staked to a node chosen by the network, but without earning payments:", contractInfo.proxyAccountId)    
  console.log("Staking metadata for an account. This includes staking period start, pending reward, accounts staked to this account, and the account ID or node ID. Reference HIP-406:", contractInfo.stakingInfo.toString())   
}


const checkContractConfig = (configJsonFile) => {
  const cred = require('../../common/credentials')
  const cfg = cred.readFileJson(configJsonFile)
  // TODO: check if the fields are compatible
  //console.log(cfg)
  return cfg
}

exports.printContractInfo        = printContractInfo
exports.printAccountStakingInfo = printAccountStakingInfo
exports.checkContractConfig     = checkContractConfig 



