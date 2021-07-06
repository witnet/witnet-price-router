// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "witnet-ethereum-bridge/contracts/Request.sol";

// The bytecode of the EthPrice request that will be sent to Witnet
contract EthPriceRequest is Request {
  constructor () Request(hex"") { }
}
