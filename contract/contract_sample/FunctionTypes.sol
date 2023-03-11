// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

contract FunctionTypes {
    uint public value;
    address payable public owner;

    constructor() {
        value = 0;
        owner = payable(msg.sender);
    }

    function setValue(uint newValue) public {
        value = newValue;
    }

    function getValue() public view returns (uint) {
        return value;
    }

    function doubleValue() public pure returns (uint) {
        return 2;
    }

    function addValue() public payable {
        value += msg.value;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }

    function updateValue(uint newValue) public onlyOwner {
        value = newValue;
    }

//   fallback() external payable {
//       addValue();
//   }
}

