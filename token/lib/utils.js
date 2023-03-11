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



const printTokenInfo = (tokenInfo) => {
  // TODO FIXME
  //console.log(JSON.stringify(tokenInfo, null, 4))
  console.log("==========================================")

  if (tokenInfo.tokenId            !== null) console.log("TokenId:                ", tokenInfo.tokenId.toString())
  if (tokenInfo.name               !== null) console.log("Token Name:             ", tokenInfo.name)
  if (tokenInfo.symbol             !== null) console.log("Token Symbol:           ", tokenInfo.symbol)
  if (tokenInfo.decimals           !== null) console.log("Token Decimals:         ", tokenInfo.decimals)
  if (tokenInfo.totalSupply        !== null) console.log("Token total supply:     ", tokenInfo.totalSupply.toInt())
  if (tokenInfo.maxSupply          !== null) console.log("Token max supply:       ", tokenInfo.maxSupply.toInt())
  if (tokenInfo.treasuryAccountId  !== null) console.log("Treasury account Id:    ", tokenInfo.treasuryAccountId.toString())
  if (tokenInfo.adminKey           !== null) console.log("Admin public Key:       ", tokenInfo.adminKey.toString())
  if (tokenInfo.kycKey             !== null) console.log("Kyc public Key:         ", tokenInfo.kycKey.toString())
  if (tokenInfo.freezeKey          !== null) console.log("Freeze public Key:      ", tokenInfo.freezeKey.toString())
  if (tokenInfo.wipeKey            !== null) console.log("Wipe public Key:        ", tokenInfo.wipeKey.toString())
  if (tokenInfo.supplyKey          !== null) console.log("Supply public Key:      ", tokenInfo.supplyKey.toString())
  if (tokenInfo.pauseKey           !== null) console.log("Pause public Key:       ", tokenInfo.pauseKey.toString())
  if (tokenInfo.feeScheduleKey     !== null) console.log("Fee Schedule public Key:", tokenInfo.feeScheduleKey.toString())
  if (tokenInfo.defaultFreezeStatus!== null) console.log("Default freeze status:  ", tokenInfo.defaultFreezeStatus)
  if (tokenInfo.defaultKycStatus   !== null) console.log("Default Kyc status:     ", tokenInfo.defaultKycStatus)
  if (tokenInfo.pauseStatus        !== null) console.log("Pause status:           ", tokenInfo.pauseStatus)
  if (tokenInfo.isDeleted          !== null) console.log("Is Token deleted:       ", tokenInfo.isDeleted)
  if (tokenInfo.autoRenewAccountId !== null) console.log("Auto renew account ID:  ", tokenInfo.autoRenewAccountId.toString())
  if (tokenInfo.autoRenewPeriod    !== null) console.log("Auto renew periond seconds:", tokenInfo.autoRenewPeriod.seconds.toInt())
  if (tokenInfo.expirationTime     !== null) console.log("Expiration time:        ", tokenInfo.expirationTime.toString())
  if (tokenInfo.tokenMemo          !== null) console.log("Token memo:             ", tokenInfo.tokenMemo.toString())
  if (tokenInfo.tokenType          !== null) console.log("Token type:             ", tokenInfo.tokenType.toString())
  if (tokenInfo.supplyType         !== null) console.log("Token supply type:      ", tokenInfo.supplyType.toString())
}

const checkTokenConfig = (configJsonFile) => {
  const cred = require('../../common/credentials')
  const cfg = cred.readFileJson(configJsonFile)
  // TODO: check if the fields are compatible
  //console.log(cfg)
  return cfg
}


exports.printTokenInfo     = printTokenInfo 
exports.checkTokenConfig   = checkTokenConfig



