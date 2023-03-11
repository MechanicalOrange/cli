22/*
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


const { ContractFunctionParameters} = require("@hashgraph/sdk");

"use strict"

const cl = console.log


const buildContractParams = (userInputsAsString, abiInputs) => {
  debugger
  const solParam =  new ContractFunctionParameters()
  if (abiInputs.length > 0 && userInputsAsString === undefined) {
      console.error(`ERROR! Expected ${abiInputs.length} arguments but got no arguments. Please use the --user-inputs option.`)
      process.exit(1)
  }
  if (abiInputs.length > 0) {
    let userInputs = userInputsAsString.split(",")  
    if (userInputs.length !== abiInputs.length) {
      console.error(`ERROR! Expected ${abiInputs.length} arguments but got ${userInputs.length} arguments`)
      process.exit(1)
    }

    for (let i = 0; i < abiInputs.length; i++) { 
      switch(abiInputs[i].type) {
        case 'string'         : { solParam.addString (userInputs[i]); break }
        case 'bytes'          : { solParam.addBytes  (userInputs[i]); break }  
        case 'bytes32'        : { solParam.addBytes32(userInputs[i]); break }
        case 'bool'           : { solParam.addBool   (userInputs[i]); break }
        case 'address'        : { solParam.addAddress(userInputs[i]); break }
        case 'uint8'          : { solParam.addUint8  (userInputs[i]); break }
        case 'uint16'         : { solParam.addUint16 (userInputs[i]); break }
        case 'uint24'         : { solParam.addUint24 (userInputs[i]); break }
        case 'uint32'         : { solParam.addUint32 (userInputs[i]); break }
        case 'uint40'         : { solParam.addUint40 (userInputs[i]); break }
        case 'uint48'         : { solParam.addUint48 (userInputs[i]); break }
        case 'uint56'         : { solParam.addUint56 (userInputs[i]); break }
        case 'uint64'         : { solParam.addUint64 (userInputs[i]); break }
        case 'uint72'         : { solParam.addUint72 (userInputs[i]); break }
        case 'uint80'         : { solParam.addUint80 (userInputs[i]); break }
        case 'uint88'         : { solParam.addUint88 (userInputs[i]); break }
        case 'uint96'         : { solParam.addUint96 (userInputs[i]); break }
        case 'uint104'        : { solParam.addUint104(userInputs[i]); break }
        case 'uint112'        : { solParam.addUint112(userInputs[i]); break }
        case 'uint120'        : { solParam.addUint120(userInputs[i]); break }
        case 'uint128'        : { solParam.addUint128(userInputs[i]); break }
        case 'uint136'        : { solParam.addUint136(userInputs[i]); break }
        case 'uint144'        : { solParam.addUint144(userInputs[i]); break }
        case 'uint152'        : { solParam.addUint152(userInputs[i]); break }
        case 'uint160'        : { solParam.addUint160(userInputs[i]); break }
        case 'uint168'        : { solParam.addUint168(userInputs[i]); break }
        case 'uint176'        : { solParam.addUint176(userInputs[i]); break }
        case 'uint184'        : { solParam.addUint184(userInputs[i]); break }
        case 'uint192'        : { solParam.addUint192(userInputs[i]); break }
        case 'uint200'        : { solParam.addUint200(userInputs[i]); break }
        case 'uint208'        : { solParam.addUint208(userInputs[i]); break }
        case 'uint216'        : { solParam.addUint216(userInputs[i]); break }
        case 'uint224'        : { solParam.addUint224(userInputs[i]); break }
        case 'uint232'        : { solParam.addUint232(userInputs[i]); break }
        case 'uint240'        : { solParam.addUint240(userInputs[i]); break }
        case 'uint248'        : { solParam.addUint248(userInputs[i]); break }
        case 'uint256'        : { solParam.addUint256(userInputs[i]); break }
        case 'int8'           : { solParam.addInt8   (userInputs[i]); break }  
        case 'int16'          : { solParam.addInt16  (userInputs[i]); break }   
        case 'int24'          : { solParam.addInt24  (userInputs[i]); break }
        case 'int32'          : { solParam.addInt32  (userInputs[i]); break }
        case 'int40'          : { solParam.addInt40  (userInputs[i]); break }
        case 'int48'          : { solParam.addInt48  (userInputs[i]); break }
        case 'int56'          : { solParam.addInt56  (userInputs[i]); break }
        case 'int64'          : { solParam.addInt64  (userInputs[i]); break }
        case 'int72'          : { solParam.addInt72  (userInputs[i]); break }
        case 'int80'          : { solParam.addInt80  (userInputs[i]); break }
        case 'int88'          : { solParam.addInt88  (userInputs[i]); break }
        case 'int96'          : { solParam.addInt96  (userInputs[i]); break }
        case 'int104'         : { solParam.addInt104 (userInputs[i]); break }
        case 'int112'         : { solParam.addInt112 (userInputs[i]); break }
        case 'int120'         : { solParam.addInt120 (userInputs[i]); break }
        case 'int128'         : { solParam.addInt128 (userInputs[i]); break }
        case 'int136'         : { solParam.addInt136 (userInputs[i]); break }
        case 'int144'         : { solParam.addInt144 (userInputs[i]); break }
        case 'int152'         : { solParam.addInt152 (userInputs[i]); break }
        case 'int160'         : { solParam.addInt160 (userInputs[i]); break }
        case 'int168'         : { solParam.addInt168 (userInputs[i]); break }
        case 'int176'         : { solParam.addInt176 (userInputs[i]); break }
        case 'int184'         : { solParam.addInt184 (userInputs[i]); break }
        case 'int192'         : { solParam.addInt192 (userInputs[i]); break }
        case 'int200'         : { solParam.addInt200 (userInputs[i]); break }
        case 'int208'         : { solParam.addInt208 (userInputs[i]); break }
        case 'int216'         : { solParam.addInt216 (userInputs[i]); break }
        case 'int224'         : { solParam.addInt224 (userInputs[i]); break }
        case 'int232'         : { solParam.addInt232 (userInputs[i]); break }
        case 'int240'         : { solParam.addInt240 (userInputs[i]); break }
        case 'int248'         : { solParam.addInt248 (userInputs[i]); break }
        case 'int256'         : { solParam.addInt256 (userInputs[i]); break }
        default       : 
          { 
            console.error(`Error! Abi type ${abiInputs[i].type} is not supported!`)
            process.exit(1)
            break
          }
            
      }
      cl("user arg = ", userInputs[i], "*** abi arg = ", abiInputs[i])
    } 
  }
  return solParam
}

// FIXME better name, maybe functionResults, functionOutputs, etc
const getContractResult = (queryResponse, abiOutputs) => {
  debugger
  let result = []
  if (abiOutputs.length > 0) {
    for (let i = 0; i < abiOutputs.length; i++) { 
      switch(abiOutputs[i].type) {
        case 'string'         : { result.push(queryResponse.getString (i)); break }
        case 'bytes'          : { result.push(queryResponse.getBytes  (i)); break }  
        case 'bytes32'        : { result.push(queryResponse.getBytes32(i)); break }
        case 'bool'           : { result.push(queryResponse.getBool   (i)); break }
        case 'address'        : { result.push(queryResponse.getAddress(i)); break }
        case 'uint8'          : { result.push(queryResponse.getUint8  (i)); break }
        case 'uint16'         : { result.push(queryResponse.getUint16 (i)); break }
        case 'uint24'         : { result.push(queryResponse.getUint24 (i)); break }
        case 'uint32'         : { result.push(queryResponse.getUint32 (i)); break }
        case 'uint40'         : { result.push(queryResponse.getUint40 (i)); break }
        case 'uint48'         : { result.push(queryResponse.getUint48 (i)); break }
        case 'uint56'         : { result.push(queryResponse.getUint56 (i)); break }
        case 'uint64'         : { result.push(queryResponse.getUint64 (i)); break }
        case 'uint72'         : { result.push(queryResponse.getUint72 (i)); break }
        case 'uint80'         : { result.push(queryResponse.getUint80 (i)); break }
        case 'uint88'         : { result.push(queryResponse.getUint88 (i)); break }
        case 'uint96'         : { result.push(queryResponse.getUint96 (i)); break }
        case 'uint104'        : { result.push(queryResponse.getUint104(i)); break }
        case 'uint112'        : { result.push(queryResponse.getUint112(i)); break }
        case 'uint120'        : { result.push(queryResponse.getUint120(i)); break }
        case 'uint128'        : { result.push(queryResponse.getUint128(i)); break }
        case 'uint136'        : { result.push(queryResponse.getUint136(i)); break }
        case 'uint144'        : { result.push(queryResponse.getUint144(i)); break }
        case 'uint152'        : { result.push(queryResponse.getUint152(i)); break }
        case 'uint160'        : { result.push(queryResponse.getUint160(i)); break }
        case 'uint168'        : { result.push(queryResponse.getUint168(i)); break }
        case 'uint176'        : { result.push(queryResponse.getUint176(i)); break }
        case 'uint184'        : { result.push(queryResponse.getUint184(i)); break }
        case 'uint192'        : { result.push(queryResponse.getUint192(i)); break }
        case 'uint200'        : { result.push(queryResponse.getUint200(i)); break }
        case 'uint208'        : { result.push(queryResponse.getUint208(i)); break }
        case 'uint216'        : { result.push(queryResponse.getUint216(i)); break }
        case 'uint224'        : { result.push(queryResponse.getUint224(i)); break }
        case 'uint232'        : { result.push(queryResponse.getUint232(i)); break }
        case 'uint240'        : { result.push(queryResponse.getUint240(i)); break }
        case 'uint248'        : { result.push(queryResponse.getUint248(i)); break }
        case 'uint256'        : { result.push(queryResponse.getUint256(i)); break }
        case 'int8'           : { result.push(queryResponse.getInt8   (i)); break }  
        case 'int16'          : { result.push(queryResponse.getInt16  (i)); break }   
        case 'int24'          : { result.push(queryResponse.getInt24  (i)); break }
        case 'int32'          : { result.push(queryResponse.getInt32  (i)); break }
        case 'int40'          : { result.push(queryResponse.getInt40  (i)); break }
        case 'int48'          : { result.push(queryResponse.getInt48  (i)); break }
        case 'int56'          : { result.push(queryResponse.getInt56  (i)); break }
        case 'int64'          : { result.push(queryResponse.getInt64  (i)); break }
        case 'int72'          : { result.push(queryResponse.getInt72  (i)); break }
        case 'int80'          : { result.push(queryResponse.getInt80  (i)); break }
        case 'int88'          : { result.push(queryResponse.getInt88  (i)); break }
        case 'int96'          : { result.push(queryResponse.getInt96  (i)); break }
        case 'int104'         : { result.push(queryResponse.getInt104 (i)); break }
        case 'int112'         : { result.push(queryResponse.getInt112 (i)); break }
        case 'int120'         : { result.push(queryResponse.getInt120 (i)); break }
        case 'int128'         : { result.push(queryResponse.getInt128 (i)); break }
        case 'int136'         : { result.push(queryResponse.getInt136 (i)); break }
        case 'int144'         : { result.push(queryResponse.getInt144 (i)); break }
        case 'int152'         : { result.push(queryResponse.getInt152 (i)); break }
        case 'int160'         : { result.push(queryResponse.getInt160 (i)); break }
        case 'int168'         : { result.push(queryResponse.getInt168 (i)); break }
        case 'int176'         : { result.push(queryResponse.getInt176 (i)); break }
        case 'int184'         : { result.push(queryResponse.getInt184 (i)); break }
        case 'int192'         : { result.push(queryResponse.getInt192 (i)); break }
        case 'int200'         : { result.push(queryResponse.getInt200 (i)); break }
        case 'int208'         : { result.push(queryResponse.getInt208 (i)); break }
        case 'int216'         : { result.push(queryResponse.getInt216 (i)); break }
        case 'int224'         : { result.push(queryResponse.getInt224 (i)); break }
        case 'int232'         : { result.push(queryResponse.getInt232 (i)); break }
        case 'int240'         : { result.push(queryResponse.getInt240 (i)); break }
        case 'int248'         : { result.push(queryResponse.getInt248 (i)); break }
        case 'int256'         : { result.push(queryResponse.getInt256 (i)); break }
        default       : 
          { 
            console.error(`Error! Abi type ${abiInputs[i].type} is not supported!`)
            process.exit(1)
            break
          }
            
      }
      cl("*** abi outputs = ", abiOutputs[i])
    } 
  }
  return result
}

exports.buildContractParams  = buildContractParams 
exports.getContractResult    = getContractResult 


/* TODO
        case 'function'       : { solParam.addFunction(addr, selector) // TODO
        case 'stringArray'    : { solParam.addStringArray 
        case 'bytesArray'     : { solParam.addBytesArray 
        case 'bytes32Array'   : { solParam.addBytes32Array 
        case 'addressArray'   : { solParam.addAddressArray 
        case 'uint8Array'     : { solParam.addUint8Array 
        case 'uint16Array'    : { solParam.addUint16Array 
        case 'uint24Array'    : { solParam.addUint24Array 
        case 'uint32Array'    : { solParam.addUint32Array 
        case 'uint40Array'    : { solParam.addUint40Array 
        case 'uint48Array'    : { solParam.addUint48Array 
        case 'uint56Array'    : { solParam.addUint56Array 
        case 'uint64Array'    : { solParam.addUint64Array 
        case 'uint72Array'    : { solParam.addUint72Array 
        case 'uint80Array'    : { solParam.addUint80Array 
        case 'uint88Array'    : { solParam.addUint88Array 
        case 'uint96Array'    : { solParam.addUint96Array 
        case 'uint104Array'   : { solParam.addUint104Array 
        case 'uint112Array'   : { solParam.addUint112Array 
        case 'uint120Array'   : { solParam.addUint120Array 
        case 'uint128Array'   : { solParam.addUint128Array 
        case 'uint136Array'   : { solParam.addUint136Array 
        case 'uint144Array'   : { solParam.addUint144Array 
        case 'uint152Array'   : { solParam.addUint152Array 
        case 'uint160Array'   : { solParam.addUint160Array 
        case 'uint168Array'   : { solParam.addUint168Array 
        case 'uint176Array'   : { solParam.addUint176Array 
        case 'uint184Array'   : { solParam.addUint184Array 
        case 'uint192Array'   : { solParam.addUint192Array 
        case 'uint200Array'   : { solParam.addUint200Array 
        case 'uint208Array'   : { solParam.addUint208Array 
        case 'uint216Array'   : { solParam.addUint216Array 
        case 'uint224Array'   : { solParam.addUint224Array 
        case 'uint232Array'   : { solParam.addUint232Array 
        case 'uint240Array'   : { solParam.addUint240Array 
        case 'uint248Array'   : { solParam.addUint248Array 
        case 'uint256Array'   : { solParam.addUint256Array 
        case 'int8Array'      : { solParam.addInt8Array 
        case 'int16Array'     : { solParam.addInt16Array 
        case 'int24Array'     : { solParam.addInt24Array 
        case 'int32Array'     : { solParam.addInt32Array 
        case 'int40Array'     : { solParam.addInt40Array 
        case 'int48Array'     : { solParam.addInt48Array 
        case 'int56Array'     : { solParam.addInt56Array 
        case 'int64Array'     : { solParam.addInt64Array 
        case 'int72Array'     : { solParam.addInt72Array 
        case 'int80Array'     : { solParam.addInt80Array 
        case 'int88Array'     : { solParam.addInt88Array 
        case 'int96Array'     : { solParam.addInt96Array 
        case 'int104Array'    : { solParam.addInt104Array 
        case 'int112Array'    : { solParam.addInt112Array 
        case 'int120Array'    : { solParam.addInt120Array 
        case 'int128Array'    : { solParam.addInt128Array 
        case 'int136Array'    : { solParam.addInt136Array 
        case 'int144Array'    : { solParam.addInt144Array 
        case 'int152Array'    : { solParam.addInt152Array 
        case 'int160Array'    : { solParam.addInt160Array 
        case 'int168Array'    : { solParam.addInt168Array 
        case 'int176Array'    : { solParam.addInt176Array 
        case 'int184Array'    : { solParam.addInt184Array 
        case 'int192Array'    : { solParam.addInt192Array 
        case 'int200Array'    : { solParam.addInt200Array 
        case 'int208Array'    : { solParam.addInt208Array 
        case 'int216Array'    : { solParam.addInt216Array 
        case 'int224Array'    : { solParam.addInt224Array 
        case 'int232Array'    : { solParam.addInt232Array 
        case 'int240Array'    : { solParam.addInt240Array 
        case 'int248Array'    : { solParam.addInt248Array 
        case 'int256Array'    : { solParam.addInt256Array 
*/
