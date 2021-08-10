// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "witnet-ethereum-bridge/contracts/libs/WitnetData.sol";

contract WitnetRequestInitializable is WitnetRequest {
    constructor() WitnetRequest(hex"") {}

    /// @dev A `WitnetRequest` is constructed around a `bytes memory` value containing a well-formed Witnet data request serialized
    /// using Protocol Buffers. However, we cannot verify its validity at this point. This implies that contracts using
    /// the WRB should not be considered trustless before a valid Proof-of-Inclusion has been posted for the requests.
    /// @param _bytecode Raw Witnet Radon script, in bytes.
    function initialize(bytes calldata _bytecode) external {
      require(bytecode.length == 0, "WitnetRequestInitializable: already initialized");
      bytecode = _bytecode;
    }
}
