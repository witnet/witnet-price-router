// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "witnet-solidity-bridge/contracts/libs/Witnet.sol";
import "witnet-solidity-bridge/contracts/WitnetRequestBoard.sol";

interface IERC2362PricePoller {
    event PricePolling(address from, uint256 fee);

    function lastPrice() external view returns (int256);
    function lastTimestamp() external view returns (uint256);    
    function lastValue() external view returns (int, uint, bytes32);
    function latestErrorMessage() external view returns (string memory);
    function latestStatus() external view returns (uint256);
    function pendingUpdate() external view returns (bool);

    function requestUpdate() external payable;
}
