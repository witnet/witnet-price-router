// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "witnet-ethereum-bridge/contracts/Request.sol";

// The bytecode of the BitcoinPrice request that will be sent to Witnet
contract BitcoinPriceRequest is Request {
  constructor () Request(hex"") { }
}
