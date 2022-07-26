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



const writeFileJson = (obj, path) => {
  try {
    fs.writeFileSync(path, JSON.stringify(obj, null, 2), 'utf8');

    //console.log(`Data successfully saved to disk at ${path}`);
  } catch (error) {
    console.log('An error has occurred ', error);
  }
}

const readFileJson = (path) => {
  try {
    const data = fs.readFileSync(path);
    //console.log(JSON.parse(data));
    //console.log(`Data successfully read from ${path}`);
    return JSON.parse(data)
  } catch (error) {
    console.log('An error has occurred ', error);
  }
}



exports.writeFileJson       = writeFileJson 
exports.readFileJson        = readFileJson 



