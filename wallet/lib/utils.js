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


const accntParseString = (value) => {
  const words = value.split('.')
  if (words.length !== 3) {
    console.error("Error! Account cannot have more than 3 fields or it is not of the form x.y.z")
    process.exit(1)
  }

  for (word of words) {
    if (!/^[0-9]+$/.test(word)) {
      console.error(`The field ${word} is not a number. The account must be of form x.y.z, where x,y,z are numbers.`)
      process.exit(1)
    }
  }
  return value
}

const memoParseString = (value) => {
  const kMaxMemoLengh    = 100 
  if (value.length > kMaxMemoLengh) {
    console.error(`Error! Memo cannot be more than ${kMaxMemoLengh} chars.`)
    process.exit(1)
  }
  return value
}

const assocParseInt = (value) => {
  const parsedValue = parseInt(value, 10)
  if (isNaN(parsedValue)) {
    console.error("Error! Not a number ")
    process.exit(1)
  }
  else if( parsedValue < 0) {
    console.error("Error! It must be a positive number ")
    process.exit(1)
  }
  else if( parsedValue > 1000) {
    const kMaxAssociations = 1000
    console.error(`Error! Maximum number of token associations  is ${kMaxAssociations}!`)
    process.exit(1)
  }
  return parsedValue
}

const hbarParseFloat = (value) => {
  const parsedValue = parseFloat(value)
  if (isNaN(parsedValue)) {
    console.error("Error! Not a number ")
    process.exit(1)
  }
  else if( parsedValue < 0) {
    console.error("Error! It must be a positive number ")
    process.exit(1)
  }
  return parsedValue
}



exports.accntParseString = accntParseString
exports.assocParseInt    = assocParseInt   
exports.hbarParseFloat   = hbarParseFloat  
exports.memoParseString  = memoParseString 


