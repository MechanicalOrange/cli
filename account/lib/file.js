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

const fs   = require('fs')
const os   = require('os')
const path = require('path')


const writeFileAccount = (account) => {
  const filePath = path.resolve(os.homedir(), account.accountId)
  
  let accountInfo = "ACCOUNT_ID="  + account.accountId  +"\n"
  accountInfo    += "PUBLIC_KEY="  + account.publicKey  +"\n"
  accountInfo    += "PRIVATE_KEY=" + account.privateKey +"\n"

  fs.writeFileSync(filePath, accountInfo, error => {
    if (error) {
      console.log(error)
      process.exit(1)
    }
  })
  console.log(`The new account id and keys were successfully saved in ${filePath}`)
  console.log("Please keep this file safe!")
}

const writeFileMnemonic = (account, mnemonic) => {
  const filePath = path.resolve(os.homedir(), account.accountId + ".mnm")
  
  let mnemoAll = mnemonic.words + "\n" + mnemonic.index
  fs.writeFileSync(filePath, mnemoAll, error => {
    if (error) {
      console.log(error)
      process.exit(1)
    }
  })
  console.log(`The new mnemonics were successfully saved in ${filePath}`)
  console.log("Please keep this file safe!")
}

const readFileMnemonic = (pathMnemonicFile) => {
  const allFileContents = fs.readFileSync(pathMnemonicFile, 'utf-8');
  let mnemonic = allFileContents.split(/\r?\n/)
  let mnemonicAsArray = mnemonic[0].split(/\s/)
  if (mnemonicAsArray.length !== 24) {
    console.error("ERROR! The mnemonic file must have 24 words separated by spaces in one line!")
    console.log(mnemonicAsArray)
    process.exit(1)
  }
  const mnemonicInfo = {
    words: mnemonic[0],
    index: mnemonic[1]
  }
  return mnemonicInfo
}

exports.writeFileAccount    = writeFileAccount
exports.writeFileMnemonic   = writeFileMnemonic
exports.readFileMnemonic    = readFileMnemonic 


