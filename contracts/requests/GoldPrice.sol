// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "witnet-ethereum-bridge/contracts/Request.sol";

// The bytecode of the GoldPrice request that will be sent to Witnet
contract GoldPriceRequest is Request {
  constructor () Request(hex"") { }
}
