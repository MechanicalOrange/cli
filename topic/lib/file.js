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
const cred = require('../../common/credentials')


/**
 * Writes a topic object to a file.
 *
 * This function takes a topic object and writes it to a file in JSON format. The file is saved in the user's home directory with the name of the topic's topicId. It also logs a message to the console to indicate that the file has been saved and encourages the user to keep the file safe.
 *
 * @param topic An object containing information about the topic.
 * @return void
 */
const writeFileTopic = (topic) => {
  const filePath = path.resolve(os.homedir(), topic.topicId)
  cred.writeFileJson(topic, filePath)
  
  console.log(`The new topic id and admin account  were successfully saved in ${filePath}`)
  console.log("Please keep this file safe!")
}

/**
 * Transforms a file into a message.
 *
 * This function takes a file path as an input, it reads the contents of the file and returns it as a string. It checks the file size is less than 1024 bytes, if not it throws an error and the process exits with code 1. If the file does not exist, it throws an error and the process exits with code 1
 *
 * @param filePath A string representing the path of the file to be read.
 * @return {string} The file content as string
 */
const transformFileIntoMessage = (filePath) => {

  try {
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size 

    const HEDERA_TOPIC_SIZE = 1024
    if (fileSizeInBytes > HEDERA_TOPIC_SIZE) {
      console.error(`Error! The ${filePath} has more than ${HEDERA_TOPIC_SIZE} bytes!`)
      process.exit(1)
    }

    const buffer = fs.readFileSync(filePath, 'utf8')
    const fileContent = buffer.toString()
    console.log(`The ${filePath} was successfully read!`)

    return fileContent

  } catch (err) {
    console.error(`Error! The ${filePath} does not exist!`)
    process.exit(1)
  }
}

/**
 * Generates a sha3-256 hash for a file.
 *
 * This function takes a file path as input, reads the contents of the file and generates a sha3-256 hash of the file contents.
 * It logs a message to the console to indicate that the hash is being computed and another message to indicate that the hash has been computed. If the file does not exist, it throws an error and the process exits with code 1
 *
 * @param filePath A string representing the path of the file to be hashed.
 * @return {string} The sha3-256 hash of the file content as hexadecimal string
 */
const generateSHA256Hash = (filePath) => {
 // Install and run at command line sha3-256 
 //  sudo apt install libdigest-sha3-perl
 //  sha3sum -a 256 ~/test.txt
  const crypto = require('crypto')

  console.log("Computing the sha3-256 signature...")
  let shaSignature = null
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const hashSum = crypto.createHash('sha3-256')
    hashSum.update(fileBuffer)
    shaSignature = hashSum.digest('hex')
  } catch (err) {
    console.error(`Error! The ${filePath} does not exist!`)
    process.exit(1)
  }
  console.log("The sha3-256 signature is computed!")
  return shaSignature
}

exports.writeFileTopic           = writeFileTopic
exports.transformFileIntoMessage = transformFileIntoMessage 
exports.generateSHA256Hash       = generateSHA256Hash 


