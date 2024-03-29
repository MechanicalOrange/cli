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
 * Prints information about a topic to the console.
 *
 * This function takes an object containing information about a topic and prints the various fields of the object to the console. The fields that are printed include the topicId, adminKey, submitKey, sequenceNumber, memo and network.
 *
 * @param topicInfo An object containing information about a topic.
 * @return void
 */
const printTopicInfo = (topicInfo) => {
  //console.log(topicInfo)
  console.log("topicId:", topicInfo.topicId.toString())
  console.log("adminKey:", topicInfo.adminKey == null ? "none" : topicInfo.adminKey.toString())
  console.log("submitKey:", topicInfo.submitKey == null ? "none" : topicInfo.submitKey.toString())
  console.log("sequenceNumber:", topicInfo.sequenceNumber.toString())
  //console.log("runningHash:", topicInfo.runningHash.toString())
  console.log("memo:", topicInfo.topicMemo)
  console.log("network:", topicInfo.ledgerId.toString())
}

exports.printTopicInfo     = printTopicInfo 



