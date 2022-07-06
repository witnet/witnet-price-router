// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../WitnetPriceFeedRouted.sol";

contract CubeUsdPriceFeed
    is
        WitnetPriceFeedRouted
{
    constructor (IWitnetPriceRouter _witnetPriceRouter)
        WitnetPriceFeedRouted(_witnetPriceRouter)
    {
        require(
            router.supportsCurrencyPair(0xd1ebbd704f16f56a06d38785c157d1ed83d0d72e4a96c0513293580ac7b531cb),
            "CubeUsdPriceFeed: router supports no CUBE/USDT-6"
        );
        require(
            router.supportsCurrencyPair(0x538f5a25b39995a23c24037d2d38f979c8fa7b00d001e897212d936e6f6556ef),
            "CubeUsdPriceFeed: router supports no USDT/USD-6"
        );
        pairs = new bytes32[](2);
        pairs[0] = 0xd1ebbd704f16f56a06d38785c157d1ed83d0d72e4a96c0513293580ac7b531cb;
        pairs[1] = 0x538f5a25b39995a23c24037d2d38f979c8fa7b00d001e897212d936e6f6556ef;
    }

    /// @dev Derive price from given sources.
    /// @param _prices Array of last prices for each one of the currency pairs specified on constructor,
    /// in the same order as they were specified.
    function _calculate(int256[] memory _prices)
        internal pure
        override
        returns (int256)
    {
        return (_prices[0] * _prices[1]) / 10 ** 6;
    }
}
