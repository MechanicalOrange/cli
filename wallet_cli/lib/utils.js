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



function accntParseString(value) {
  const words = value.split('.')
  if (words.length !== 3) {
    throw new program.InvalidArgumentError(`Account cannot have more than 3 fields or it is not of the form x.y.z`)
  }
  for (word in words) {
    const num = parseInt(words[0])
    if (isNaN(num)) {
      throw new program.InvalidArgumentError('The field is not a number. The account must be of form x.y.z, where x,y,z are numbers.')
    }
  }
  return value
}

function assocParseInt(value) {
  const parsedValue = parseInt(value, 10)
  if (isNaN(parsedValue)) {
    throw new program.InvalidArgumentError('Not a number.')
  }
  else if( parsedValue < 0) {
    throw new program.InvalidArgumentError('Negative number. It must be positive.')
  }
  else if( parsedValue > 1000) {
    const kMaxAssociations = 1000
    throw new program.InvalidArgumentError(`Too big. up to ${kMaxAssociations} are allowed.`)
  }
  return parsedValue
}

function hbarParseFloat(value) {
  const parsedValue = parseFloat(value)
  if (isNaN(parsedValue)) {
    throw new program.InvalidArgumentError('Not a number.')
  }
  else if( parsedValue < 0) {
    throw new program.InvalidArgumentError('Negative number. It must be positive.')
  }
  return parsedValue
}

function memoParseString(value) {
  const kMaxMemoLengh    = 100 
  if (value.length > kMaxMemoLengh) {
    throw new program.InvalidArgumentError(`Memo cannot be more than ${kMaxMemoLengh} chars.`)
  }
  return value
}


exports.accntParseString = accntParseString
exports.assocParseInt    = assocParseInt   
exports.hbarParseFloat   = hbarParseFloat  
exports.memoParseString  = memoParseString 



